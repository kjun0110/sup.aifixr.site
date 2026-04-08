'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import type { InputHTMLAttributes, ReactNode } from "react";
import { 
  ArrowLeft, 
  Download, 
  Building2, 
  MapPin, 
  Package, 
  TrendingUp,
  Info,
  AlertCircle,
  Plus,
  X,
  ListPlus,
  Trash2,
  Upload,
  Send,
  ChevronDown,
  TableProperties,
} from "lucide-react";
import { EprCo2eFactorPickerModal } from "@/app/components/EprCo2eFactorPickerModal";
import { FacilitiesTab } from "./SupplierDetailFacilitiesTabNew";
import { toast } from 'sonner';
import {
  restoreSupSessionFromCookie,
  AIFIXR_SESSION_UPDATED_EVENT,
} from "@/lib/api/client";
import {
  getSupDataMgmtMonthlyDetail,
  getSupDataMgmtMonthlyExportXlsx,
  postSupDataMgmtImportPreview,
  putSupDataMgmtMonthlySave,
  SUP_DETAIL_TAB_TO_SHEET_ID,
  type SupImportPreviewResponse,
} from "@/lib/api/data-mgmt";
import {
  getMySupplierProfile,
  type SupplierProfileMe,
} from "@/lib/api/supplierProfile";
import {
  getMyProjectDetail,
  type SupplierProject,
} from "@/lib/api/supply-chain";
import {
  countryKoLabelFromCode,
  getIso3166Alpha2KoOptions,
} from "@/lib/iso3166Alpha2Ko";

/** 데이터관리에서 쿼리로 진입 시 supplierName은 한글일 수 있음. 이메일 더미는 URL 인코딩하지 않고 라우트 ID 기반으로 둡니다. */
/** 라우트 `projectId`: 숫자 또는 `real-{id}` → API용 프로젝트 PK */
function parseSupplierDetailProjectPk(projectId: string | undefined): number | null {
  if (!projectId) return null;
  const s = String(projectId).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const m = /^real-(\d+)$/i.exec(s);
  return m ? parseInt(m[1], 10) : null;
}

function mockCeoEmailFromSupplierId(supplierRouteId: string) {
  const slug =
    supplierRouteId
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'supplier';
  return `ceo@${slug}.example.com`;
}

function newRowId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 에너지 정보 탭 — 에너지 유형 후보 */
const ENERGY_TYPE_BASE_OPTIONS = [
  '공업용수',
  '상수',
  '경유',
  '등유',
  '무연탄',
  '벙커C유',
  '석탄',
  '스팀(열병합발전)',
  '액화석유가스(LPG)',
  '전기',
  '산업용 전력',
  '중유',
  '천연가스',
  'LNG',
  '휘발유',
] as const;

function normalizeEnergyTypeForUi(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const key = s.toLowerCase().replace(/\s+/g, '');
  const map: Record<string, string> = {
    electricity: '전기',
    steam_chp: '스팀(열병합발전)',
    natural_gas: '천연가스',
    industrial_water: '공업용수',
    tap_water: '상수',
    diesel: '경유',
    kerosene: '등유',
    anthracite: '무연탄',
    bunker_c: '벙커C유',
    coal: '석탄',
    lpg: '액화석유가스(LPG)',
    heavy_oil: '중유',
    gasoline: '휘발유',
    lng: '천연가스',
    '산업용전력': '전기',
  };
  return map[key] ?? s;
}

/** 에너지 정보 탭 — 에너지 사용량 단위 후보 */
const ENERGY_UNIT_BASE_OPTIONS = ['kg', 'kWh', 'MJ', 'GJ', 'm³'] as const;

/** 생산(납품) 납품 단위 · 자재 투입량 단위 등 공통 후보 (m³=세제곱미터, m²=제곱미터) */
const DELIVERY_AND_INPUT_UNIT_BASE_OPTIONS = [
  'kg',
  'g',
  'ton',
  'ton.km',
  'm³',
  'm²',
  'MJ',
  'kWh',
  'EA',
] as const;

/** 운송수단·연료·물량 단위 — 원청 Tier0 운송 시트와 동일 후보 */
const TRANSPORT_MODE_BASE_OPTIONS = ['육운', '해운', '항공', '철도'] as const;
const TRANSPORT_FUEL_TYPE_BASE_OPTIONS = [
  '경유',
  '휘발유',
  '중유',
  'LNG',
  'LPG',
  '전기',
  '수소',
] as const;
const TRANSPORT_FUEL_QTY_UNIT_BASE_OPTIONS = ['kg', 'ton'] as const;
/** 운송 물량 단위 (원청 HEADERS_TRANSPORT · Tier0와 동일) */
const TRANSPORT_QTY_UNIT_BASE_OPTIONS = ['kg', 'ton', 'ton.km', 'kg.km'] as const;

const EMPTY_PRODUCT_ROW = () => ({
  _rowId: newRowId(),
  materialId: '',
  name: '',
  quantity: '',
  unit: '',
  standardWeight: '',
  defectiveQuantity: '',
  unitWeight: '',
  deliveryDate: '',
  hsCode: '',
  mineralType: '',
  mineralContent: '',
  mineralRatio: '',
  origin: '',
  wasteQuantity: '',
  wasteQuantityUnit: '',
  wasteEmissionFactor: '',
  wasteEmissionFactorUnit: '',
});

const EMPTY_CONTACT_ROW = () => ({
  department: '',
  position: '',
  name: '',
  email: '',
  phone: '',
});

const EMPTY_PRODUCTION_ROW = () => ({
  _rowId: newRowId(),
  inputCategory: '',
  inputName: '',
  inputQuantity: '',
  inputUnit: '',
  inputRatio: '',
  energyType: '',
  energyUsage: '',
  energyUnit: '',
  transportType: '',
  transportMethod: '',
  origin: '',
  destination: '',
  standardWeight: '',
  actualWeight: '',
  output: '',
  loss: '',
  waste: '',
  emissionFactor: '',
});

const EMPTY_MATERIAL_ROW = () => ({
  _rowId: newRowId(),
  productName: '',
  inputMaterialName: '',
  inputAmount: '',
  inputAmountUnit: '',
  materialEmissionFactor: '',
  materialEmissionFactorUnit: '',
  mineralType: '',
  mineralAmount: '',
  mineralAmountUnit: '',
  mineralOrigin: '',
  mineralEmissionFactor: '',
  mineralEmissionFactorUnit: '',
});

const EMPTY_ENERGY_ROW = () => ({
  _rowId: newRowId(),
  productName: '',
  energyType: '',
  energyUsage: '',
  energyUnit: '',
  emissionFactor: '',
  emissionFactorUnit: '',
});

const EMPTY_TRANSPORT_ROW = () => ({
  _rowId: newRowId(),
  productName: '',
  originCountry: '',
  originAddress: '',
  destinationCountry: '',
  destinationAddress: '',
  transportMethod: '',
  transportFuelType: '',
  transportFuelQty: '',
  transportFuelQtyUnit: '',
  transportAmount: '',
  transportAmountUnit: '',
  emissionFactor: '',
  emissionFactorUnit: '',
});

/**
 * API·엑셀(snake_case)과 화면(camelCase) 병행 지원. 원청 export 시트(운송정보) 열과 동일 의미.
 */
function normalizeTransportRowFromSource(
  r: Record<string, unknown>,
  preserveRowId?: string | null,
): Record<string, unknown> {
  const str = (v: unknown) => (v == null ? '' : String(v));
  const rowId =
    (typeof preserveRowId === 'string' && preserveRowId) ||
    (typeof r._rowId === 'string' && r._rowId) ||
    newRowId();
  return {
    _rowId: rowId,
    productName: str(r.productName) || str(r.product_name),
    originCountry:
      str(r.originCountry) ||
      str(r.origin_country_code) ||
      str(r.origin_country),
    originAddress:
      str(r.originAddress) || str(r.origin_address_detail) || str(r.origin),
    destinationCountry:
      str(r.destinationCountry) ||
      str(r.dest_country_code) ||
      str(r.destination_country),
    destinationAddress:
      str(r.destinationAddress) ||
      str(r.destination_address_detail) ||
      str(r.destination),
    transportMethod: transportModeApiToUi(
      str(r.transportMethod) || str(r.transport_mode),
    ),
    transportFuelType: str(r.transportFuelType) || str(r.transport_fuel_type),
    transportFuelQty: str(r.transportFuelQty) || str(r.transport_fuel_qty),
    transportFuelQtyUnit:
      str(r.transportFuelQtyUnit) || str(r.transport_fuel_qty_unit),
    transportAmount: str(r.transportAmount) || str(r.transport_qty),
    transportAmountUnit: str(r.transportAmountUnit) || str(r.transport_qty_unit),
    emissionFactor: str(r.emissionFactor) || str(r.transport_emission_factor),
    emissionFactorUnit:
      str(r.emissionFactorUnit) || str(r.transport_emission_factor_unit),
  };
}

/** 백엔드 `SupTransportMode` — UI 한글·영문 코드 모두 허용 */
const SUP_TRANSPORT_MODE_KO_TO_API: Record<string, "land" | "sea" | "air" | "rail"> = {
  육운: "land",
  해운: "sea",
  항공: "air",
  철도: "rail",
};

const SUP_TRANSPORT_API_TO_UI_KO: Record<string, string> = {
  land: "육운",
  sea: "해운",
  air: "항공",
  rail: "철도",
};

function transportModeApiToUi(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  if (SUP_TRANSPORT_API_TO_UI_KO[lower]) return SUP_TRANSPORT_API_TO_UI_KO[lower];
  if (SUP_TRANSPORT_MODE_KO_TO_API[s]) return s;
  return s;
}

function supTransportModeToApi(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const lower = t.toLowerCase();
  if (["land", "sea", "air", "rail"].includes(lower)) return lower;
  const ko = SUP_TRANSPORT_MODE_KO_TO_API[t];
  if (ko) return ko;
  if (/트럭|truck|톤|육|도로|land|화물차|카고/i.test(t)) return "land";
  if (/선박|ship|해운|vessel|컨테이너|sea|항만/i.test(t)) return "sea";
  if (/항공|air|flight|비행/i.test(t)) return "air";
  if (/철도|rail|train|기차|철길/i.test(t)) return "rail";
  return undefined;
}

function mapDeliveredApiToProductRow(
  d: Record<string, unknown>,
  reportingYear: number,
  reportingMonth: number,
): Record<string, unknown> {
  const iso = d.delivery_date != null ? String(d.delivery_date) : "";
  let deliveryDate = "";
  if (iso && /^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const y = parseInt(iso.slice(0, 4), 10);
    const m = parseInt(iso.slice(5, 7), 10);
    const day = parseInt(iso.slice(8, 10), 10);
    if (y === reportingYear && m === reportingMonth) {
      deliveryDate = String(day);
    } else {
      deliveryDate = iso.slice(0, 10).replace(/-/g, ".");
    }
  }
  return {
    ...EMPTY_PRODUCT_ROW(),
    _rowId: newRowId(),
    name: String(d.product_name ?? ""),
    quantity: String(d.delivery_qty ?? ""),
    unit: String(d.base_unit ?? ""),
    standardWeight: String(d.product_unit_capacity_kg ?? ""),
    defectiveQuantity: String(d.defective_qty ?? ""),
    deliveryDate,
    origin: String(d.mineral_origin ?? ""),
    wasteQuantity: String(d.waste_qty ?? ""),
    wasteQuantityUnit: String(d.waste_qty_unit ?? ""),
    wasteEmissionFactor: String(d.waste_emission_factor ?? ""),
    wasteEmissionFactorUnit: String(d.waste_emission_factor_unit ?? ""),
  };
}

function mapMaterialApiToEditable(m: Record<string, unknown>): Record<string, unknown> {
  return {
    ...EMPTY_MATERIAL_ROW(),
    _rowId: newRowId(),
    productName: String(m.product_name ?? ""),
    inputMaterialName: String(m.input_material_name ?? ""),
    inputAmount: String(m.input_material_qty ?? ""),
    inputAmountUnit: String(m.input_qty_unit ?? ""),
    materialEmissionFactor: String(m.material_emission_factor ?? ""),
    materialEmissionFactorUnit: String(m.material_emission_factor_unit ?? ""),
    mineralType: String(m.input_mineral_type ?? ""),
    mineralAmount: String(m.input_mineral_qty ?? ""),
    mineralAmountUnit: String(m.input_mineral_qty_unit ?? ""),
    mineralOrigin: String(m.mineral_origin ?? ""),
    mineralEmissionFactor: String(m.mineral_emission_factor ?? ""),
    mineralEmissionFactorUnit: String(m.mineral_emission_factor_unit ?? ""),
  };
}

function mapEnergyApiToEditable(e: Record<string, unknown>): Record<string, unknown> {
  return {
    ...EMPTY_ENERGY_ROW(),
    _rowId: newRowId(),
    productName: String(e.product_name ?? ""),
    energyType: normalizeEnergyTypeForUi(e.energy_type),
    energyUsage: String(e.energy_usage ?? ""),
    energyUnit: String(e.energy_unit ?? ""),
    emissionFactor: String(e.energy_emission_factor ?? ""),
    emissionFactorUnit: String(e.energy_emission_factor_unit ?? ""),
  };
}

function mapTransportApiToEditable(t: Record<string, unknown>): Record<string, unknown> {
  const transportMethod = transportModeApiToUi(t.transport_mode);
  return normalizeTransportRowFromSource(
    {
      product_name: t.product_name,
      origin_country_code: t.origin_country_code,
      origin_country: t.origin_country,
      origin_address_detail: t.origin_address_detail,
      dest_country_code: t.dest_country_code,
      destination_country: t.destination_country,
      destination_address_detail: t.destination_address_detail,
      transport_mode: transportMethod,
      transport_fuel_type: t.transport_fuel_type,
      transport_fuel_qty: t.transport_fuel_qty,
      transport_fuel_qty_unit: t.transport_fuel_qty_unit,
      transport_qty: t.transport_qty,
      transport_qty_unit: t.transport_qty_unit,
      transport_emission_factor: t.transport_emission_factor,
      transport_emission_factor_unit: t.transport_emission_factor_unit,
    },
    null,
  );
}

function supIso3166Alpha2(v: unknown): string | undefined {
  const s = String(v ?? "")
    .trim()
    .toUpperCase();
  return /^[A-Z]{2}$/.test(s) ? s : undefined;
}

function parseDeliveryDateIso(raw: unknown): string | undefined {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  const normalized = s.replace(/\./g, "-").replace(/\//g, "-");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

/** 납품일: 조회 연·월 기준 일(1~31) 숫자만, 또는 기존 ISO/날짜 문자열 */
function parseDeliveryDateForSave(
  raw: unknown,
  reportingYear: number,
  reportingMonth: number,
): string | undefined {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  const n = parseInt(s, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= 31) {
    const d = new Date(reportingYear, reportingMonth - 1, n);
    if (
      d.getFullYear() !== reportingYear ||
      d.getMonth() !== reportingMonth - 1 ||
      d.getDate() !== n
    ) {
      return undefined;
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return parseDeliveryDateIso(raw);
}

/** 자재·에너지·운송 탭 제품명 컬럼 안내 (계약 품목 + 생산제품 탭 연동) */
const PRODUCT_NAME_DROPDOWN_HINT =
  '제품명 후보는 프로젝트 계약상 직상위(1차) 납품 품목에서 오며, [생산(납품) 제품 정보] 탭에 입력한 제품명도 함께 쓰입니다.';

function ProductNameDropdownNotice() {
  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-[2px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-extrabold leading-none sm:h-7 sm:w-7 sm:text-[13px]"
        style={{
          borderColor: '#FCA5A5', // red-300
          color: '#B91C1C', // red-700 (not too neon)
          backgroundColor: '#FEF2F2', // red-50
        }}
        aria-hidden
      >
        !
      </span>
      <span
        className="text-base leading-relaxed sm:text-[17px]"
        style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}
      >
        {PRODUCT_NAME_DROPDOWN_HINT}
      </span>
    </div>
  );
}

/** 추가입력 불가: 목록 내 검색 후 선택만 가능 */
function SearchableSelectStrict({
  value,
  onChange,
  options,
  placeholder = '검색',
  emptyLabel = '선택',
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [...options];
    return options.filter((o) => o.toLowerCase().includes(s));
  }, [options, q]);

  const display = value.trim() ? value : '';

  return (
    <div className="relative min-w-0 max-w-full" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) setQ('');
        }}
        className={SUP_DETAIL_COMBO_TRIGGER}
      >
        <span className="min-w-0 flex-1 truncate">{display || emptyLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-52 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <input
            ref={searchInputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="box-border w-full border-b border-gray-100 px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--aifix-primary)]"
          />
          <ul className="max-h-40 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                className="w-full px-2 py-1.5 text-left text-sm text-gray-400 hover:bg-gray-50"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                  setQ('');
                }}
              >
                {emptyLabel}
              </button>
            </li>
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-left text-sm text-[var(--aifix-navy)] hover:bg-violet-50"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                    setQ('');
                  }}
                >
                  {opt}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-2 py-2 text-xs text-gray-400">검색 결과 없음</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/** ISO 3166-1 alpha-2 저장 · 한글명 검색/표시 — 팝업(모달)에서 선택 (환경성적표지 계수 모달과 유사 UX) */
function SearchableCountrySelect({
  value,
  onChange,
  placeholder = '국가 검색',
  emptyLabel = '선택',
}: {
  value: string;
  onChange: (alpha2: string) => void;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const entries = useMemo(() => [...getIso3166Alpha2KoOptions()], []);
  const normalized = value.trim().toUpperCase();
  const display = normalized ? countryKoLabelFromCode(normalized) || normalized : '';

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQ('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return entries;
    return entries.filter(
      (e) => e.nameKo.toLowerCase().includes(s) || e.code.toLowerCase().includes(s),
    );
  }, [entries, q]);

  const close = () => {
    setOpen(false);
    setQ('');
  };

  return (
    <div className="relative min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => {
          setQ('');
          setOpen(true);
        }}
        className={SUP_DETAIL_COMBO_TRIGGER}
      >
        <span className="min-w-0 flex-1 truncate">{display || emptyLabel}</span>
        <MapPin className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={close}
        >
          <div
            className="flex max-h-[min(32rem,85vh)] w-full max-w-lg min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="country-picker-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="h-5 w-5 shrink-0 text-[#5B3BFA]" aria-hidden />
                <h2 id="country-picker-title" className="truncate text-lg font-bold text-gray-900">
                  국가 선택
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="shrink-0 space-y-2 border-b border-gray-100 px-5 py-3">
              <input
                ref={searchInputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={placeholder}
                className="box-border w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--aifix-primary)]"
              />
              <p className="text-xs text-gray-500">
                국가명(한글) 또는 ISO 코드로 검색합니다. 선택 시 저장값은 2자 코드(KR, US 등)입니다. ({filtered.length}건
                표시)
              </p>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
              <li>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                  onClick={() => {
                    onChange('');
                    close();
                  }}
                >
                  {emptyLabel}
                </button>
              </li>
              {filtered.map((e) => (
                <li key={e.code}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--aifix-navy)] hover:bg-violet-50"
                    onClick={() => {
                      onChange(e.code);
                      close();
                    }}
                  >
                    {e.nameKo}{' '}
                    <span className="font-mono text-xs text-gray-500">({e.code})</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-gray-400">검색 결과 없음</li>
              )}
            </ul>
            <div className="flex justify-end border-t border-gray-200 px-5 py-3">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 추가입력 가능: 검색 후 목록 선택 또는 새 값 추가 */
function SearchableSelectCreatable({
  value,
  onChange,
  baseOptions,
  placeholder = '검색 또는 입력',
  emptyLabel = '선택',
  allowCreate = true,
}: {
  value: string;
  onChange: (v: string) => void;
  baseOptions: readonly string[];
  placeholder?: string;
  emptyLabel?: string;
  /** false면 목록만 선택(운송 물량 단위 등) */
  allowCreate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [extra, setExtra] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const allOptions = useMemo(() => {
    if (!allowCreate) {
      const s = new Set<string>([...baseOptions]);
      if (value.trim()) s.add(value.trim());
      return Array.from(s);
    }
    const s = new Set<string>([...baseOptions, ...extra]);
    if (value.trim()) s.add(value.trim());
    return Array.from(s);
  }, [allowCreate, baseOptions, extra, value]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return allOptions;
    return allOptions.filter((o) => o.toLowerCase().includes(t));
  }, [allOptions, q]);

  const canAdd =
    allowCreate &&
    q.trim().length > 0 &&
    !allOptions.some((o) => o.toLowerCase() === q.trim().toLowerCase());

  const display = value.trim() ? value : '';

  return (
    <div className="relative min-w-0 max-w-full" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) setQ('');
        }}
        className={SUP_DETAIL_COMBO_TRIGGER}
      >
        <span className="min-w-0 flex-1 truncate">{display || emptyLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-52 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <input
            ref={searchInputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="box-border w-full border-b border-gray-100 px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--aifix-primary)]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && allowCreate && canAdd) {
                e.preventDefault();
                const v = q.trim();
                setExtra((prev) => (prev.includes(v) ? prev : [...prev, v]));
                onChange(v);
                setOpen(false);
                setQ('');
              }
            }}
          />
          <ul className="max-h-40 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                className="w-full px-2 py-1.5 text-left text-sm text-gray-400 hover:bg-gray-50"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                  setQ('');
                }}
              >
                {emptyLabel}
              </button>
            </li>
            {canAdd && (
              <li>
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-left text-sm font-medium text-[var(--aifix-primary)] hover:bg-violet-50"
                  onClick={() => {
                    const v = q.trim();
                    setExtra((prev) => (prev.includes(v) ? prev : [...prev, v]));
                    onChange(v);
                    setOpen(false);
                    setQ('');
                  }}
                >
                  추가: {q.trim()}
                </button>
              </li>
            )}
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-left text-sm text-[var(--aifix-navy)] hover:bg-violet-50"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                    setQ('');
                  }}
                >
                  {opt}
                </button>
              </li>
            ))}
            {filtered.length === 0 && !canAdd && (
              <li className="px-2 py-2 text-xs text-gray-400">검색 결과 없음</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/** 마운트 시 포커스(스크롤 이동 없음) — 표가 흔들리지 않게 */
function InputFocusNoScroll(props: InputHTMLAttributes<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      ref.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return <input ref={ref} {...props} />;
}

/** 표 셀 내 네이티브 select: 포커스 시 레이아웃이 밀리지 않도록 ring-inset 사용 */
const SUP_DETAIL_NATIVE_SELECT =
  'box-border h-8 min-h-[32px] w-full max-w-full rounded-md border border-[#E2E8F0] bg-white px-2 text-sm text-[var(--aifix-navy)] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--aifix-primary)]';

/** 검색형 콤보 트리거 버튼 (테두리 두께·높이 고정) */
const SUP_DETAIL_COMBO_TRIGGER =
  'box-border flex h-8 min-h-[32px] w-full min-w-0 max-w-full items-center justify-between gap-1 rounded-md border border-[#E2E8F0] bg-white px-2 text-left text-sm text-[var(--aifix-navy)] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--aifix-primary)]';

/** 세부 탭 테이블: 열·행 구분선 (grid) */
const SUP_DETAIL_TABLE = 'w-full border-collapse border border-gray-300';
/** 편집 가능한 넓은 표: 열 너비가 입력/표시 전환에 흔들리지 않도록 고정 레이아웃 */
const SUP_DETAIL_TABLE_EDITABLE =
  'w-full min-w-[1200px] table-fixed border-collapse border border-gray-300';
const SUP_DETAIL_TH =
  'border border-gray-300 bg-[#F8F9FA] py-4 px-4 text-left align-middle text-sm font-semibold text-[var(--aifix-navy)]';
const SUP_DETAIL_TD = 'border border-gray-300 py-4 px-4 align-top min-w-0';
const SUP_DETAIL_TD_LABEL =
  'border border-gray-300 bg-[#F9FAFB] py-4 px-4 align-top text-sm font-medium text-[var(--aifix-gray)]';
/** 작업 열: 아이콘 2개만 — table-fixed에서도 폭이 과하게 벌어지지 않게 고정 */
const SUP_DETAIL_TH_ACTION =
  'box-border border border-gray-300 bg-[#F8F9FA] py-3 px-1 text-center align-middle text-xs font-semibold text-[var(--aifix-navy)] whitespace-nowrap w-[72px] max-w-[72px]';
const SUP_DETAIL_TD_ACTION =
  'box-border border border-gray-300 bg-white py-2 px-0.5 align-middle min-w-0 w-[72px] max-w-[72px] whitespace-nowrap group-hover:bg-gray-50';
const SUP_DETAIL_TD_CONTACTS =
  'border border-gray-300 py-4 px-4 align-top text-sm';

// Mock supplier data
const mockSupplierData: Record<string, any> = {
  own: {
    name: "우리회사",
    country: "South Korea",
    location: "Seoul, South Korea",
    type: "배터리 소재 제조",
    supplierType: "Own Company",
    product: "배터리 소재",
    volume: "50,000 kg",
    pcf: "18,450.2 kg CO2e",
    status: "완료",
    companyInfo: {
      registrationNumber: "KR-9876543210",
      dunsNumber: "DUNS-98765432",
      taxId: "TAX-KR-OWN",
      website: "https://ourcompany.co.kr",
      representative: "김대표",
      email: "ceo@ourcompany.co.kr",
      phone: "+82-2-1234-5678",
      rmiSmelter: "인증됨",
      feoc: "해당",
    },
    facilities: [
      {
        id: "FAC-HQ",
        name: "본사",
        country: "South Korea",
        address: "Seoul, South Korea",
        representative: "김대표",
        email: "ceo@ourcompany.co.kr",
        phone: "+82-2-1234-5678",
        renewableEnergy: "사용",
        certification: "ISO 14001, ISO 9001",
        rmiSmelter: "인증됨",
        feoc: "해당",
      },
      {
        id: "FAC-CA",
        name: "천안공장",
        country: "South Korea",
        address: "Cheonan-si, Chungcheongnam-do, South Korea",
        representative: "박공장장",
        email: "park@ourcompany.co.kr",
        phone: "+82-41-1234-5678",
        renewableEnergy: "사용",
        certification: "ISO 14001",
        rmiSmelter: "인증됨",
        feoc: "해당",
      },
    ],
    products: [
      {
        materialId: "MAT-BAT-001",
        name: "배터리 소재",
        quantity: "50,000",
        unit: "kg",
        standardWeight: "1.0",
        unitWeight: "kg",
        hsCode: "2805.30",
        mineralType: "리튬",
        mineralContent: "98.0%",
        mineralRatio: "92%",
        origin: "한국",
      },
    ],
    production: [
      {
        inputCategory: "원자재",
        inputName: "리튬 정련 소재",
        inputQuantity: "52,000",
        inputUnit: "kg",
        inputRatio: "104%",
        energyType: "전기",
        energyUsage: "80,000",
        energyUnit: "kWh",
        transportType: "육운",
        transportMethod: "트럭",
        origin: "천안공장",
        destination: "본사",
        standardWeight: "50,000",
        actualWeight: "49,800",
        output: "49,800",
        loss: "200",
        waste: "180",
        emissionFactor: "0.368",
      },
    ],
    contacts: [
      {
        department: "영업부",
        position: "부장",
        name: "최영업",
        email: "choi@ourcompany.co.kr",
        phone: "+82-10-1111-2222",
      },
      {
        department: "생산부",
        position: "부장",
        name: "정생산",
        email: "jung@ourcompany.co.kr",
        phone: "+82-10-3333-4444",
      },
      {
        department: "품질부",
        position: "과장",
        name: "이품질",
        email: "lee@ourcompany.co.kr",
        phone: "+82-10-5555-6666",
      },
    ],
  },
  supplier1: {
    name: "한국배터리 (Korea Battery Co.)",
    country: "South Korea",
    location: "Cheonan-si, Chungcheongnam-do, South Korea",
    type: "Battery Manufacturer",
    supplierType: "Supplier",
    product: "리튬 정련 소재",
    volume: "36,000 kg",
    pcf: "12,820.4 kg CO2e",
    status: "검토완료",
    companyInfo: {
      registrationNumber: "KR-1234567890",
      dunsNumber: "DUNS-12345678",
      taxId: "TAX-KR-BATTERY",
      website: "https://koreabattery.co.kr",
      representative: "김철수",
      email: "ceo@koreabattery.co.kr",
      phone: "+82-41-1234-5678",
      rmiSmelter: "인증됨",
      feoc: "해당",
    },
    facilities: [
      {
        id: "FAC-001",
        name: "본사",
        country: "South Korea",
        address: "Cheonan-si, Chungcheongnam-do, South Korea",
        representative: "김철수",
        email: "ceo@koreabattery.co.kr",
        phone: "+82-41-1234-5678",
        renewableEnergy: "사용",
        certification: "ISO 14001",
        rmiSmelter: "인증됨",
      feoc: "해당",
      },
    ],
    products: [
      {
        materialId: "MAT-LI-001",
        name: "리튬 정련 소재",
        quantity: "36,000",
        unit: "kg",
        standardWeight: "1.2",
        unitWeight: "kg",
        hsCode: "2805.19",
        mineralType: "리튬",
        mineralContent: "99.5%",
        mineralRatio: "95%",
        origin: "호주",
      },
    ],
    production: [
      {
        inputCategory: "원자재",
        inputName: "리튬 정광",
        inputQuantity: "40,000",
        inputUnit: "kg",
        inputRatio: "110%",
        energyType: "전기",
        energyUsage: "50,000",
        energyUnit: "kWh",
        transportType: "해운",
        transportMethod: "컨테이너선",
        origin: "호주 항구",
        destination: "인천항",
        standardWeight: "36,000",
        actualWeight: "35,800",
        output: "35,800",
        loss: "200",
        waste: "150",
        emissionFactor: "0.358",
      },
    ],
    contacts: [
      {
        department: "영업부",
        position: "부장",
        name: "이영희",
        email: "yh.lee@koreabattery.co.kr",
        phone: "+82-10-1234-5678",
      },
      {
        department: "생산부",
        position: "과장",
        name: "박민수",
        email: "ms.park@koreabattery.co.kr",
        phone: "+82-10-2345-6789",
      },
    ],
  },
};

/** 프로필에 스킴만 넣은 홈페이지는 미입력과 동일 */
function normalizeProfileWebsiteUrl(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (t === "" || t === "https://" || t === "http://") return "";
  return t;
}

/**
 * 본인(own) 상세 — 회사 프로필 API 값만 사용(빈 필드는 mock/쿼리 더미로 채우지 않음).
 * 제목용 회사명만 API가 비었을 때 URL·mock 베이스 이름을 폴백.
 */
function mergeOwnSupplierProfile(
  base: Record<string, any>,
  p: SupplierProfileMe,
): Record<string, any> {
  const contactsFromApi = (p.contacts ?? [])
    .map((c) => ({
      department: (c.department || "").trim() || "—",
      position: (c.position || "").trim() || "—",
      name: (c.name || "").trim() || "—",
      email: (c.email || "").trim() || "—",
      phone: (c.phone || "").trim() || "—",
    }))
    .filter((c) => c.email !== "—" || c.name !== "—" || c.phone !== "—");

  const ci = base.companyInfo ?? {};
  return {
    ...base,
    name: (p.company_name ?? "").trim() || base.name,
    country: (p.country_location ?? "").trim(),
    location: (p.address ?? "").trim(),
    type: (p.supplier_type ?? "").trim(),
    companyInfo: {
      ...ci,
      registrationNumber: (p.business_reg_no ?? "").trim(),
      dunsNumber: (p.duns_number ?? "").trim(),
      taxId: (p.tax_id ?? "").trim(),
      website: normalizeProfileWebsiteUrl(p.website_url),
      representative: (p.rep_name ?? "").trim(),
      email: (p.rep_email ?? "").trim(),
      phone: (p.rep_phone ?? "").trim(),
      rmiSmelter: (p.rmi_certified ?? "").trim(),
      feoc: (p.feoc_status ?? "").trim(),
    },
    contacts: contactsFromApi,
    /** 목/mock 사업장 행 제거 — 상세 사업장 탭은 본사(가상)+API 사업장 목록으로만 표시 */
    facilities: [],
  };
}

/**
 * 회사 프로필 담당자 ↔ 데이터관리 표의 담당자 행이 같은 사람인지 (중복 등록 방지).
 * 이메일이 있으면 이메일로만 매칭, 둘 다 없으면 이름+연락처.
 */
function isSameContactAsEditableRow(
  row: { emailValue: string; nameRaw: string; phoneValue: string },
  editable: Record<string, unknown>,
): boolean {
  const pe = String(editable.email ?? "").trim().toLowerCase();
  const pname = String(editable.name ?? "").trim();
  const pphone = String(editable.phone ?? "").trim();
  if (row.emailValue && pe === row.emailValue.toLowerCase()) return true;
  if (!row.emailValue && !pe && pname === row.nameRaw && pphone === row.phoneValue) return true;
  return false;
}

/** 회사 프로필 `supplier_type`과 동일한 채굴/제련사 문구 */
const SUPPLIER_TYPE_SMELTER_LABEL = "채굴/제련사";

function isSmelterSupplierType(supplierType: string): boolean {
  return supplierType.trim() === SUPPLIER_TYPE_SMELTER_LABEL;
}

/** 빈 값은 조회 화면에서 "미기입" */
function displayCompanyField(value: unknown): string {
  const t = value == null ? "" : String(value).trim();
  return t === "" ? "미기입" : t;
}

/**
 * RMI: 채굴/제련사만 입력 대상. 그 외(제조사·가공사 등) → 해당없음.
 * 제련/가공: 미입력 → 미인증, 입력 시 저장값 그대로(인증·식별 문구 등).
 */
function displayRmiCertification(supplierType: string, rmiStored: unknown): string {
  if (isSmelterSupplierType(supplierType)) {
    const r = rmiStored == null ? "" : String(rmiStored).trim();
    return r === "" ? "미인증" : r;
  }
  return "해당없음";
}

export function SupplierDetail() {
  const params = useParams();
  const supplierId = typeof params.supplierId === 'string' ? params.supplierId : params.supplierId?.[0];
  const projectId = typeof params.projectId === 'string' ? params.projectId : params.projectId?.[0];
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("company-info");
  const [isHQSameFacility, setIsHQSameFacility] = useState<boolean | null>(null);
  const [showFacilityForm, setShowFacilityForm] = useState(false);
  const [newFacility, setNewFacility] = useState({
    id: '',
    name: '',
    country: '',
    address: '',
    representative: '',
    email: '',
    phone: '',
    renewableEnergy: '',
    certification: '',
    rmiSmelter: '',
    feoc: '',
  });
  const [showSupExcelUploadModal, setShowSupExcelUploadModal] = useState(false);
  const [supExcelUploadMergeMode, setSupExcelUploadMergeMode] = useState<"overwrite" | "append">(
    "overwrite",
  );
  const [supImportBusy, setSupImportBusy] = useState(false);
  const [supExcelDragOver, setSupExcelDragOver] = useState(false);
  const [supExcelSelectedFileName, setSupExcelSelectedFileName] = useState("");
  const supExcelFileInputRef = useRef<HTMLInputElement | null>(null);
  /** 이상치(노란) 1차 저장 후 2차 저장 시 `confirm_outlier_ack: true` */
  const supSaveConfirmOutlierRef = useRef(false);
  const [supSaveBusy, setSupSaveBusy] = useState(false);
  const [editableProducts, setEditableProducts] = useState<any[]>([]);
  const [editableProduction, setEditableProduction] = useState<any[]>([]);
  const [editableContacts, setEditableContacts] = useState<any[]>([]);
  const [editableMaterials, setEditableMaterials] = useState<any[]>([]);
  const [editableEnergy, setEditableEnergy] = useState<any[]>([]);
  const [editableTransport, setEditableTransport] = useState<any[]>([]);
  const [facilitiesAddRequest, setFacilitiesAddRequest] = useState(0);

  useEffect(() => {
    if (activeTab !== "facilities") {
      setFacilitiesAddRequest(0);
    }
  }, [activeTab]);
  const [productEditCell, setProductEditCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [productionEditCell, setProductionEditCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [materialEditCell, setMaterialEditCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [energyEditCell, setEnergyEditCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [transportEditCell, setTransportEditCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [eprPickerTarget, setEprPickerTarget] = useState<
    | { kind: 'productWaste' | 'material' | 'mineral' | 'energy' | 'transport'; rowIndex: number }
    | null
  >(null);
  const productEditSnapshotRef = useRef('');
  const productionEditSnapshotRef = useRef('');
  const materialEditSnapshotRef = useRef('');
  const energyEditSnapshotRef = useRef('');
  const transportEditSnapshotRef = useRef('');

  const [showContactRegisterModal, setShowContactRegisterModal] = useState(false);
  const [selectedRegisterContactKeys, setSelectedRegisterContactKeys] = useState<string[]>([]);

  // 탭 선택 엑셀 다운로드용(세부탭별 체크박스)
  const ALL_DETAIL_TAB_IDS = [
    'company-info',
    'facilities',
    'contacts',
    'products',
    'materials',
    'energy',
    'transport',
  ];
  const [selectedExcelDownloadTabs, setSelectedExcelDownloadTabs] = useState<string[]>(
    supplierId === 'own' ? [...ALL_DETAIL_TAB_IDS] : [],
  );
  const [showExcelDownloadModal, setShowExcelDownloadModal] = useState(false);
  const [excelDownloadModalTabs, setExcelDownloadModalTabs] = useState<string[]>(
    supplierId === 'own' ? [...ALL_DETAIL_TAB_IDS] : [],
  );

  useEffect(() => {
    setSelectedExcelDownloadTabs(supplierId === 'own' ? [...ALL_DETAIL_TAB_IDS] : []);
    setExcelDownloadModalTabs(supplierId === 'own' ? [...ALL_DETAIL_TAB_IDS] : []);
  }, [supplierId]);

  // 수정 요청 모달 상태
  const [showRevisionRequestModal, setShowRevisionRequestModal] = useState(false);
  const [revisionRequestTarget, setRevisionRequestTarget] = useState('');
  const [revisionRequestDataType, setRevisionRequestDataType] = useState('');
  const [revisionRequestContent, setRevisionRequestContent] = useState('');

  const [ownProfile, setOwnProfile] = useState<SupplierProfileMe | null>(null);
  const [ownProfileLoading, setOwnProfileLoading] = useState(false);
  /** 1차(직상위) 계약 기준 납품 품목명 — 생산(납품) 제품명 콤보 기본 후보 */
  const [contractDeliverableProductNames, setContractDeliverableProductNames] = useState<string[]>(
    [],
  );
  /** 본인(own) 상단 카드: 직상위차사·계약 품목 등 — `getMyProjectDetail` 응답 */
  const [ownProjectDetailForCard, setOwnProjectDetailForCard] =
    useState<SupplierProject | null>(null);

  const loadOwnProfile = useCallback(async () => {
    setOwnProfileLoading(true);
    try {
      await restoreSupSessionFromCookie();
      const data = await getMySupplierProfile();
      setOwnProfile(data);
    } catch {
      setOwnProfile(null);
    } finally {
      setOwnProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (supplierId !== "own") return;
    void loadOwnProfile();
  }, [supplierId, loadOwnProfile]);

  useEffect(() => {
    if (supplierId !== "own" || typeof window === "undefined") return;
    const onSession = () => {
      void loadOwnProfile();
    };
    window.addEventListener(AIFIXR_SESSION_UPDATED_EVENT, onSession);
    return () => window.removeEventListener(AIFIXR_SESSION_UPDATED_EVENT, onSession);
  }, [supplierId, loadOwnProfile]);

  const projectPkForApi = useMemo(
    () => parseSupplierDetailProjectPk(projectId),
    [projectId],
  );

  const resolveDmSaveContext = useCallback((): {
    projectId: number;
    productId: number;
    supplierId: number;
    productVariantId: number;
    reportingYear: number;
    reportingMonth: number;
  } | null => {
    if (supplierId !== "own" || projectPkForApi == null) return null;
    const qPid = searchParams.get("dmProductId");
    const qSid = searchParams.get("dmSupplierId");
    const qVid = searchParams.get("dmVariantId");
    const qY = searchParams.get("dmYear");
    const qM = searchParams.get("dmMonth");
    const productId =
      qPid != null && qPid !== ""
        ? parseInt(qPid, 10)
        : (ownProjectDetailForCard?.product_id ?? NaN);
    const supplierIdNum =
      qSid != null && qSid !== ""
        ? parseInt(qSid, 10)
        : (ownProjectDetailForCard?.supplier_id ?? NaN);
    const variantRaw =
      qVid != null && qVid !== "" ? parseInt(qVid, 10) : ownProjectDetailForCard?.product_variant_id;
    const productVariantId =
      variantRaw != null && Number.isFinite(variantRaw) && variantRaw >= 1 ? variantRaw : NaN;
    const reportingYear = qY != null && qY !== "" ? parseInt(qY, 10) : NaN;
    const reportingMonth = qM != null && qM !== "" ? parseInt(qM, 10) : NaN;
    if (!Number.isFinite(productId) || !Number.isFinite(supplierIdNum)) return null;
    if (!Number.isFinite(productVariantId) || productVariantId < 1) return null;
    if (!Number.isFinite(reportingYear) || !Number.isFinite(reportingMonth)) return null;
    return {
      projectId: projectPkForApi,
      productId,
      supplierId: supplierIdNum,
      productVariantId,
      reportingYear,
      reportingMonth,
    };
  }, [supplierId, projectPkForApi, searchParams, ownProjectDetailForCard]);

  /** `own` + 데이터관리 컨텍스트일 때 월별 저장분을 API에서 불러와 탭 상태와 동기화 (새로고침 후에도 유지) */
  const loadMonthlyDetailFromApi = useCallback(async () => {
    if (supplierId !== "own") return;
    const ctx = resolveDmSaveContext();
    if (!ctx) {
      setEditableProducts([EMPTY_PRODUCT_ROW()]);
      setEditableMaterials([EMPTY_MATERIAL_ROW()]);
      setEditableEnergy([EMPTY_ENERGY_ROW()]);
      setEditableTransport([EMPTY_TRANSPORT_ROW()]);
      return;
    }
    try {
      await restoreSupSessionFromCookie();
      const detail = await getSupDataMgmtMonthlyDetail({
        projectId: ctx.projectId,
        productId: ctx.productId,
        supplierId: ctx.supplierId,
        reportingYear: ctx.reportingYear,
        reportingMonth: ctx.reportingMonth,
        productVariantId: ctx.productVariantId,
      });
      if (detail.delivered_row) {
        setEditableProducts([
          mapDeliveredApiToProductRow(
            detail.delivered_row,
            ctx.reportingYear,
            ctx.reportingMonth,
          ),
        ]);
      } else {
        setEditableProducts([EMPTY_PRODUCT_ROW()]);
      }
      if (detail.material_rows?.length) {
        setEditableMaterials(detail.material_rows.map(mapMaterialApiToEditable));
      } else {
        setEditableMaterials([EMPTY_MATERIAL_ROW()]);
      }
      if (detail.energy_rows?.length) {
        setEditableEnergy(detail.energy_rows.map(mapEnergyApiToEditable));
      } else {
        setEditableEnergy([EMPTY_ENERGY_ROW()]);
      }
      if (detail.transport_rows?.length) {
        setEditableTransport(detail.transport_rows.map(mapTransportApiToEditable));
      } else {
        setEditableTransport([EMPTY_TRANSPORT_ROW()]);
      }
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "저장된 월별 데이터를 불러오지 못했습니다. 연·월·세부제품이 포함된 링크로 들어왔는지 확인해 주세요.",
      );
    }
  }, [supplierId, resolveDmSaveContext]);

  const loadContractDeliverableProductNames = useCallback(async () => {
    if (supplierId !== "own" || projectPkForApi == null) {
      setContractDeliverableProductNames([]);
      setOwnProjectDetailForCard(null);
      return;
    }
    try {
      await restoreSupSessionFromCookie();
      const detail = await getMyProjectDetail(projectPkForApi);
      setOwnProjectDetailForCard(detail);
      const n = (detail.productName ?? "").trim();
      setContractDeliverableProductNames(n ? [n] : []);
    } catch {
      setContractDeliverableProductNames([]);
      setOwnProjectDetailForCard(null);
    }
  }, [supplierId, projectPkForApi]);

  useEffect(() => {
    void loadContractDeliverableProductNames();
  }, [loadContractDeliverableProductNames]);

  useEffect(() => {
    if (supplierId !== "own" || typeof window === "undefined") return;
    const onSession = () => {
      void loadContractDeliverableProductNames();
    };
    window.addEventListener(AIFIXR_SESSION_UPDATED_EVENT, onSession);
    return () => window.removeEventListener(AIFIXR_SESSION_UPDATED_EVENT, onSession);
  }, [supplierId, loadContractDeliverableProductNames]);

  /** 담당자 등록 모달: 회사 프로필 API `contacts`만 사용 (더미 없음) */
  const companyContactsForRegisterModal = useMemo(() => {
    if (supplierId !== "own" || !ownProfile?.has_profile) return [];
    const list = ownProfile.contacts ?? [];
    return list.map((c, index) => {
      const emailValue = (c.email ?? "").trim();
      const phoneValue = (c.phone ?? "").trim();
      const nameRaw = (c.name ?? "").trim();
      const rowKey = emailValue ? emailValue : `no-email:${index}`;
      return {
        rowKey,
        department: (c.department ?? "").trim() || "미기입",
        position: (c.position ?? "").trim() || "미기입",
        name: nameRaw || "미기입",
        nameRaw,
        emailDisplay: emailValue || "미기입",
        emailValue,
        phoneDisplay: phoneValue || "미기입",
        phoneValue,
      };
    });
  }, [supplierId, ownProfile]);

  const supplierFromQuery = (() => {
    const name = searchParams.get('supplierName');
    if (!name) return null;

    const country = searchParams.get('supplierCountry') ?? '';
    const supplierType = searchParams.get('supplierType') ?? '';
    const volume = searchParams.get('supplierVolume') ?? '';
    const status = searchParams.get('supplierStatus') ?? '';
    const pcf = searchParams.get('supplierPcfStatus') ?? '';
    const id = supplierId ?? 'unknown';

    // 상세 페이지에서 사용되는 필드들을 최소 구성으로 채웁니다.
    return {
      id,
      name,
      country,
      location: country,
      type: supplierType,
      supplierType: 'Supplier',
      product: '-',
      volume,
      pcf,
      status,
      companyInfo: {
        registrationNumber: `KR-${id.toUpperCase().slice(0, 10).replace(/[^A-Z0-9]/g, '')}`,
        dunsNumber: `DUNS-${id.toUpperCase().slice(0, 10).replace(/[^A-Z0-9]/g, '')}`,
        taxId: `TAX-${id.toUpperCase().slice(0, 10).replace(/[^A-Z0-9]/g, '')}`,
        website: `https://example.com/${encodeURIComponent(id)}`,
        representative: `${name} 대표`,
        email: mockCeoEmailFromSupplierId(id),
        phone: '+82-10-0000-0000',
        rmiSmelter: '미인증',
        feoc: '미해당',
      },
      facilities: [
        {
          id: `FAC-${id}`,
          name: '기본 사업장',
          country,
          address: `${country}`,
          representative: `${name} 대표`,
          email: mockCeoEmailFromSupplierId(id),
          phone: '+82-10-0000-0000',
          renewableEnergy: '미사용',
          certification: '-',
          rmiSmelter: '미인증',
          feoc: '미해당',
        },
      ],
      products: [],
      production: [],
      contacts: [],
    };
  })();

  const supplier = useMemo(() => {
    const base = supplierFromQuery
    ? supplierFromQuery
      : supplierId && mockSupplierData[supplierId as keyof typeof mockSupplierData]
      ? mockSupplierData[supplierId as keyof typeof mockSupplierData]
        : mockSupplierData.supplier1;
    if (supplierId !== "own" || !ownProfile?.has_profile) {
      return base;
    }
    return mergeOwnSupplierProfile(base as Record<string, any>, ownProfile);
  }, [supplierFromQuery, supplierId, ownProfile]);

  const supplierNameKey = searchParams.get('supplierName') ?? '';
  const supplierSyncRef = useRef(supplier);
  supplierSyncRef.current = supplier;

  useEffect(() => {
    const s = supplierSyncRef.current;
    setEditableProduction(
      (s.production ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        _rowId: (r._rowId as string) ?? newRowId(),
      })),
    );
    setEditableContacts([...(s.contacts ?? [])]);

    if (supplierId === "own") {
      return;
    }
    setEditableProducts(
      (() => {
        const rows = (s.products ?? []).map((r: Record<string, unknown>) => ({
          ...r,
          _rowId: (r._rowId as string) ?? newRowId(),
        }));
        return rows.length > 0 ? rows : [EMPTY_PRODUCT_ROW()];
      })(),
    );
    setEditableMaterials(
      (() => {
        const rows = (s.materials ?? []).map((r: Record<string, unknown>) => ({
          ...r,
          _rowId: (r._rowId as string) ?? newRowId(),
        }));
        return rows.length > 0 ? rows : [EMPTY_MATERIAL_ROW()];
      })(),
    );
    setEditableEnergy(
      (() => {
        const rows = (s.energy ?? []).map((r: Record<string, unknown>) => ({
          ...r,
          energyType: normalizeEnergyTypeForUi(r.energyType ?? r.energy_type),
          _rowId: (r._rowId as string) ?? newRowId(),
        }));
        return rows.length > 0 ? rows : [EMPTY_ENERGY_ROW()];
      })(),
    );
    setEditableTransport(
      (() => {
        const rows = (s.transport ?? []).map((r: Record<string, unknown>) =>
          normalizeTransportRowFromSource(r, (r._rowId as string) ?? null),
        );
        return rows.length > 0 ? rows : [EMPTY_TRANSPORT_ROW()];
      })(),
    );
  }, [supplierId, supplierNameKey, ownProfile]);

  useEffect(() => {
    void loadMonthlyDetailFromApi();
  }, [loadMonthlyDetailFromApi]);

  // 권한 정책(협력사 포털):
  // - tier1: 모든 하위차사에게 수정요청 가능
  // - tier2~: "직하위차사"에게만 수정요청 가능
  const projectTierById: Record<string, number> = {
    p1: 1,
    p2: 2,
    p3: 3,
  };

  const currentTierNum = projectId ? (projectTierById[projectId] ?? 1) : 1;

  const getSupplierTierNum = (id: string | undefined) => {
    if (!id) return null;
    if (id === 'own') return currentTierNum;
    const m = id.match(/^tier(\d+)-/);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };

  const targetTierNum = getSupplierTierNum(supplierId);
  const canSendRevisionRequest =
    supplierId !== 'own' &&
    (currentTierNum === 1 ? true : targetTierNum !== null && targetTierNum === currentTierNum + 1);

  const supplierTierNum =
    supplierId === 'own' ? currentTierNum : (targetTierNum ?? null);
  const parentCompanyFromProject = (ownProjectDetailForCard?.clientName ?? '').trim();
  const directUpperTierLabel = (() => {
    if (supplierTierNum === null) return '-';
    if (supplierId === 'own') {
      if (parentCompanyFromProject) return parentCompanyFromProject;
      if (projectId === 'p1' && supplierTierNum === 1) return '삼성SDI';
      return supplierTierNum <= 1 ? '-' : `Tier${supplierTierNum - 1}`;
    }
    return supplierTierNum <= 1 ? '원청사' : `Tier${supplierTierNum - 1}`;
  })();

  /** 요약 카드 표기: 미작성 → 미기입 (URL·목 데이터 호환) */
  const normalizePcfSummaryLabel = (v: unknown): string => {
    const t = v == null ? "" : String(v).trim();
    if (t === "" || t === "미작성") return "미기입";
    return t;
  };

  const pcfPartial = normalizePcfSummaryLabel(supplier.pcf);
  const pcfFinal = normalizePcfSummaryLabel(
    projectId === "p1" && supplierId === "own"
      ? "-"
      : supplier.status === "완료" || supplier.status === "검토완료"
        ? supplier.pcf
        : "-",
  );

  const handleOpenRevisionRequest = () => {
    setRevisionRequestTarget(supplier?.name ?? '');
    setRevisionRequestDataType('');
    setRevisionRequestContent('');
    setShowRevisionRequestModal(true);
  };

  const handleSendRevisionRequest = () => {
    if (!revisionRequestDataType) {
      toast.error('요청 데이터 유형을 선택해주세요');
      return;
    }
    if (!revisionRequestContent.trim()) {
      toast.error('요청 내용을 입력해주세요');
      return;
    }
    setShowRevisionRequestModal(false);
    toast.success('요청 전송이 완료되었습니다 (mock)');
  };

  if (!supplier) {
    return (
      <div>
        <div className="text-center">
          <h2 className="text-2xl mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            협력사를 찾을 수 없습니다
          </h2>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl text-white"
            style={{ background: 'var(--aifix-primary)' }}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "company-info", label: "기업 기본정보" },
    { id: "facilities", label: "사업장 정보" },
    { id: "contacts", label: "담당자 정보" },
    { id: "products", label: "생산(납품) 제품 정보" },
    { id: "materials", label: "자재 정보" },
    { id: "energy", label: "에너지 정보" },
    { id: "transport", label: "운송 정보" },
  ];

  const handleExcelDownload = (tabId: string) => {
    const tabLabel = tabs.find((t) => t.id === tabId)?.label ?? tabId;
    toast.success(`${tabLabel} 엑셀 다운로드 준비 (mock)`);
  };

  const handleExcelDownloadSelectedTabs = async (tabIds?: string[]) => {
    if (supplierId !== "own") return;
    const selected = tabIds ?? selectedExcelDownloadTabs;
    if (selected.length === 0) {
      toast.error("엑셀 다운로드에 포함할 세부탭을 1개 이상 선택해주세요.");
      return;
    }

    const sheetNums = Array.from(
      new Set(
        selected
          .map((id) => SUP_DETAIL_TAB_TO_SHEET_ID[id])
          .filter((n): n is number => typeof n === "number"),
      ),
    );
    if (sheetNums.length === 0) {
      toast.error("선택한 탭에 해당하는 시트가 없습니다.");
      return;
    }

    const qPid = searchParams.get("dmProductId");
    const qSid = searchParams.get("dmSupplierId");
    const qVid = searchParams.get("dmVariantId");
    const qY = searchParams.get("dmYear");
    const qM = searchParams.get("dmMonth");

    const productId =
      qPid != null && qPid !== ""
        ? parseInt(qPid, 10)
        : (ownProjectDetailForCard?.product_id ?? NaN);
    const supplierIdNum =
      qSid != null && qSid !== ""
        ? parseInt(qSid, 10)
        : (ownProjectDetailForCard?.supplier_id ?? NaN);
    const variantRaw =
      qVid != null && qVid !== "" ? parseInt(qVid, 10) : ownProjectDetailForCard?.product_variant_id;
    const productVariantId =
      variantRaw != null && Number.isFinite(variantRaw) && variantRaw >= 1 ? variantRaw : null;
    const reportingYear = qY != null && qY !== "" ? parseInt(qY, 10) : NaN;
    const reportingMonth = qM != null && qM !== "" ? parseInt(qM, 10) : NaN;

    if (projectPkForApi == null) {
      toast.error("프로젝트를 식별할 수 없습니다.");
      return;
    }
    if (!Number.isFinite(productId) || !Number.isFinite(supplierIdNum)) {
      toast.error("제품·협력사 정보가 없습니다. 데이터 관리에서 상세보기로 다시 들어와 주세요.");
      return;
    }
    if (!Number.isFinite(reportingYear) || !Number.isFinite(reportingMonth)) {
      toast.error("조회 기간(연·월)이 없습니다. 데이터 관리에서 기간을 선택한 뒤 상세보기로 들어와 주세요.");
      return;
    }

    const exportLabel =
      searchParams.get("dmExportLabel")?.trim() ||
      ownProjectDetailForCard?.productName?.trim() ||
      ownProjectDetailForCard?.name?.trim() ||
      "";

    const safeFilenameSegment = (raw: string, maxLen = 72): string => {
      let s = raw.trim();
      for (const ch of '\\/:*?"<>|') s = s.split(ch).join("_");
      s = s.replace(/\s+/g, " ").trim();
      if (s.length > maxLen) s = `${s.slice(0, maxLen - 3)}...`;
      return s || "데이터";
    };

    try {
      await restoreSupSessionFromCookie();
      const { blob, filename } = await getSupDataMgmtMonthlyExportXlsx({
        projectId: projectPkForApi,
        productId,
        supplierId: supplierIdNum,
        reportingYear,
        reportingMonth,
        productVariantId,
        sheets: sheetNums.join(","),
        filenameHint: exportLabel || null,
      });
      const padM = String(reportingMonth).padStart(2, "0");
      const fallbackName = exportLabel
        ? `${reportingYear}-${padM}, ${safeFilenameSegment(exportLabel)} 데이터.xlsx`
        : `${reportingYear}-${padM}, 데이터.xlsx`;
      const downloadName = (filename && filename.trim()) || fallbackName;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("엑셀 파일을 저장했습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "엑셀 다운로드에 실패했습니다.");
    }
  };

  const handleExcelUploadClick = (_tabId: string) => {
    if (supplierId !== "own") return;
    setShowSupExcelUploadModal(true);
  };

  const applySupImportPreviewToState = (preview: SupImportPreviewResponse, mode: "overwrite" | "append") => {
    if (preview.warnings?.length) {
      toast.message(preview.warnings.join("\n"), { duration: 8000 });
    }

    const mappedContacts = (preview.workplace_contacts ?? []).map((c) => ({
      department: c.department ?? "",
      position: [c.position, c.job_title]
        .filter((x) => (x ?? "").toString().trim())
        .join(" / "),
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
    }));

    const mappedMaterials = (preview.materials ?? []).map((m) => ({
      ...EMPTY_MATERIAL_ROW(),
      _rowId: newRowId(),
      productName: m.detail_product_name ?? "",
      inputMaterialName: m.input_material_name ?? "",
      inputAmount: m.input_amount ?? "",
      inputAmountUnit: m.input_amount_unit ?? "",
      materialEmissionFactor: m.material_emission_factor ?? "",
      materialEmissionFactorUnit: m.material_emission_factor_unit ?? "",
      mineralType: m.mineral_type ?? "",
      mineralAmount: m.mineral_amount ?? "",
      mineralAmountUnit: m.mineral_amount_unit ?? "",
      mineralOrigin: m.mineral_origin ?? "",
      mineralEmissionFactor: m.mineral_emission_factor ?? "",
      mineralEmissionFactorUnit: m.mineral_emission_factor_unit ?? "",
    }));

    const mappedEnergy = (preview.energy_rows ?? []).map((e) => ({
      ...EMPTY_ENERGY_ROW(),
      _rowId: newRowId(),
      productName: e.detail_product_name ?? "",
      energyType: normalizeEnergyTypeForUi(e.energy_type),
      energyUsage: e.energy_usage ?? "",
      energyUnit: e.energy_unit ?? "",
      emissionFactor: e.energy_emission_factor ?? "",
      emissionFactorUnit: e.energy_emission_factor_unit ?? "",
    }));

    const mappedProducts = (preview.production_rows ?? []).map((pr) => ({
      ...EMPTY_PRODUCT_ROW(),
      _rowId: newRowId(),
      name: pr.detail_product_name ?? "",
      deliveryDate: pr.delivery_day ?? "",
      quantity: pr.production_qty ?? "",
      unit: pr.production_qty_unit ?? "",
      standardWeight: pr.product_unit_capacity_kg ?? "",
      defectiveQuantity: pr.defective_qty ?? "",
      wasteQuantity: pr.waste_qty ?? "",
      wasteQuantityUnit: pr.waste_qty_unit ?? "",
      wasteEmissionFactor: pr.waste_emission_factor ?? "",
      wasteEmissionFactorUnit: pr.waste_emission_factor_unit ?? "",
    }));

    const mappedTransport = (preview.transport_rows ?? []).map((t) =>
      normalizeTransportRowFromSource(
        {
          product_name: t.detail_product_name,
          origin_country: t.origin_country,
          origin_address_detail: t.origin_address_detail,
          destination_country: t.destination_country,
          destination_address_detail: t.destination_address_detail,
          transport_mode: t.transport_mode,
          transport_fuel_type: t.transport_fuel_type,
          transport_fuel_qty: t.transport_fuel_qty,
          transport_fuel_qty_unit: t.transport_fuel_qty_unit,
          transport_qty: t.transport_qty,
          transport_qty_unit: t.transport_qty_unit,
          transport_emission_factor: t.transport_emission_factor,
          transport_emission_factor_unit: t.transport_emission_factor_unit,
        },
        null,
      ),
    );

    if (mode === "overwrite") {
      /** 담당자 탭은 프로필·직접 입력 값 유지. 엑셀에 담당자정보 시트 행이 있을 때만 반영 */
      if (mappedContacts.length > 0) {
        setEditableContacts(mappedContacts);
      }
      setEditableMaterials(mappedMaterials.length > 0 ? mappedMaterials : [EMPTY_MATERIAL_ROW()]);
      setEditableEnergy(mappedEnergy.length > 0 ? mappedEnergy : [EMPTY_ENERGY_ROW()]);
      setEditableProducts(mappedProducts.length > 0 ? mappedProducts : [EMPTY_PRODUCT_ROW()]);
      setEditableTransport(mappedTransport.length > 0 ? mappedTransport : [EMPTY_TRANSPORT_ROW()]);
    } else {
      if (mappedContacts.length > 0) {
        setEditableContacts((prev) => [...prev, ...mappedContacts]);
      }
      if (mappedMaterials.length > 0) {
        setEditableMaterials((prev) => [...prev, ...mappedMaterials]);
      }
      if (mappedEnergy.length > 0) {
        setEditableEnergy((prev) => [...prev, ...mappedEnergy]);
      }
      if (mappedProducts.length > 0) {
        setEditableProducts((prev) => [...prev, ...mappedProducts]);
      }
      if (mappedTransport.length > 0) {
        setEditableTransport((prev) => [...prev, ...mappedTransport]);
      }
    }
  };

  const handleSupExcelUploadConfirm = async () => {
    const input = supExcelFileInputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      toast.error("엑셀 파일을 선택해 주세요.");
      return;
    }
    const ctx = resolveDmSaveContext();
    if (!ctx) {
      toast.error(
        "업로드에 필요한 정보가 없습니다. 데이터 관리에서 연·월·세부제품이 포함된 상세 진입 링크로 다시 들어와 주세요.",
      );
      return;
    }
    setSupImportBusy(true);
    try {
      await restoreSupSessionFromCookie();
      const preview = await postSupDataMgmtImportPreview({
        projectId: ctx.projectId,
        productId: ctx.productId,
        supplierId: ctx.supplierId,
        reportingYear: ctx.reportingYear,
        reportingMonth: ctx.reportingMonth,
        file,
      });
      applySupImportPreviewToState(preview, supExcelUploadMergeMode);
      toast.success(
        "엑셀 내용을 화면에 반영했습니다. 확인 후 「수정 완료」를 누르면 DB에 저장됩니다.",
      );
      setShowSupExcelUploadModal(false);
      if (input) input.value = "";
      setSupExcelSelectedFileName("");
      setSupExcelDragOver(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "엑셀 미리보기에 실패했습니다.");
    } finally {
      setSupImportBusy(false);
    }
  };

  const handleSupExcelDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSupExcelDragOver(false);
    const dropped = e.dataTransfer?.files?.[0];
    const input = supExcelFileInputRef.current;
    if (!dropped || !input) return;
    const isExcel =
      dropped.name.toLowerCase().endsWith(".xlsx") || dropped.name.toLowerCase().endsWith(".xlsm");
    if (!isExcel) {
      toast.error("xlsx/xlsm 파일만 업로드할 수 있습니다.");
      return;
    }
    const dt = new DataTransfer();
    dt.items.add(dropped);
    input.files = dt.files;
    setSupExcelSelectedFileName(dropped.name);
  };

  const handleSaveComplete = async () => {
    if (supplierId !== "own") {
      toast.info("하위 협력사 보기에서는 저장할 수 없습니다.");
      return;
    }
    const ctx = resolveDmSaveContext();
    if (!ctx) {
      toast.error(
        "저장에 필요한 정보가 없습니다. 데이터 관리에서 연·월·세부제품이 포함된 상세 진입 링크로 다시 들어와 주세요.",
      );
      return;
    }
    setSupSaveBusy(true);
    try {
      await restoreSupSessionFromCookie();
      const firstProduct = editableProducts.find(
        (p: Record<string, unknown>) =>
          String(p.name ?? "").trim() || String(p.quantity ?? "").trim(),
      );
      const delivered =
        firstProduct != null
          ? {
              delivered_product_name: String(firstProduct.name ?? "").trim() || null,
              mineral_origin: String(firstProduct.origin ?? "").trim() || null,
              delivery_date:
                parseDeliveryDateForSave(
                  firstProduct.deliveryDate,
                  ctx.reportingYear,
                  ctx.reportingMonth,
                ) ?? null,
              delivery_qty: String(firstProduct.quantity ?? "").trim() || null,
              base_unit: String(firstProduct.unit ?? "").trim() || null,
              product_unit_capacity_kg: String(firstProduct.standardWeight ?? "").trim() || null,
              defective_qty: String(firstProduct.defectiveQuantity ?? "").trim() || null,
              waste_qty: String(firstProduct.wasteQuantity ?? "").trim() || null,
              waste_qty_unit: String(firstProduct.wasteQuantityUnit ?? "").trim() || null,
              waste_emission_factor: String(firstProduct.wasteEmissionFactor ?? "").trim() || null,
              waste_emission_factor_unit: String(firstProduct.wasteEmissionFactorUnit ?? "").trim() || null,
            }
          : null;
      const hasDeliveredField =
        delivered != null &&
        Object.values(delivered).some((v) => v != null && String(v).trim() !== "");
      const material_rows = editableMaterials
        .filter((r: Record<string, unknown>) => {
          return (
            String(r.productName ?? "").trim() ||
            String(r.inputMaterialName ?? "").trim() ||
            String(r.inputAmount ?? "").trim() ||
            String(r.mineralType ?? "").trim()
          );
        })
        .map((r: Record<string, unknown>) => ({
          product_name: String(r.productName ?? "").trim(),
          input_material_name: String(r.inputMaterialName ?? "").trim(),
          input_material_qty: String(r.inputAmount ?? "").trim(),
          input_qty_unit: String(r.inputAmountUnit ?? "").trim(),
          material_emission_factor: String(r.materialEmissionFactor ?? "").trim(),
          material_emission_factor_unit: String(r.materialEmissionFactorUnit ?? "").trim(),
          input_mineral_type: String(r.mineralType ?? "").trim(),
          input_mineral_qty: String(r.mineralAmount ?? "").trim(),
          input_mineral_qty_unit: String(r.mineralAmountUnit ?? "").trim(),
          mineral_origin: String(r.mineralOrigin ?? "").trim(),
          mineral_emission_factor: String(r.mineralEmissionFactor ?? "").trim(),
          mineral_emission_factor_unit: String(r.mineralEmissionFactorUnit ?? "").trim(),
        }));
      const energy_rows = editableEnergy
        .filter(
          (r: Record<string, unknown>) =>
            String(r.productName ?? "").trim() ||
            String(r.energyType ?? "").trim() ||
            String(r.energyUsage ?? "").trim(),
        )
        .map((r: Record<string, unknown>) => ({
          product_name: String(r.productName ?? "").trim(),
          energy_type: normalizeEnergyTypeForUi(r.energyType),
          energy_usage: String(r.energyUsage ?? "").trim(),
          energy_unit: String(r.energyUnit ?? "").trim(),
          energy_emission_factor: String(r.emissionFactor ?? "").trim(),
          energy_emission_factor_unit: String(r.emissionFactorUnit ?? "").trim(),
        }));
      const transport_rows = editableTransport
        .filter((r: Record<string, unknown>) => {
          return (
            String(r.productName ?? "").trim() ||
            String(r.originCountry ?? "").trim() ||
            String(r.originAddress ?? "").trim() ||
            String(r.destinationCountry ?? "").trim() ||
            String(r.destinationAddress ?? "").trim() ||
            String(r.transportMethod ?? "").trim() ||
            String(r.transportFuelType ?? "").trim() ||
            String(r.transportFuelQty ?? "").trim() ||
            String(r.transportAmount ?? "").trim() ||
            String(r.emissionFactor ?? "").trim()
          );
        })
        .map((r: Record<string, unknown>) => {
          const mode = supTransportModeToApi(String(r.transportMethod ?? ""));
          return {
            product_name: String(r.productName ?? "").trim(),
            origin_country: String(r.originCountry ?? "").trim() || undefined,
            origin_country_code: supIso3166Alpha2(r.originCountry),
            origin_address_detail: String(r.originAddress ?? "").trim() || undefined,
            destination_country: String(r.destinationCountry ?? "").trim() || undefined,
            dest_country_code: supIso3166Alpha2(r.destinationCountry),
            destination_address_detail: String(r.destinationAddress ?? "").trim() || undefined,
            transport_mode: mode,
            transport_fuel_type: String(r.transportFuelType ?? "").trim() || undefined,
            transport_fuel_qty: String(r.transportFuelQty ?? "").trim() || undefined,
            transport_fuel_qty_unit: String(r.transportFuelQtyUnit ?? "").trim() || undefined,
            transport_qty: String(r.transportAmount ?? "").trim() || undefined,
            transport_qty_unit: String(r.transportAmountUnit ?? "").trim() || undefined,
            transport_emission_factor: String(r.emissionFactor ?? "").trim() || undefined,
            transport_emission_factor_unit: String(r.emissionFactorUnit ?? "").trim() || undefined,
          };
        });
      const res = await putSupDataMgmtMonthlySave({
        projectId: ctx.projectId,
        productId: ctx.productId,
        supplierId: ctx.supplierId,
        reportingYear: ctx.reportingYear,
        reportingMonth: ctx.reportingMonth,
        body: {
          product_variant_id: ctx.productVariantId,
          delivered: hasDeliveredField ? delivered! : undefined,
          material_rows,
          energy_rows,
          transport_rows,
          confirm_outlier_ack: supSaveConfirmOutlierRef.current,
        },
      });
      if (!res.saved) {
        const msg =
          (res.red_flags ?? [])
            .map((f) => f.message || f.code)
            .filter(Boolean)
            .join("\n") || "저장에 실패했습니다.";
        toast.error(msg);
        return;
      }
      if ((res.yellow_warnings?.length ?? 0) > 0 && !supSaveConfirmOutlierRef.current) {
        supSaveConfirmOutlierRef.current = true;
        toast.message(res.message || "이상치 경고가 있습니다. 수정 완료를 한 번 더 눌러 주세요.", {
          duration: 9000,
        });
        return;
      }
      supSaveConfirmOutlierRef.current = false;
      if ((res.yellow_warnings?.length ?? 0) > 0) {
        toast.message(res.message || "저장되었습니다.", { duration: 6000 });
      } else {
        toast.success(res.message || "저장되었습니다.");
      }
      await loadMonthlyDetailFromApi();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장 요청에 실패했습니다.");
    } finally {
      setSupSaveBusy(false);
    }
  };

  const handleTabAddRow = (tabId: string) => {
    switch (tabId) {
      case 'company-info':
        toast.info('기업 기본정보는 회사프로필에서 수정 가능합니다.');
        break;
      case 'facilities':
        setFacilitiesAddRequest((n) => n + 1);
        break;
      case 'products':
        setEditableProducts((prev) => [...prev, EMPTY_PRODUCT_ROW()]);
        break;
      case 'materials':
        setEditableMaterials((prev) => [...prev, EMPTY_MATERIAL_ROW()]);
        break;
      case 'energy':
        setEditableEnergy((prev) => [...prev, EMPTY_ENERGY_ROW()]);
        break;
      case 'transport':
        setEditableTransport((prev) => [...prev, EMPTY_TRANSPORT_ROW()]);
        break;
      case 'contacts':
        setEditableContacts((prev) => [
          ...prev,
          { department: '', position: '', name: '', email: '', phone: '' },
        ]);
        break;
      default:
        break;
    }
  };

  const handleOpenContactRegisterModal = () => {
    setSelectedRegisterContactKeys([]);
    setShowContactRegisterModal(true);
  };

  const toggleRegisterContactKey = (key: string) => {
    setSelectedRegisterContactKeys((prev) => {
      if (prev.includes(key)) return prev.filter((x) => x !== key);
      return [...prev, key];
    });
  };

  const handleConfirmRegisterSelectedContacts = () => {
    if (selectedRegisterContactKeys.length === 0) {
      alert('담당자를 1명 이상 선택해주세요.');
      return;
    }

    const selectedRows = companyContactsForRegisterModal.filter(
      (c) =>
        selectedRegisterContactKeys.includes(c.rowKey) &&
        !editableContacts.some((p: any) =>
          isSameContactAsEditableRow(
            {
              emailValue: c.emailValue,
              nameRaw: c.nameRaw,
              phoneValue: c.phoneValue,
            },
            p,
          ),
        ),
    );

    if (selectedRows.length === 0) {
      alert(
        "추가할 수 있는 담당자를 선택해 주세요. 이미 담당자 표에 있는 인원은 선택할 수 없습니다.",
      );
      return;
    }

    setEditableContacts((prev) => {
      const next = [...(prev ?? [])];

      selectedRows.forEach((row) => {
        const dup = next.some((p: any) =>
          isSameContactAsEditableRow(
            {
              emailValue: row.emailValue,
              nameRaw: row.nameRaw,
              phoneValue: row.phoneValue,
            },
            p,
          ),
        );
        if (dup) return;
        next.push({
          department: row.department,
          position: row.position,
          name: row.nameRaw,
          email: row.emailValue,
          phone: row.phoneValue,
        });
      });

      return next;
    });

    setSelectedRegisterContactKeys([]);
    setShowContactRegisterModal(false);
  };

  const TabExcelActions = ({ tabId }: { tabId: string }) => {
    const showCompanyInfoNote = supplierId === 'own' && tabId === 'company-info';
    const addRowLabel = tabId === 'facilities' ? '사업장 추가하기' : '행추가';
    const isContactsTab = tabId === 'contacts';
    const isCompanyInfoTab = tabId === 'company-info';
    return (
      <div className="flex items-center gap-3 mb-0 flex-wrap">
        {showCompanyInfoNote && (
          <div className="flex items-start gap-3" style={{ maxWidth: 520 }}>
            <span
              className="mt-[2px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-extrabold leading-none sm:h-7 sm:w-7 sm:text-[13px]"
              style={{
                borderColor: '#FCA5A5', // red-300
                color: '#B91C1C', // red-700 (not too neon)
                backgroundColor: '#FEF2F2', // red-50
              }}
              aria-hidden
            >
              !
            </span>
            <span
              className="text-base leading-relaxed sm:text-[17px]"
              style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}
            >
              기본정보는 회사프로필에서 수정 가능합니다.
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 flex-wrap flex-1">
          {!isContactsTab && !isCompanyInfoTab && (
            <button
              type="button"
              onClick={() => handleExcelUploadClick(tabId)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
              style={{
                background: 'var(--aifix-primary)',
              }}
            >
              <Upload className="w-5 h-5" />
              <span style={{ fontWeight: 600 }}>파일 업로드</span>
            </button>
          )}

          {isContactsTab ? (
            <button
              type="button"
              onClick={handleOpenContactRegisterModal}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
              style={{
                borderColor: 'var(--aifix-gray)',
                color: 'var(--aifix-navy)',
                backgroundColor: 'white',
              }}
            >
              <Plus className="w-5 h-5" />
              <span style={{ fontWeight: 600 }}>담당자 등록하기</span>
            </button>
          ) : isCompanyInfoTab ? null : (
            <button
              type="button"
              onClick={() => handleTabAddRow(tabId)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
              style={{
                borderColor: 'var(--aifix-gray)',
                color: 'var(--aifix-navy)',
                backgroundColor: 'white',
              }}
            >
              <Plus className="w-5 h-5" />
              <span style={{ fontWeight: 600 }}>{addRowLabel}</span>
            </button>
          )}

          {!isCompanyInfoTab && (
            <button
              type="button"
              disabled={supSaveBusy}
              onClick={() => void handleSaveComplete()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
              style={{ background: 'var(--aifix-primary)' }}
            >
              <span style={{ fontWeight: 600 }}>{supSaveBusy ? "저장 중…" : "수정 완료"}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const displayProducts = useMemo(() => {
    if (supplierId === 'own') return editableProducts;
    const rows = (supplier.products ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      _rowId: (r._rowId as string) ?? newRowId(),
    }));
    return rows.length > 0 ? rows : [EMPTY_PRODUCT_ROW()];
  }, [supplierId, editableProducts, supplier.products]);

  const displayProduction = supplierId === 'own' ? editableProduction : supplier.production;
  const displayContacts = supplierId === 'own' ? editableContacts : supplier.contacts;

  const displayMaterials = useMemo(() => {
    if (supplierId === "own") {
      return editableMaterials.length > 0 ? editableMaterials : [EMPTY_MATERIAL_ROW()];
    }
    const rows = (supplier.materials ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      _rowId: (r._rowId as string) ?? newRowId(),
    }));
    return rows.length > 0 ? rows : [EMPTY_MATERIAL_ROW()];
  }, [supplierId, editableMaterials, supplier.materials]);

  const displayEnergy = useMemo(() => {
    if (supplierId === "own") {
      return editableEnergy.length > 0 ? editableEnergy : [EMPTY_ENERGY_ROW()];
    }
    const rows = (supplier.energy ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      _rowId: (r._rowId as string) ?? newRowId(),
    }));
    return rows.length > 0 ? rows : [EMPTY_ENERGY_ROW()];
  }, [supplierId, editableEnergy, supplier.energy]);

  const displayTransport = useMemo(() => {
    if (supplierId === "own") {
      return editableTransport.length > 0 ? editableTransport : [EMPTY_TRANSPORT_ROW()];
    }
    const rows = (supplier.transport ?? []).map((r: Record<string, unknown>) =>
      normalizeTransportRowFromSource(r, (r._rowId as string) ?? null),
    );
    return rows.length > 0 ? rows : [EMPTY_TRANSPORT_ROW()];
  }, [supplierId, editableTransport, supplier.transport]);

  /** 계약 납품 품목을 앞에 두고, 표에 이미 적은 제품명은 뒤에 이어 붙임 */
  const productNameOptions: string[] = useMemo(() => {
    const fromContract = contractDeliverableProductNames.filter((n) => n.trim().length > 0);
    const fromTable: string[] = Array.from(
    new Set(
      (displayProducts ?? [])
          .map((p: { name?: unknown }) => String(p?.name ?? "").trim())
          .filter((n: string) => n.length > 0),
      ),
    );
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of [...fromContract, ...fromTable]) {
      if (!seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
    return out;
  }, [contractDeliverableProductNames, displayProducts]);

  const insertProductRowAfter = (index: number) => {
    setEditableProducts((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, EMPTY_PRODUCT_ROW());
      return next;
    });
    setProductEditCell(null);
  };

  const removeProductRowAt = (index: number) => {
    setEditableProducts((prev) => prev.filter((_, i) => i !== index));
    setProductEditCell(null);
  };

  const insertProductionRowAfter = (index: number) => {
    setEditableProduction((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, EMPTY_PRODUCTION_ROW());
      return next;
    });
    setProductionEditCell(null);
  };

  const removeProductionRowAt = (index: number) => {
    setEditableProduction((prev) => prev.filter((_, i) => i !== index));
    setProductionEditCell(null);
  };

  const insertMaterialRowAfter = (index: number) => {
    setEditableMaterials((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, EMPTY_MATERIAL_ROW());
      return next;
    });
    setMaterialEditCell(null);
  };

  const removeMaterialRowAt = (index: number) => {
    setEditableMaterials((prev) => prev.filter((_, i) => i !== index));
    setMaterialEditCell(null);
  };

  const insertEnergyRowAfter = (index: number) => {
    setEditableEnergy((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, EMPTY_ENERGY_ROW());
      return next;
    });
    setEnergyEditCell(null);
  };

  const removeEnergyRowAt = (index: number) => {
    setEditableEnergy((prev) => prev.filter((_, i) => i !== index));
    setEnergyEditCell(null);
  };

  const insertTransportRowAfter = (index: number) => {
    setEditableTransport((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, EMPTY_TRANSPORT_ROW());
      return next;
    });
    setTransportEditCell(null);
  };

  const removeTransportRowAt = (index: number) => {
    setEditableTransport((prev) => prev.filter((_, i) => i !== index));
    setTransportEditCell(null);
  };

  const EditableRowActions = ({
    onInsertBelow,
    onRemove,
  }: {
    onInsertBelow: () => void;
    onRemove: () => void;
  }) => (
    <div className="flex items-center justify-center gap-0">
      <button
        type="button"
        onClick={onInsertBelow}
        className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-violet-50 hover:text-[var(--aifix-primary)] transition-colors"
        title="이 행 아래에 새 행 추가"
        aria-label="이 행 아래에 새 행 추가"
      >
        <ListPlus className="w-4 h-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        title="이 행 삭제"
        aria-label="이 행 삭제"
      >
        <Trash2 className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );

  const isOwnSupplier = supplierId === 'own';

  /** 납품 제품 정보 · 활동데이터 탭 공통: 카드, 상단 액션, 테이블 스크롤 영역 */
  const EditableSupplierTableShell = ({
    tabId,
    children,
    topNotice,
  }: {
    tabId: string;
    children: ReactNode;
    topNotice?: ReactNode;
  }) => (
    <div
      className="bg-white rounded-[20px] overflow-x-hidden overflow-y-visible"
      style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
    >
      {/* Tabs (카드 내부에 포함: 원청사 화면과 동일한 구조감) */}
      <div className="p-6 pb-0">
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-6 py-4 border-b-2 transition-all duration-200 whitespace-nowrap"
              style={{
                borderBottomColor: activeTab === tab.id ? 'var(--aifix-primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--aifix-primary)' : 'var(--aifix-gray)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                backgroundColor: 'white',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {(supplierId === 'own' || topNotice) && (
        <div className="p-6 pb-0">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            {topNotice && (
              <div className="min-w-0 flex-1 pr-2">{topNotice}</div>
            )}
            {supplierId === 'own' && (
              <div className={topNotice ? 'shrink-0' : 'w-full'}>
                <TabExcelActions tabId={tabId} />
              </div>
            )}
          </div>
        </div>
      )}
      {/* 행이 적어도 세로 여유를 두어 드롭다운이 잘리지 않도록 최소 높이 + 하단 패딩 */}
      <div className="px-2 pb-8 pt-1">
        <div
          className="min-h-[28rem] sm:min-h-[32rem] border border-gray-200 rounded-xl bg-white [scrollbar-gutter:stable] overflow-x-auto [overflow-y:visible]"
        >
          {children}
        </div>
      </div>
    </div>
  );

  const renderOwnTextCell = (
    kind: 'product' | 'production' | 'material' | 'energy' | 'transport',
    rowIndex: number,
    field: string,
    cellValue: unknown,
  ) => {
    if (!isOwnSupplier) {
      return (
        <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>{String(cellValue ?? '')}</span>
      );
    }
    const editState =
      kind === 'product'
        ? productEditCell
        : kind === 'production'
          ? productionEditCell
          : kind === 'material'
            ? materialEditCell
            : kind === 'energy'
              ? energyEditCell
              : transportEditCell;

    const setEdit =
      kind === 'product'
        ? setProductEditCell
        : kind === 'production'
          ? setProductionEditCell
          : kind === 'material'
            ? setMaterialEditCell
            : kind === 'energy'
              ? setEnergyEditCell
              : setTransportEditCell;

    const snapshotRef =
      kind === 'product'
        ? productEditSnapshotRef
        : kind === 'production'
          ? productionEditSnapshotRef
          : kind === 'material'
            ? materialEditSnapshotRef
            : kind === 'energy'
              ? energyEditSnapshotRef
              : transportEditSnapshotRef;

    const setRows =
      kind === 'product'
        ? setEditableProducts
        : kind === 'production'
          ? setEditableProduction
          : kind === 'material'
            ? setEditableMaterials
            : kind === 'energy'
              ? setEditableEnergy
              : setEditableTransport;
    const editing = editState?.rowIndex === rowIndex && editState?.field === field;

    const shellClass =
      'box-border flex h-8 min-h-[32px] w-full min-w-0 max-w-full items-center rounded-md border border-[#E2E8F0] bg-white px-2 text-sm';

    if (editing) {
      return (
        <div
          className={`${shellClass} outline-none ring-2 ring-inset ring-[var(--aifix-primary)]`}
        >
          <InputFocusNoScroll
            type="text"
            className="m-0 h-full min-h-0 w-full min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-sm text-[var(--aifix-navy)] outline-none"
            value={String(cellValue ?? '')}
            onChange={(e) => {
              const v = e.target.value;
              setRows((prev) =>
                prev.map((r, i) => (i === rowIndex ? { ...r, [field]: v } : r)),
              );
            }}
            onBlur={() => setEdit(null)}
            onKeyDown={(e) => {
              const el = e.target as HTMLInputElement;
              if (e.key === 'Enter') el.blur();
              if (e.key === 'Escape') {
                setRows((prev) =>
                  prev.map((r, i) =>
                    i === rowIndex ? { ...r, [field]: snapshotRef.current } : r,
                  ),
                );
                setEdit(null);
              }
            }}
          />
        </div>
      );
    }
    return (
      <div
        className={shellClass}
        style={{ color: 'var(--aifix-navy)' }}
      >
        <span
          className="min-w-0 flex-1 cursor-default truncate"
          onDoubleClick={() => {
            snapshotRef.current = String(cellValue ?? '');
            setEdit({ rowIndex, field });
          }}
          title="더블클릭하여 수정"
        >
          {String(cellValue ?? '') || '\u00a0'}
        </span>
      </div>
    );
  };

  const renderTabContent = () => {
    const supplierTypeForRmi = supplier.type;
    const rmiDisplayText = displayRmiCertification(
      supplierTypeForRmi,
      supplier.companyInfo.rmiSmelter,
    );
    const websiteUrlRaw = String(supplier.companyInfo.website ?? "").trim();

    switch (activeTab) {
      case "company-info":
        return (
          <EditableSupplierTableShell tabId="company-info">
            {supplierId === "own" && ownProfileLoading ? (
              <p className="mb-4 text-sm text-gray-500" role="status">
                회사 정보를 불러오는 중…
              </p>
            ) : null}
            {supplierId === "own" && ownProfile && !ownProfile.has_profile ? (
              <p
                className="mb-4 text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
                role="status"
              >
                승인된 회사 프로필이 없습니다. 원청 승인이 완료되면 회사 프로필과 동일한 법인 정보가 여기에 표시됩니다.
              </p>
            ) : null}
            <table className={SUP_DETAIL_TABLE}>
              <tbody>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL} style={{ width: '200px' }}>
                    회사명
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {displayCompanyField(supplier.name)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    사업자등록번호
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {displayCompanyField(supplier.companyInfo.registrationNumber)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    국가 소재지
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {displayCompanyField(supplier.country)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    상세주소
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {displayCompanyField(supplier.location)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    DUNS Number
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {displayCompanyField(supplier.companyInfo.dunsNumber)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    텍스 ID
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {displayCompanyField(supplier.companyInfo.taxId)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    공식 홈페이지 주소
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    {websiteUrlRaw ? (
                      supplierId === "own" ? (
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{websiteUrlRaw}</span>
                    ) : (
                      <a 
                          href={websiteUrlRaw}
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--aifix-primary)', textDecoration: 'underline' }}
                      >
                          {websiteUrlRaw}
                      </a>
                      )
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>미기입</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    대표자명
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {displayCompanyField(supplier.companyInfo.representative)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    대표 이메일
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {displayCompanyField(supplier.companyInfo.email)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    대표자 연락처
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {displayCompanyField(supplier.companyInfo.phone)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>RMI 인증 여부</td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {rmiDisplayText}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>FEOC 여부</td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {displayCompanyField(supplier.companyInfo.feoc)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL} style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                    공급자 유형
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 700 }}>
                      {displayCompanyField(supplier.type)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </EditableSupplierTableShell>
        );

      case "facilities":
        return (
          <EditableSupplierTableShell tabId="facilities">
            <FacilitiesTab 
              supplierId={supplierId || 'supplier1'}
              supplier={supplier}
              openAddFacilityRequest={facilitiesAddRequest}
            />
          </EditableSupplierTableShell>
        );

      case "products":
        return (
          <EditableSupplierTableShell tabId="products">
                  <table className={SUP_DETAIL_TABLE_EDITABLE}>
                    <thead>
                      <tr>
                        <th className={SUP_DETAIL_TH}>
                          제품명
                        </th>
                        <th className={SUP_DETAIL_TH}>
                          납품일 (1~31)
                        </th>
                        <th className={SUP_DETAIL_TH}>
                          납품 수량(생산량)
                        </th>
                        <th className={SUP_DETAIL_TH}>
                          납품 단위(unit)
                        </th>
                        <th className={SUP_DETAIL_TH}>
                          단위 실측 중량 (kg per unit)
                        </th>
                        <th className={SUP_DETAIL_TH}>
                          불량품 수량
                        </th>
                        <th className={SUP_DETAIL_TH}>
                          폐기물량
                        </th>
                        <th className={SUP_DETAIL_TH}>
                          폐기물량 단위
                        </th>
                        <th className={SUP_DETAIL_TH}>
                          폐기물 배출계수
                        </th>
                        <th className={SUP_DETAIL_TH}>
                          폐기물 배출계수 단위
                        </th>
                        {isOwnSupplier && (
                          <th className={SUP_DETAIL_TH_ACTION}>
                            작업
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {displayProducts.map((product: any, index: number) => (
                        <tr key={product._rowId ?? index} className="group hover:bg-gray-50 transition-colors">
                          <td className={SUP_DETAIL_TD}>
                            {isOwnSupplier ? (
                              <SearchableSelectCreatable
                                value={String(product.name ?? '')}
                                onChange={(v) =>
                                  setEditableProducts((prev) =>
                                    prev.map((r, i) => (i === index ? { ...r, name: v } : r)),
                                  )
                                }
                                baseOptions={productNameOptions}
                                placeholder="제품명 검색·추가"
                              />
                            ) : (
                              <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                                {String(product.name ?? '')}
                              </span>
                            )}
                          </td>
                          <td className={SUP_DETAIL_TD}>
                            {renderOwnTextCell('product', index, 'deliveryDate', product.deliveryDate)}
                          </td>
                          <td className={SUP_DETAIL_TD}>
                            {renderOwnTextCell('product', index, 'quantity', product.quantity)}
                          </td>
                          <td className={SUP_DETAIL_TD}>
                            {isOwnSupplier && index === 0 ? (
                              <SearchableSelectCreatable
                                value={String(product.unit ?? '')}
                                onChange={(v) =>
                                  setEditableProducts((prev) =>
                                    prev.map((r, i) => (i === index ? { ...r, unit: v } : r)),
                                  )
                                }
                                baseOptions={DELIVERY_AND_INPUT_UNIT_BASE_OPTIONS}
                                placeholder="납품 단위 검색·추가"
                              />
                            ) : (
                              renderOwnTextCell('product', index, 'unit', product.unit)
                            )}
                          </td>
                          <td className={SUP_DETAIL_TD}>
                            {renderOwnTextCell('product', index, 'standardWeight', product.standardWeight)}
                          </td>
                          <td className={SUP_DETAIL_TD}>
                            {renderOwnTextCell('product', index, 'defectiveQuantity', product.defectiveQuantity)}
                          </td>
                          <td className={SUP_DETAIL_TD}>
                            {renderOwnTextCell('product', index, 'wasteQuantity', product.wasteQuantity)}
                          </td>
                          <td className={SUP_DETAIL_TD}>
                            {isOwnSupplier ? (
                              <SearchableSelectCreatable
                                value={String(product.wasteQuantityUnit ?? '')}
                                onChange={(v) =>
                                  setEditableProducts((prev) =>
                                    prev.map((r, i) =>
                                      i === index ? { ...r, wasteQuantityUnit: v } : r,
                                    ),
                                  )
                                }
                                baseOptions={DELIVERY_AND_INPUT_UNIT_BASE_OPTIONS}
                                placeholder="폐기물량 단위 검색·추가"
                              />
                            ) : (
                              renderOwnTextCell('product', index, 'wasteQuantityUnit', product.wasteQuantityUnit)
                            )}
                          </td>
                          <td className={SUP_DETAIL_TD}>
                            {isOwnSupplier ? (
                              <div className="flex min-w-0 items-center gap-1">
                                <div className="min-w-0 flex-1">
                                  {renderOwnTextCell(
                                    'product',
                                    index,
                                    'wasteEmissionFactor',
                                    product.wasteEmissionFactor,
                                  )}
                                </div>
                                <button
                                  type="button"
                                  title="환경성적표지 참조 계수에서 선택"
                                  className="shrink-0 rounded-md p-1 text-[#5B3BFA] hover:bg-violet-50"
                                  onClick={() => setEprPickerTarget({ kind: 'productWaste', rowIndex: index })}
                                >
                                  <TableProperties className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              renderOwnTextCell('product', index, 'wasteEmissionFactor', product.wasteEmissionFactor)
                            )}
                          </td>
                          <td className={SUP_DETAIL_TD}>
                            {renderOwnTextCell('product', index, 'wasteEmissionFactorUnit', product.wasteEmissionFactorUnit)}
                          </td>
                          {isOwnSupplier && (
                            <td className={SUP_DETAIL_TD_ACTION}>
                              <div className="flex min-h-8 items-center justify-center">
                                <EditableRowActions
                                  onInsertBelow={() => insertProductRowAfter(index)}
                                  onRemove={() => removeProductRowAt(index)}
                                />
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
          </EditableSupplierTableShell>
        );

      case "materials":
        return (
          <EditableSupplierTableShell
            tabId="materials"
            topNotice={isOwnSupplier ? <ProductNameDropdownNotice /> : undefined}
          >
            <table className={SUP_DETAIL_TABLE_EDITABLE}>
              <thead>
                <tr>
                  <th className={SUP_DETAIL_TH}>
                    제품명
                  </th>
                  <th className={SUP_DETAIL_TH}>투입 자재명</th>
                  <th className={SUP_DETAIL_TH}>투입량</th>
                  <th className={SUP_DETAIL_TH}>투입량 단위</th>
                  <th className={SUP_DETAIL_TH}>자재 배출계수</th>
                  <th className={SUP_DETAIL_TH}>자재 배출계수 단위</th>
                  <th className={SUP_DETAIL_TH}>투입 광물 종류</th>
                  <th className={SUP_DETAIL_TH}>투입 광물량</th>
                  <th className={SUP_DETAIL_TH}>투입 광물량 단위</th>
                  <th className={SUP_DETAIL_TH}>광물 원산지</th>
                  <th className={SUP_DETAIL_TH}>광물 배출계수</th>
                  <th className={SUP_DETAIL_TH}>광물 배출계수 단위</th>
                  {isOwnSupplier && <th className={SUP_DETAIL_TH_ACTION}>작업</th>}
                </tr>
              </thead>
              <tbody>
                {displayMaterials.map((row: any, index: number) => (
                  <tr key={row._rowId ?? index} className="group hover:bg-gray-50 transition-colors">
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <select
                          value={String(row.productName ?? '')}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEditableMaterials((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, productName: v } : r)),
                            );
                          }}
                          className={SUP_DETAIL_NATIVE_SELECT}
                        >
                          <option value="">선택</option>
                          {productNameOptions.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                          {String(row.productName ?? '')}
                        </span>
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('material', index, 'inputMaterialName', row.inputMaterialName)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('material', index, 'inputAmount', row.inputAmount)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <SearchableSelectCreatable
                          value={String(row.inputAmountUnit ?? '')}
                          onChange={(v) =>
                            setEditableMaterials((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, inputAmountUnit: v } : r)),
                            )
                          }
                          baseOptions={DELIVERY_AND_INPUT_UNIT_BASE_OPTIONS}
                          placeholder="투입량 단위 검색·추가"
                        />
                      ) : (
                        renderOwnTextCell('material', index, 'inputAmountUnit', row.inputAmountUnit)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <div className="flex min-w-0 items-center gap-1">
                          <div className="min-w-0 flex-1">
                            {renderOwnTextCell(
                              'material',
                              index,
                              'materialEmissionFactor',
                              row.materialEmissionFactor,
                            )}
                          </div>
                          <button
                            type="button"
                            title="환경성적표지 참조 계수에서 선택"
                            className="shrink-0 rounded-md p-1 text-[#5B3BFA] hover:bg-violet-50"
                            onClick={() => setEprPickerTarget({ kind: 'material', rowIndex: index })}
                          >
                            <TableProperties className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        renderOwnTextCell('material', index, 'materialEmissionFactor', row.materialEmissionFactor)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('material', index, 'materialEmissionFactorUnit', row.materialEmissionFactorUnit)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier && index === 0 ? (
                        <SearchableSelectCreatable
                          value={String(row.mineralType ?? '')}
                          onChange={(v) =>
                            setEditableMaterials((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, mineralType: v } : r)),
                            )
                          }
                          baseOptions={['리튬', '코발트', '니켈', '망간', '콜탄']}
                          placeholder="투입 광물 종류 검색·추가"
                        />
                      ) : (
                        renderOwnTextCell('material', index, 'mineralType', row.mineralType)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('material', index, 'mineralAmount', row.mineralAmount)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <SearchableSelectCreatable
                          value={String(row.mineralAmountUnit ?? '')}
                          onChange={(v) =>
                            setEditableMaterials((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, mineralAmountUnit: v } : r,
                              ),
                            )
                          }
                          baseOptions={DELIVERY_AND_INPUT_UNIT_BASE_OPTIONS}
                          placeholder="투입 광물량 단위 검색·추가"
                        />
                      ) : (
                        renderOwnTextCell('material', index, 'mineralAmountUnit', row.mineralAmountUnit)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier && index === 0 ? (
                        <SearchableCountrySelect
                          value={String(row.mineralOrigin ?? '')}
                          onChange={(v) =>
                            setEditableMaterials((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, mineralOrigin: v } : r)),
                            )
                          }
                          placeholder="광물 원산지 검색"
                        />
                      ) : (
                        renderOwnTextCell('material', index, 'mineralOrigin', row.mineralOrigin)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <div className="flex min-w-0 items-center gap-1">
                          <div className="min-w-0 flex-1">
                            {renderOwnTextCell(
                              'material',
                              index,
                              'mineralEmissionFactor',
                              row.mineralEmissionFactor,
                            )}
                          </div>
                          <button
                            type="button"
                            title="환경성적표지 참조 계수에서 선택"
                            className="shrink-0 rounded-md p-1 text-[#5B3BFA] hover:bg-violet-50"
                            onClick={() => setEprPickerTarget({ kind: 'mineral', rowIndex: index })}
                          >
                            <TableProperties className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        renderOwnTextCell('material', index, 'mineralEmissionFactor', row.mineralEmissionFactor)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('material', index, 'mineralEmissionFactorUnit', row.mineralEmissionFactorUnit)}
                    </td>
                    {isOwnSupplier && (
                      <td className={SUP_DETAIL_TD_ACTION}>
                        <div className="flex min-h-8 items-center justify-center">
                          <EditableRowActions
                            onInsertBelow={() => insertMaterialRowAfter(index)}
                            onRemove={() => removeMaterialRowAt(index)}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </EditableSupplierTableShell>
        );

      case "energy":
        return (
          <EditableSupplierTableShell
            tabId="energy"
            topNotice={isOwnSupplier ? <ProductNameDropdownNotice /> : undefined}
          >
            <table className={SUP_DETAIL_TABLE_EDITABLE}>
              <thead>
                <tr>
                  <th className={SUP_DETAIL_TH}>
                    제품명
                  </th>
                  <th className={SUP_DETAIL_TH}>에너지 유형</th>
                  <th className={SUP_DETAIL_TH}>에너지 사용량</th>
                  <th className={SUP_DETAIL_TH}>에너지 단위</th>
                  <th className={SUP_DETAIL_TH}>에너지 배출계수</th>
                  <th className={SUP_DETAIL_TH}>에너지 배출계수 단위</th>
                  {isOwnSupplier && <th className={SUP_DETAIL_TH_ACTION}>작업</th>}
                </tr>
              </thead>
              <tbody>
                {displayEnergy.map((row: any, index: number) => (
                  <tr key={row._rowId ?? index} className="group hover:bg-gray-50 transition-colors">
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <select
                          value={String(row.productName ?? '')}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEditableEnergy((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, productName: v } : r)),
                            );
                          }}
                          className={SUP_DETAIL_NATIVE_SELECT}
                        >
                          <option value="">선택</option>
                          {productNameOptions.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                          {String(row.productName ?? '')}
                        </span>
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier && index === 0 ? (
                        <SearchableSelectCreatable
                          value={String(row.energyType ?? '')}
                          onChange={(v) =>
                            setEditableEnergy((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, energyType: v } : r)),
                            )
                          }
                          baseOptions={ENERGY_TYPE_BASE_OPTIONS}
                          placeholder="에너지 유형 검색·추가"
                        />
                      ) : isOwnSupplier ? (
                        <select
                          value={String(row.energyType ?? '')}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEditableEnergy((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, energyType: v } : r)),
                            );
                          }}
                          className={SUP_DETAIL_NATIVE_SELECT}
                        >
                          <option value="">선택</option>
                          {ENERGY_TYPE_BASE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                          {String(row.energyType ?? '')}
                        </span>
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('energy', index, 'energyUsage', row.energyUsage)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier && index === 0 ? (
                        <SearchableSelectCreatable
                          value={String(row.energyUnit ?? '')}
                          onChange={(v) =>
                            setEditableEnergy((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, energyUnit: v } : r)),
                            )
                          }
                          baseOptions={ENERGY_UNIT_BASE_OPTIONS}
                          placeholder="에너지 단위 검색·추가"
                        />
                      ) : (
                        renderOwnTextCell('energy', index, 'energyUnit', row.energyUnit)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <div className="flex min-w-0 items-center gap-1">
                          <div className="min-w-0 flex-1">
                      {renderOwnTextCell('energy', index, 'emissionFactor', row.emissionFactor)}
                          </div>
                          <button
                            type="button"
                            title="환경성적표지 참조 계수에서 선택"
                            className="shrink-0 rounded-md p-1 text-[#5B3BFA] hover:bg-violet-50"
                            onClick={() => setEprPickerTarget({ kind: 'energy', rowIndex: index })}
                          >
                            <TableProperties className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        renderOwnTextCell('energy', index, 'emissionFactor', row.emissionFactor)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('energy', index, 'emissionFactorUnit', row.emissionFactorUnit)}
                    </td>
                    {isOwnSupplier && (
                      <td className={SUP_DETAIL_TD_ACTION}>
                        <div className="flex min-h-8 items-center justify-center">
                          <EditableRowActions
                            onInsertBelow={() => insertEnergyRowAfter(index)}
                            onRemove={() => removeEnergyRowAt(index)}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </EditableSupplierTableShell>
        );

      case "transport":
        return (
          <EditableSupplierTableShell
            tabId="transport"
            topNotice={isOwnSupplier ? <ProductNameDropdownNotice /> : undefined}
          >
            <table className={SUP_DETAIL_TABLE_EDITABLE}>
              <thead>
                <tr>
                  <th className={SUP_DETAIL_TH}>제품명</th>
                  <th className={SUP_DETAIL_TH}>출발지 국가</th>
                  <th className={SUP_DETAIL_TH}>출발지 상세 주소</th>
                  <th className={SUP_DETAIL_TH}>도착지 국가</th>
                  <th className={SUP_DETAIL_TH}>도착지 상세주소</th>
                  <th className={SUP_DETAIL_TH}>운송수단</th>
                  <th className={SUP_DETAIL_TH}>사용 연료</th>
                  <th className={SUP_DETAIL_TH}>사용 연료량</th>
                  <th className={SUP_DETAIL_TH}>사용 연료량 단위</th>
                  <th className={SUP_DETAIL_TH}>운송 물량</th>
                  <th className={SUP_DETAIL_TH}>물량 단위</th>
                  <th className={SUP_DETAIL_TH}>운송 배출계수</th>
                  <th className={SUP_DETAIL_TH}>운송 배출계수 단위</th>
                  {isOwnSupplier && <th className={SUP_DETAIL_TH_ACTION}>작업</th>}
                </tr>
              </thead>
              <tbody>
                {displayTransport.map((row: any, index: number) => (
                  <tr key={row._rowId ?? index} className="group hover:bg-gray-50 transition-colors">
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <select
                          value={String(row.productName ?? '')}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEditableTransport((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, productName: v } : r)),
                            );
                          }}
                          className={SUP_DETAIL_NATIVE_SELECT}
                        >
                          <option value="">선택</option>
                          {productNameOptions.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                          {String(row.productName ?? '')}
                        </span>
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <SearchableCountrySelect
                          value={String(row.originCountry ?? '')}
                          onChange={(v) =>
                            setEditableTransport((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, originCountry: v.toUpperCase().slice(0, 2) } : r,
                              ),
                            )
                          }
                          placeholder="국가명·코드 검색 (출발지)"
                          emptyLabel="선택"
                        />
                      ) : (
                        <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                          {countryKoLabelFromCode(row.originCountry) || '\u00a0'}
                        </span>
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('transport', index, 'originAddress', row.originAddress)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <SearchableCountrySelect
                          value={String(row.destinationCountry ?? '')}
                          onChange={(v) =>
                            setEditableTransport((prev) =>
                              prev.map((r, i) =>
                                i === index
                                  ? { ...r, destinationCountry: v.toUpperCase().slice(0, 2) }
                                  : r,
                              ),
                            )
                          }
                          placeholder="국가명·코드 검색 (도착지)"
                          emptyLabel="선택"
                        />
                      ) : (
                        <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                          {countryKoLabelFromCode(row.destinationCountry) || '\u00a0'}
                        </span>
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('transport', index, 'destinationAddress', row.destinationAddress)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <SearchableSelectCreatable
                          value={String(row.transportMethod ?? '')}
                          onChange={(v) =>
                            setEditableTransport((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, transportMethod: v } : r)),
                            )
                          }
                          baseOptions={TRANSPORT_MODE_BASE_OPTIONS}
                          placeholder="운송수단 검색·추가"
                        />
                      ) : (
                        <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                          {String(row.transportMethod ?? '')}
                        </span>
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <SearchableSelectCreatable
                          value={String(row.transportFuelType ?? '')}
                          onChange={(v) =>
                            setEditableTransport((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, transportFuelType: v } : r)),
                            )
                          }
                          baseOptions={TRANSPORT_FUEL_TYPE_BASE_OPTIONS}
                          placeholder="사용 연료 검색·추가"
                        />
                      ) : (
                        <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                          {String(row.transportFuelType ?? '')}
                        </span>
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('transport', index, 'transportFuelQty', row.transportFuelQty)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <SearchableSelectCreatable
                          value={String(row.transportFuelQtyUnit ?? '')}
                          onChange={(v) =>
                            setEditableTransport((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, transportFuelQtyUnit: v } : r)),
                            )
                          }
                          baseOptions={TRANSPORT_FUEL_QTY_UNIT_BASE_OPTIONS}
                          allowCreate={false}
                          placeholder="사용 연료량 단위"
                        />
                      ) : (
                        <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                          {String(row.transportFuelQtyUnit ?? '')}
                        </span>
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('transport', index, 'transportAmount', row.transportAmount)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <SearchableSelectCreatable
                          value={String(row.transportAmountUnit ?? '')}
                          onChange={(v) =>
                            setEditableTransport((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, transportAmountUnit: v } : r)),
                            )
                          }
                          baseOptions={TRANSPORT_QTY_UNIT_BASE_OPTIONS}
                          allowCreate={false}
                          placeholder="물량 단위 선택"
                        />
                      ) : (
                        renderOwnTextCell('transport', index, 'transportAmountUnit', row.transportAmountUnit)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier ? (
                        <div className="flex min-w-0 items-center gap-1">
                          <div className="min-w-0 flex-1">
                      {renderOwnTextCell('transport', index, 'emissionFactor', row.emissionFactor)}
                          </div>
                          <button
                            type="button"
                            title="환경성적표지 참조 계수에서 선택"
                            className="shrink-0 rounded-md p-1 text-[#5B3BFA] hover:bg-violet-50"
                            onClick={() => setEprPickerTarget({ kind: 'transport', rowIndex: index })}
                          >
                            <TableProperties className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        renderOwnTextCell('transport', index, 'emissionFactor', row.emissionFactor)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('transport', index, 'emissionFactorUnit', row.emissionFactorUnit)}
                    </td>
                    {isOwnSupplier && (
                      <td className={SUP_DETAIL_TD_ACTION}>
                        <div className="flex min-h-8 items-center justify-center">
                          <EditableRowActions
                            onInsertBelow={() => insertTransportRowAfter(index)}
                            onRemove={() => removeTransportRowAt(index)}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </EditableSupplierTableShell>
        );

      case "contacts":
        return (
          <EditableSupplierTableShell tabId="contacts">
            <table className={SUP_DETAIL_TABLE}>
              <thead>
                <tr>
                  <th className={SUP_DETAIL_TH}>부서명</th>
                  <th className={SUP_DETAIL_TH}>직급</th>
                  <th className={SUP_DETAIL_TH}>이름</th>
                  <th className={SUP_DETAIL_TH}>이메일</th>
                  <th className={SUP_DETAIL_TH}>연락처</th>
                </tr>
              </thead>
              <tbody>
                {displayContacts.map((contact: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td
                      className={SUP_DETAIL_TD_CONTACTS}
                      style={{
                        color: "var(--aifix-navy)",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      {contact.department}
                    </td>
                    <td
                      className={SUP_DETAIL_TD_CONTACTS}
                      style={{
                        color: "var(--aifix-navy)",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      {contact.position}
                    </td>
                    <td
                      className={SUP_DETAIL_TD_CONTACTS}
                      style={{
                        color: "var(--aifix-navy)",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      {contact.name}
                    </td>
                    <td
                      className={SUP_DETAIL_TD_CONTACTS}
                      style={{
                        color: "var(--aifix-navy)",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      {contact.email}
                    </td>
                    <td
                      className={SUP_DETAIL_TD_CONTACTS}
                      style={{
                        color: "var(--aifix-navy)",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      {contact.phone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </EditableSupplierTableShell>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      <div>
        {/* Back button (outside top summary card) */}
        <div className="mb-3 flex items-center justify-start">
          <button
            onClick={() => {
              try {
                sessionStorage.setItem('aifix_data_mgmt_from_back_v1', '1');
              } catch {
                /* ignore */
              }
              router.push(`/projects/${projectId}?tab=data-mgmt&show=true`);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
            style={{
              borderColor: 'var(--aifix-gray)',
              color: 'var(--aifix-navy)',
              background: 'white',
            }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span style={{ fontWeight: 600 }}>뒤로가기</span>
          </button>
        </div>

        {/* Top Section - Company Summary Card */}
        <div className="bg-white rounded-[20px] p-8 mb-6" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              {/* Company Icon */}
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)' }}
              >
                <Building2 className="w-8 h-8 text-white" />
              </div>

              {/* Company Info */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                    {supplier.name}
                  </h1>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>
                      직상위차사
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {directUpperTierLabel}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>
                      납품량
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {supplier.volume}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>
                      PCF 결과 (부분/최종)
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      부분: {pcfPartial}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      최종: {pcfFinal}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {canSendRevisionRequest && (
                <button
                  onClick={handleOpenRevisionRequest}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)',
                  }}
                >
                  <Send className="w-5 h-5" />
                  <span style={{ fontWeight: 600 }}>수정 요청</span>
                </button>
              )}
              {supplierId === 'own' && (
                <button
                  type="button"
                  onClick={() => {
                    setExcelDownloadModalTabs(selectedExcelDownloadTabs);
                    setShowExcelDownloadModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: 'var(--aifix-primary)' }}
                >
                  <Download className="w-5 h-5" />
                  <span style={{ fontWeight: 600 }}>엑셀로 다운받기</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Read-Only Notice */}
        {supplierId !== 'own' && (
          <div 
            className="rounded-xl p-4 mb-6 flex items-start gap-3"
            style={{ backgroundColor: '#E3F2FD', border: '1px solid #90CAF9' }}
          >
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#1976D2' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#1565C0', marginBottom: '4px' }}>
                협력사 입력 데이터 (Read Only)
              </div>
              <div style={{ fontSize: '14px', color: '#1976D2' }}>
                {canSendRevisionRequest
                  ? '직하위 협력사 데이터는 직접 수정할 수 없습니다. 필요한 경우 수정 요청을 보낼 수 있습니다.'
                  : '직하위 차수가 아닌 협력사 데이터는 수정 요청을 보낼 수 없습니다.'}
              </div>
            </div>
          </div>
        )}

        {/* 엑셀 다운로드 모달 */}
        {supplierId === 'own' && showExcelDownloadModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowExcelDownloadModal(false)}
          >
            <div
              className="bg-white rounded-[20px] w-full max-w-[900px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-2xl font-bold" style={{ color: 'var(--aifix-navy)' }}>
                  엑셀 다운로드
                </h3>
                <button
                  type="button"
                  onClick={() => setShowExcelDownloadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-6 h-6" style={{ color: 'var(--aifix-gray)' }} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4 text-sm" style={{ color: 'var(--aifix-gray)' }}>
                  다운로드할 세부탭을 선택하면, 선택한 탭별로 시트가 생성됩니다. (컬럼 포맷은 동일하게 유지됩니다)
                </div>

                <div className="flex items-center justify-end gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setExcelDownloadModalTabs([...ALL_DETAIL_TAB_IDS])}
                    className="px-4 py-2 rounded-lg border transition-all duration-200 hover:bg-gray-50"
                    style={{
                      borderColor: 'var(--aifix-gray)',
                      color: 'var(--aifix-navy)',
                      background: 'white',
                      fontWeight: 600,
                      fontSize: '14px',
                    }}
                  >
                    전체선택
                  </button>
                  <button
                    type="button"
                    onClick={() => setExcelDownloadModalTabs([])}
                    className="px-4 py-2 rounded-lg border transition-all duration-200 hover:bg-gray-50"
                    style={{
                      borderColor: 'var(--aifix-gray)',
                      color: 'var(--aifix-navy)',
                      background: 'white',
                      fontWeight: 600,
                      fontSize: '14px',
                    }}
                  >
                    전체해지
                  </button>
                </div>

                <div className="flex flex-wrap gap-4">
                  {tabs
                    .filter((t) => ALL_DETAIL_TAB_IDS.includes(t.id))
                    .map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--aifix-gray)' }}
                    >
                      <input
                        type="checkbox"
                        checked={excelDownloadModalTabs.includes(t.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setExcelDownloadModalTabs((prev) => {
                            if (checked) return Array.from(new Set([...prev, t.id]));
                            return prev.filter((id) => id !== t.id);
                          });
                        }}
                        style={{ accentColor: 'var(--aifix-primary)' }}
                      />
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 600 }}>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowExcelDownloadModal(false)}
                  className="px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
                  style={{
                    borderColor: 'var(--aifix-gray)',
                    color: 'var(--aifix-navy)',
                    background: 'white',
                    fontWeight: 600,
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExcelDownloadTabs(excelDownloadModalTabs);
                    setShowExcelDownloadModal(false);
                    handleExcelDownloadSelectedTabs(excelDownloadModalTabs);
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: 'var(--aifix-primary)', fontWeight: 600 }}
                >
                  <Download className="w-5 h-5" />
                  엑셀로 다운받기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 납품 제품 Excel 업로드 — 원청 Tier0와 동일 UX */}
        {supplierId === "own" && showSupExcelUploadModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div
              className="w-full max-w-lg overflow-hidden bg-white"
              style={{ borderRadius: "20px" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="sup-excel-upload-title"
            >
              <div className="border-b border-gray-200 p-6">
                <h2 id="sup-excel-upload-title" className="text-xl font-bold text-gray-900">
                  납품 제품 Excel 업로드
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  사업장 정보·담당자 정보·설비 정보 시트는 업로드해도 읽지 않으며, 해당 탭 화면은 바뀌지
                  않습니다. 사업장 담당자·자재·에너지·생산·운송 시트만 읽어 화면에 반영합니다. DB 반영은
                  확인 후 「수정 완료」를 누르세요.
                </p>
              </div>
              <div className="p-6">
                <input
                  ref={supExcelFileInputRef}
                  type="file"
                  accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={() => {
                    setSupExcelSelectedFileName(supExcelFileInputRef.current?.files?.[0]?.name ?? "");
                  }}
                  className="sr-only"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => supExcelFileInputRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSupExcelDragOver(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSupExcelDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSupExcelDragOver(false);
                  }}
                  onDrop={handleSupExcelDrop}
                  className={`w-full cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    supExcelDragOver
                      ? "border-[#5B3BFA] bg-purple-50/50"
                      : "border-gray-300 hover:border-[#5B3BFA]"
                  }`}
                >
                  <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="mb-2 font-medium text-gray-700">파일을 드래그하거나 클릭하여 선택</p>
                  <p className="text-sm text-gray-500">
                    xlsx 파일 (다운로드한 tier0/export와 동일 구조 · 협력사 「엑셀 다운로드」와 동일)
                  </p>
                  {supExcelSelectedFileName ? (
                    <p className="mt-3 text-xs font-medium text-[#5B3BFA]">
                      선택됨: {supExcelSelectedFileName}
                    </p>
                  ) : null}
                </button>
                <div className="mt-6 space-y-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="supExcelUploadMode"
                      checked={supExcelUploadMergeMode === "overwrite"}
                      onChange={() => setSupExcelUploadMergeMode("overwrite")}
                      className="text-[#5B3BFA]"
                      style={{ accentColor: "var(--aifix-primary)" }}
                    />
                    <span className="text-sm">기존 화면 데이터 덮어쓰기</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="supExcelUploadMode"
                      checked={supExcelUploadMergeMode === "append"}
                      onChange={() => setSupExcelUploadMergeMode("append")}
                      className="text-[#5B3BFA]"
                      style={{ accentColor: "var(--aifix-primary)" }}
                    />
                    <span className="text-sm">기존 화면 데이터 유지 + 엑셀 행 추가</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowSupExcelUploadModal(false);
                    if (supExcelFileInputRef.current) supExcelFileInputRef.current.value = "";
                    setSupExcelSelectedFileName("");
                    setSupExcelDragOver(false);
                  }}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 transition-colors hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={supImportBusy}
                  onClick={() => void handleSupExcelUploadConfirm()}
                  className="rounded-lg px-5 py-2.5 font-medium text-white disabled:opacity-50"
                  style={{
                    background: "linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)",
                  }}
                >
                  {supImportBusy ? "처리 중…" : "미리보기 반영"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 담당자 등록 모달 */}
        {supplierId === 'own' && showContactRegisterModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowContactRegisterModal(false);
              setSelectedRegisterContactKeys([]);
            }}
          >
            <div
              className="bg-white rounded-[20px] w-full max-w-[900px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-2xl font-bold" style={{ color: 'var(--aifix-navy)' }}>
                  담당자 등록하기
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowContactRegisterModal(false);
                    setSelectedRegisterContactKeys([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-6 h-6" style={{ color: 'var(--aifix-gray)' }} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4 text-sm space-y-1" style={{ color: 'var(--aifix-gray)' }}>
                  <p>회사 프로필에 등록된 전체 직원 중에서 1명 이상을 선택합니다.</p>
                  <p className="text-xs sm:text-sm">
                    이미 아래 「담당자 정보」표에 올라간 인원은 중복 방지를 위해 선택할 수 없습니다.
                  </p>
                </div>

                <div className="max-h-[55vh] overflow-y-auto border border-gray-200 rounded-xl">
                  {ownProfileLoading ? (
                    <div className="px-4 py-8 text-sm text-gray-500">담당자 목록을 불러오는 중…</div>
                  ) : !ownProfile?.has_profile ? (
                    <div className="px-4 py-8 text-sm text-gray-500">
                      승인된 회사 프로필이 있으면 회사에 등록된 담당자가 여기 표시됩니다.
                    </div>
                  ) : companyContactsForRegisterModal.length === 0 ? (
                    <div className="px-4 py-8 text-sm text-gray-500">
                      회사 프로필에 등록된 담당자가 없습니다. 회사 프로필의 담당자 정보를 먼저
                      확인해 주세요.
                    </div>
                  ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="w-[72px] py-3 px-4 text-left text-sm font-semibold" style={{ color: 'var(--aifix-navy)' }}>
                          선택
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold" style={{ color: 'var(--aifix-navy)' }}>
                          부서명
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold" style={{ color: 'var(--aifix-navy)' }}>
                          직급
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold" style={{ color: 'var(--aifix-navy)' }}>
                          이름
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold" style={{ color: 'var(--aifix-navy)' }}>
                          이메일
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold" style={{ color: 'var(--aifix-navy)' }}>
                          연락처
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                        {companyContactsForRegisterModal.map((c) => {
                          const alreadyOnSheet = editableContacts.some((p: any) =>
                            isSameContactAsEditableRow(
                              {
                                emailValue: c.emailValue,
                                nameRaw: c.nameRaw,
                                phoneValue: c.phoneValue,
                              },
                              p,
                            ),
                          );
                          return (
                            <tr
                              key={c.rowKey}
                              className={`border-t border-gray-100 transition-colors ${
                                alreadyOnSheet ? "bg-slate-50/90" : "hover:bg-gray-50"
                              }`}
                            >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                                  disabled={alreadyOnSheet}
                                  checked={
                                    !alreadyOnSheet && selectedRegisterContactKeys.includes(c.rowKey)
                                  }
                                  onChange={() => {
                                    if (!alreadyOnSheet) toggleRegisterContactKey(c.rowKey);
                                  }}
                                  title={
                                    alreadyOnSheet
                                      ? "이미 담당자 정보 표에 등록된 인원입니다."
                                      : undefined
                                  }
                                  style={{ accentColor: "var(--aifix-primary)" }}
                            />
                          </td>
                              <td className="py-3 px-4 text-sm" style={{ color: "var(--aifix-navy)" }}>
                            {c.department}
                          </td>
                              <td className="py-3 px-4 text-sm" style={{ color: "var(--aifix-navy)" }}>
                            {c.position}
                          </td>
                              <td className="py-3 px-4 text-sm" style={{ color: "var(--aifix-navy)" }}>
                            {c.name}
                                {alreadyOnSheet ? (
                                  <span
                                    className="ml-2 text-xs font-medium text-gray-400"
                                    title="이미 등록됨"
                                  >
                                    (등록됨)
                                  </span>
                                ) : null}
                          </td>
                              <td className="py-3 px-4 text-sm" style={{ color: "var(--aifix-navy)" }}>
                                {c.emailDisplay}
                          </td>
                              <td className="py-3 px-4 text-sm" style={{ color: "var(--aifix-navy)" }}>
                                {c.phoneDisplay}
                          </td>
                        </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowContactRegisterModal(false);
                    setSelectedRegisterContactKeys([]);
                  }}
                  className="px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
                  style={{ borderColor: 'var(--aifix-gray)', color: 'var(--aifix-navy)', fontWeight: 600 }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRegisterSelectedContacts}
                  className="px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: 'var(--aifix-primary)', fontWeight: 600 }}
                >
                  선택 등록
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content (탭 헤더는 카드 내부로 이동) */}
        {renderTabContent()}
      </div>

      {/* 수정 요청 모달 */}
      {showRevisionRequestModal && canSendRevisionRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowRevisionRequestModal(false)}
        >
          <div
            className="bg-white rounded-[20px] w-full max-w-[720px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold" style={{ color: 'var(--aifix-navy)' }}>
                협력사 데이터 수정 요청
              </h3>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">요청 대상 회사</label>
                <input
                  type="text"
                  value={revisionRequestTarget}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">요청 데이터 유형 선택</label>
                <select
                  value={revisionRequestDataType}
                  onChange={(e) => setRevisionRequestDataType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5B3BFA]"
                >
                  <option value="">선택해주세요</option>
                  <option value="company-info">기업 기본정보</option>
                  <option value="facilities">사업장 정보</option>
                  <option value="contacts">담당자 정보</option>
                  <option value="products">생산(납품) 제품 정보</option>
                  <option value="materials">자재 정보</option>
                  <option value="energy">에너지 정보</option>
                  <option value="transport">운송 정보</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">요청 내용 입력</label>
                <textarea
                  value={revisionRequestContent}
                  onChange={(e) => setRevisionRequestContent(e.target.value)}
                  placeholder="수정이 필요한 내용을 상세히 입력해주세요..."
                  className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5B3BFA]"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRevisionRequestModal(false)}
                className="px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
                style={{
                  borderColor: 'var(--aifix-gray)',
                  color: 'var(--aifix-navy)',
                  background: 'white',
                }}
              >
                취소
              </button>

              <button
                type="button"
                onClick={handleSendRevisionRequest}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)',
                }}
              >
                <Send className="w-5 h-5" />
                요청 전송
              </button>
            </div>
          </div>
        </div>
      )}

      <EprCo2eFactorPickerModal
        open={eprPickerTarget !== null}
        onClose={() => setEprPickerTarget(null)}
        onApply={({ co2eFactor, factorUnit, label }) => {
          const t = eprPickerTarget;
          if (!t) return;
          const f = String(co2eFactor);
          if (t.kind === 'productWaste') {
            setEditableProducts((prev) =>
              prev.map((r, i) =>
                i === t.rowIndex ? { ...r, wasteEmissionFactor: f, wasteEmissionFactorUnit: factorUnit } : r,
              ),
            );
          } else if (t.kind === 'material') {
            setEditableMaterials((prev) =>
              prev.map((r, i) =>
                i === t.rowIndex
                  ? { ...r, materialEmissionFactor: f, materialEmissionFactorUnit: factorUnit }
                  : r,
              ),
            );
          } else if (t.kind === 'mineral') {
            setEditableMaterials((prev) =>
              prev.map((r, i) =>
                i === t.rowIndex
                  ? { ...r, mineralEmissionFactor: f, mineralEmissionFactorUnit: factorUnit }
                  : r,
              ),
            );
          } else if (t.kind === 'energy') {
            setEditableEnergy((prev) =>
              prev.map((r, i) =>
                i === t.rowIndex ? { ...r, emissionFactor: f, emissionFactorUnit: factorUnit } : r,
              ),
            );
          } else {
            setEditableTransport((prev) =>
              prev.map((r, i) =>
                i === t.rowIndex ? { ...r, emissionFactor: f, emissionFactorUnit: factorUnit } : r,
              ),
            );
          }
          setProductEditCell(null);
          setProductionEditCell(null);
          setMaterialEditCell(null);
          setEnergyEditCell(null);
          setTransportEditCell(null);
          toast.success(`배출계수 반영: ${label}`);
        }}
      />
    </div>
  );
}
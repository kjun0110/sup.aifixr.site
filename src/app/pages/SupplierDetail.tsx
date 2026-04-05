'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
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
} from "lucide-react";
import { FacilitiesTab } from "./SupplierDetailFacilitiesTabNew";
import { toast } from 'sonner';

/** 데이터관리에서 쿼리로 진입 시 supplierName은 한글일 수 있음. 이메일 더미는 URL 인코딩하지 않고 라우트 ID 기반으로 둡니다. */
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

const EMPTY_PRODUCT_ROW = () => ({
  _rowId: newRowId(),
  materialId: '',
  name: '',
  quantity: '',
  unit: '',
  standardWeight: '',
  unitWeight: '',
  deliveryDate: '',
  hsCode: '',
  mineralType: '',
  mineralContent: '',
  mineralRatio: '',
  origin: '',
  wasteQuantity: '',
  wasteEmissionFactor: '',
  wasteEmissionFactorUnit: '',
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
  transportAmount: '',
  transportAmountUnit: '',
  emissionFactor: '',
  emissionFactorUnit: '',
});

/** 검색형 드롭다운용 더미 옵션 (mock) */
const MOCK_MINERAL_ORIGIN_OPTIONS = [
  '칠레',
  '콩고(DRC)',
  '인도네시아',
  '호주',
  '필리핀',
  '아르헨티나',
  '페루',
] as const;

const MOCK_COUNTRY_OPTIONS = [
  'South Korea',
  'China',
  'Japan',
  'USA',
  'Germany',
  'Vietnam',
  'Indonesia',
  'Australia',
] as const;

/** 자재·에너지·운송 탭 제품명 컬럼 안내 (생산제품 탭과 연동) */
const PRODUCT_NAME_DROPDOWN_HINT =
  '제품명은 [생산(납품) 제품 정보] 탭에서 제품명을 먼저 입력해야 선택 항목이 표시됩니다.';

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

/** 추가입력 가능: 검색 후 목록 선택 또는 새 값 추가 */
function SearchableSelectCreatable({
  value,
  onChange,
  baseOptions,
  placeholder = '검색 또는 입력',
  emptyLabel = '선택',
}: {
  value: string;
  onChange: (v: string) => void;
  baseOptions: readonly string[];
  placeholder?: string;
  emptyLabel?: string;
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
    const s = new Set<string>([...baseOptions, ...extra]);
    if (value.trim()) s.add(value.trim());
    return Array.from(s);
  }, [baseOptions, extra, value]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return allOptions;
    return allOptions.filter((o) => o.toLowerCase().includes(t));
  }, [allOptions, q]);

  const canAdd =
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
              if (e.key === 'Enter' && canAdd) {
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
const SUP_DETAIL_TH_ACTION =
  'border border-gray-300 bg-[#F8F9FA] py-4 px-3 text-right align-middle text-sm font-semibold text-[var(--aifix-navy)] whitespace-nowrap sticky right-0 z-[2] shadow-[-8px_0_16px_-10px_rgba(15,23,42,0.25)]';
const SUP_DETAIL_TD_ACTION =
  'border border-gray-300 bg-white py-4 px-3 align-top sticky right-0 z-[1] group-hover:bg-gray-50 shadow-[-8px_0_16px_-10px_rgba(15,23,42,0.2)]';
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
  const [editableData, setEditableData] = useState({
    rmiSmelter: '',
    feoc: '',
    type: '',
  });

  // Excel upload (mock) - 탭별로 업로드 버튼을 눌렀을 때 어떤 탭인지 식별
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);
  const [excelUploadTabId, setExcelUploadTabId] = useState<string | null>(null);
  const [editableProducts, setEditableProducts] = useState<any[]>([]);
  const [editableProduction, setEditableProduction] = useState<any[]>([]);
  const [editableContacts, setEditableContacts] = useState<any[]>([]);
  const [editableMaterials, setEditableMaterials] = useState<any[]>([]);
  const [editableEnergy, setEditableEnergy] = useState<any[]>([]);
  const [editableTransport, setEditableTransport] = useState<any[]>([]);
  const [facilitiesAddRequest, setFacilitiesAddRequest] = useState(0);
  const [productEditCell, setProductEditCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [productionEditCell, setProductionEditCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [materialEditCell, setMaterialEditCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [energyEditCell, setEnergyEditCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [transportEditCell, setTransportEditCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const productEditSnapshotRef = useRef('');
  const productionEditSnapshotRef = useRef('');
  const materialEditSnapshotRef = useRef('');
  const energyEditSnapshotRef = useRef('');
  const transportEditSnapshotRef = useRef('');

  // 회사 프로필에 등록된 담당자(=회원가입한 모든 사용자) 중에서 선택
  const COMPANY_PROFILE_CONTACTS = [
    {
      department: '영업팀',
      position: '팀장',
      name: '이영희',
      email: 'sales@ourcompany.co.kr',
      phone: '+82-10-1111-2222',
    },
    {
      department: 'ESG팀',
      position: '담당자',
      name: '정은지',
      email: 'esg@ourcompany.co.kr',
      phone: '+82-10-3333-4444',
    },
  ];

  const [showContactRegisterModal, setShowContactRegisterModal] = useState(false);
  const [selectedCompanyContactEmails, setSelectedCompanyContactEmails] = useState<string[]>([]);

  // 탭 선택 엑셀 다운로드용(세부탭별 체크박스)
  const ALL_DETAIL_TAB_IDS = [
    'company-info',
    'contacts',
    'facilities',
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

  const supplier = supplierFromQuery
    ? supplierFromQuery
    : supplierId
      ? mockSupplierData[supplierId as keyof typeof mockSupplierData]
      : mockSupplierData['supplier1'];

  const supplierNameKey = searchParams.get('supplierName') ?? '';
  const supplierSyncRef = useRef(supplier);
  supplierSyncRef.current = supplier;

  useEffect(() => {
    const s = supplierSyncRef.current;
    setEditableProducts(
      (() => {
        const rows = (s.products ?? []).map((r: Record<string, unknown>) => ({
          ...r,
          _rowId: (r._rowId as string) ?? newRowId(),
        }));
        return rows.length > 0 ? rows : [EMPTY_PRODUCT_ROW()];
      })(),
    );
    setEditableProduction(
      (s.production ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        _rowId: (r._rowId as string) ?? newRowId(),
      })),
    );
    setEditableContacts([...(s.contacts ?? [])]);

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
          _rowId: (r._rowId as string) ?? newRowId(),
        }));
        return rows.length > 0 ? rows : [EMPTY_ENERGY_ROW()];
      })(),
    );
    setEditableTransport(
      (() => {
        const rows = (s.transport ?? []).map((r: Record<string, unknown>) => ({
          ...r,
          _rowId: (r._rowId as string) ?? newRowId(),
        }));
        return rows.length > 0 ? rows : [EMPTY_TRANSPORT_ROW()];
      })(),
    );
  }, [supplierId, supplierNameKey]);

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
  const directUpperTierLabel = (() => {
    if (supplierTierNum === null) return '-';
    if (supplierId === 'own') {
      if (projectId === 'p1' && supplierTierNum === 1) return '삼성SDI';
      return supplierTierNum <= 1 ? '-' : `Tier${supplierTierNum - 1}`;
    }
    return supplierTierNum <= 1 ? '원청사' : `Tier${supplierTierNum - 1}`;
  })();

  const pcfPartial = supplier.pcf;
  const pcfFinal =
    projectId === 'p1' && supplierId === 'own'
      ? '-'
      : supplier.status === '완료' || supplier.status === '검토완료'
        ? supplier.pcf
        : '-';

  // Initialize editable data when supplier changes
  // - 본사(own)인 경우 RMI/FEOC는 "선택" 상태로 시작해야 합니다.
  useEffect(() => {
    if (!supplier) return;

    const rmiSmelterNext =
      supplierId === 'own' ? '' : supplier.companyInfo.rmiSmelter;
    const feocNext =
      supplierId === 'own' ? '' : supplier.companyInfo.feoc;
    const typeNext =
      supplierId === 'own' ? '' : supplier.type;

    // state가 이미 같은 경우에는 업데이트를 스킵해 불필요한 렌더/루프를 방지합니다.
    if (
      editableData.rmiSmelter === rmiSmelterNext &&
      editableData.feoc === feocNext &&
      editableData.type === typeNext
    ) {
      return;
    }

    setEditableData({
      rmiSmelter: rmiSmelterNext,
      feoc: feocNext,
      type: typeNext,
    });
  }, [
    supplierId,
    supplier?.type,
    supplier?.companyInfo?.rmiSmelter,
    supplier?.companyInfo?.feoc,
  ]);

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
    { id: "contacts", label: "담당자 정보" },
    { id: "facilities", label: "사업장 정보" },
    { id: "products", label: "생산(납품) 제품 정보" },
    { id: "materials", label: "자재 정보" },
    { id: "energy", label: "에너지 정보" },
    { id: "transport", label: "운송 정보" },
  ];

  const handleExcelDownload = (tabId: string) => {
    const tabLabel = tabs.find((t) => t.id === tabId)?.label ?? tabId;
    toast.success(`${tabLabel} 엑셀 다운로드 준비 (mock)`);
  };

  const handleExcelDownloadSelectedTabs = (tabIds?: string[]) => {
    if (supplierId !== 'own') return;
    const selected = tabIds ?? selectedExcelDownloadTabs;
    if (selected.length === 0) {
      toast.error('엑셀 다운로드에 포함할 세부탭을 1개 이상 선택해주세요.');
      return;
    }

    const labels = selected
      .map((id) => tabs.find((t) => t.id === id)?.label ?? id)
      .join(', ');

    toast.success(`선택 세부탭 엑셀 다운로드 (mock)\n시트: ${labels}`);
  };

  const handleExcelUploadClick = (tabId: string) => {
    setExcelUploadTabId(tabId);
    excelFileInputRef.current?.click();
  };

  const handleExcelFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !excelUploadTabId) return;

    const tabLabel = tabs.find((t) => t.id === excelUploadTabId)?.label ?? excelUploadTabId;
    toast.success(`${tabLabel} 파일 업로드 완료: ${file.name} (mock)`);

    // allow re-uploading same file
    e.target.value = '';
    setExcelUploadTabId(null);
  };

  const handleSaveComplete = () => {
    toast.success('저장되었습니다');
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
    setSelectedCompanyContactEmails([]);
    setShowContactRegisterModal(true);
  };

  const toggleCompanyContactEmail = (email: string) => {
    setSelectedCompanyContactEmails((prev) => {
      if (prev.includes(email)) return prev.filter((x) => x !== email);
      return [...prev, email];
    });
  };

  const handleConfirmRegisterSelectedContacts = () => {
    if (selectedCompanyContactEmails.length === 0) {
      alert('담당자를 1명 이상 선택해주세요.');
      return;
    }

    const selectedContacts = COMPANY_PROFILE_CONTACTS.filter((c) =>
      selectedCompanyContactEmails.includes(c.email),
    );

    setEditableContacts((prev) => {
      const existingEmails = new Set((prev ?? []).map((p: any) => String(p.email ?? '')));
      const next = [...(prev ?? [])];

      selectedContacts.forEach((c) => {
        if (!existingEmails.has(String(c.email))) {
          next.push(c);
        }
      });

      return next;
    });

    setSelectedCompanyContactEmails([]);
    setShowContactRegisterModal(false);
  };

  const TabExcelActions = ({ tabId }: { tabId: string }) => {
    const showCompanyInfoNote = supplierId === 'own' && tabId === 'company-info';
    const addRowLabel = tabId === 'facilities' ? '사업장 추가하기' : '행추가';
    const isContactsTab = tabId === 'contacts';
    const isCompanyInfoTab = tabId === 'company-info';
    const isCompanyInfoTypeIncomplete =
      supplierId === 'own' && isCompanyInfoTab && !String(editableData.type ?? '').trim();
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
              onClick={handleSaveComplete}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
              style={{ background: 'var(--aifix-primary)' }}
            >
              <span style={{ fontWeight: 600 }}>수정 완료</span>
            </button>
          )}
          {isCompanyInfoTab && (
            <button
              type="button"
              onClick={handleSaveComplete}
              disabled={isCompanyInfoTypeIncomplete}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--aifix-primary)' }}
            >
              <span style={{ fontWeight: 600 }}>수정 완료</span>
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
    if (supplierId === 'own') return editableMaterials;
    const rows = (supplier.materials ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      _rowId: (r._rowId as string) ?? newRowId(),
    }));
    return rows.length > 0 ? rows : [EMPTY_MATERIAL_ROW()];
  }, [supplierId, editableMaterials, supplier.materials]);

  const displayEnergy = useMemo(() => {
    if (supplierId === 'own') return editableEnergy;
    const rows = (supplier.energy ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      _rowId: (r._rowId as string) ?? newRowId(),
    }));
    return rows.length > 0 ? rows : [EMPTY_ENERGY_ROW()];
  }, [supplierId, editableEnergy, supplier.energy]);

  const displayTransport = useMemo(() => {
    if (supplierId === 'own') return editableTransport;
    const rows = (supplier.transport ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      _rowId: (r._rowId as string) ?? newRowId(),
    }));
    return rows.length > 0 ? rows : [EMPTY_TRANSPORT_ROW()];
  }, [supplierId, editableTransport, supplier.transport]);

  const productNameOptions: string[] = Array.from(
    new Set(
      (displayProducts ?? [])
        .map((p: any) => String(p?.name ?? ''))
        .filter((n: string) => n.trim().length > 0),
    ),
  );

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
    <div className="flex items-center justify-end gap-0.5">
      <button
        type="button"
        onClick={onInsertBelow}
        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-violet-50 hover:text-[var(--aifix-primary)] transition-colors"
        title="이 행 아래에 새 행 추가"
        aria-label="이 행 아래에 새 행 추가"
      >
        <ListPlus className="w-4 h-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
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
    switch (activeTab) {
      case "company-info":
        return (
          <EditableSupplierTableShell tabId="company-info">
            <table className={SUP_DETAIL_TABLE}>
              <tbody>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL} style={{ width: '200px' }}>
                    회사명
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.name}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    사업자등록번호
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.registrationNumber}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.registrationNumber}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    국가 소재지
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.country}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.country}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    상세주소
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.location}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.location}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    DUNS Number
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.dunsNumber}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.dunsNumber}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    텍스 ID
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.taxId}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.taxId}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    공식 홈페이지 주소
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.website}</span>
                      </div>
                    ) : (
                      <a 
                        href={supplier.companyInfo.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--aifix-primary)', textDecoration: 'underline' }}
                      >
                        {supplier.companyInfo.website}
                      </a>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    대표자명
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.representative}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.representative}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    대표 이메일
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.email}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.email}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>
                    대표자 연락처
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.phone}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.phone}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>RMI 인증 여부</td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {supplier.companyInfo.rmiSmelter || '-'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL}>FEOC 여부</td>
                  <td className={SUP_DETAIL_TD}>
                    <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>
                      {supplier.companyInfo.feoc || '-'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className={SUP_DETAIL_TD_LABEL} style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                    공급자 유형
                  </td>
                  <td className={SUP_DETAIL_TD}>
                    {supplierId === 'own' ? (
                      <input
                        type="text"
                        value={editableData.type}
                        className="flex-1 px-4 py-2 rounded-lg border w-full transition-all duration-200 focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: '#E2E8F0', 
                          color: 'var(--aifix-navy)',
                          fontWeight: 700,
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                        onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                        onChange={(e) => setEditableData({ ...editableData, type: e.target.value })}
                      />
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 700 }}>{supplier.type}</span>
                    )}
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
                          광물 원산지
                        </th>
                        <th className={SUP_DETAIL_TH}>
                          납품일
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
                          폐기물량
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
                            {isOwnSupplier && index === 0 ? (
                              <SearchableSelectStrict
                                value={String(product.origin ?? '')}
                                onChange={(v) =>
                                  setEditableProducts((prev) =>
                                    prev.map((r, i) => (i === index ? { ...r, origin: v } : r)),
                                  )
                                }
                                options={MOCK_MINERAL_ORIGIN_OPTIONS}
                                placeholder="광물 원산지 검색"
                              />
                            ) : (
                              renderOwnTextCell('product', index, 'origin', product.origin)
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
                                baseOptions={['kg', 'ton', 'g', 'EA', '개', 'm³']}
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
                            {renderOwnTextCell('product', index, 'wasteQuantity', product.wasteQuantity)}
                          </td>
                          <td className={SUP_DETAIL_TD}>
                            {renderOwnTextCell('product', index, 'wasteEmissionFactor', product.wasteEmissionFactor)}
                          </td>
                          <td className={SUP_DETAIL_TD}>
                            {renderOwnTextCell('product', index, 'wasteEmissionFactorUnit', product.wasteEmissionFactorUnit)}
                          </td>
                          {isOwnSupplier && (
                            <td className={SUP_DETAIL_TD_ACTION}>
                              <div className="flex h-8 items-center justify-end">
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
                      {renderOwnTextCell('material', index, 'inputAmountUnit', row.inputAmountUnit)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('material', index, 'materialEmissionFactor', row.materialEmissionFactor)}
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
                      {isOwnSupplier && index === 0 ? (
                        <SearchableSelectStrict
                          value={String(row.mineralOrigin ?? '')}
                          onChange={(v) =>
                            setEditableMaterials((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, mineralOrigin: v } : r)),
                            )
                          }
                          options={MOCK_MINERAL_ORIGIN_OPTIONS}
                          placeholder="광물 원산지 검색"
                        />
                      ) : (
                        renderOwnTextCell('material', index, 'mineralOrigin', row.mineralOrigin)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('material', index, 'mineralEmissionFactor', row.mineralEmissionFactor)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('material', index, 'mineralEmissionFactorUnit', row.mineralEmissionFactorUnit)}
                    </td>
                    {isOwnSupplier && (
                      <td className={SUP_DETAIL_TD_ACTION}>
                        <div className="flex h-8 items-center justify-end">
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
                          baseOptions={['전기', '가스', '스팀']}
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
                          <option value="전기">전기</option>
                          <option value="가스">가스</option>
                          <option value="스팀">스팀</option>
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
                          baseOptions={['kWh', 'MJ', 'GJ', 'm³']}
                          placeholder="에너지 단위 검색·추가"
                        />
                      ) : (
                        renderOwnTextCell('energy', index, 'energyUnit', row.energyUnit)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('energy', index, 'emissionFactor', row.emissionFactor)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('energy', index, 'emissionFactorUnit', row.emissionFactorUnit)}
                    </td>
                    {isOwnSupplier && (
                      <td className={SUP_DETAIL_TD_ACTION}>
                        <div className="flex h-8 items-center justify-end">
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
                  <th className={SUP_DETAIL_TH}>
                    제품명
                  </th>
                  <th className={SUP_DETAIL_TH}>출발지 국가</th>
                  <th className={SUP_DETAIL_TH}>출발지 상세 주소</th>
                  <th className={SUP_DETAIL_TH}>도착지 국가</th>
                  <th className={SUP_DETAIL_TH}>도착지 상세주소</th>
                  <th className={SUP_DETAIL_TH}>운송수단</th>
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
                      {isOwnSupplier && index === 0 ? (
                        <SearchableSelectStrict
                          value={String(row.originCountry ?? '')}
                          onChange={(v) =>
                            setEditableTransport((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, originCountry: v } : r)),
                            )
                          }
                          options={MOCK_COUNTRY_OPTIONS}
                          placeholder="출발지 국가 검색"
                        />
                      ) : (
                        renderOwnTextCell('transport', index, 'originCountry', row.originCountry)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('transport', index, 'originAddress', row.originAddress)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier && index === 0 ? (
                        <SearchableSelectStrict
                          value={String(row.destinationCountry ?? '')}
                          onChange={(v) =>
                            setEditableTransport((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, destinationCountry: v } : r)),
                            )
                          }
                          options={MOCK_COUNTRY_OPTIONS}
                          placeholder="도착지 국가 검색"
                        />
                      ) : (
                        renderOwnTextCell('transport', index, 'destinationCountry', row.destinationCountry)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('transport', index, 'destinationAddress', row.destinationAddress)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier && index === 0 ? (
                        <SearchableSelectCreatable
                          value={String(row.transportMethod ?? '')}
                          onChange={(v) =>
                            setEditableTransport((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, transportMethod: v } : r)),
                            )
                          }
                          baseOptions={['육운', '해운', '항공', '철도']}
                          placeholder="운송수단 검색·추가"
                        />
                      ) : isOwnSupplier ? (
                        <select
                          value={String(row.transportMethod ?? '')}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEditableTransport((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, transportMethod: v } : r)),
                            );
                          }}
                          className={SUP_DETAIL_NATIVE_SELECT}
                        >
                          <option value="">선택</option>
                          <option value="육운">육운</option>
                          <option value="해운">해운</option>
                          <option value="항공">항공</option>
                        </select>
                      ) : (
                        <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                          {String(row.transportMethod ?? '')}
                        </span>
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('transport', index, 'transportAmount', row.transportAmount)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {isOwnSupplier && index === 0 ? (
                        <SearchableSelectCreatable
                          value={String(row.transportAmountUnit ?? '')}
                          onChange={(v) =>
                            setEditableTransport((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, transportAmountUnit: v } : r)),
                            )
                          }
                          baseOptions={['kg', 'ton', 'TEU', 'CBM']}
                          placeholder="물량 단위 검색·추가"
                        />
                      ) : (
                        renderOwnTextCell('transport', index, 'transportAmountUnit', row.transportAmountUnit)
                      )}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('transport', index, 'emissionFactor', row.emissionFactor)}
                    </td>
                    <td className={SUP_DETAIL_TD}>
                      {renderOwnTextCell('transport', index, 'emissionFactorUnit', row.emissionFactorUnit)}
                    </td>
                    {isOwnSupplier && (
                      <td className={SUP_DETAIL_TD_ACTION}>
                        <div className="flex h-8 items-center justify-end">
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
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                    style={supplierId === 'own' ? { backgroundColor: '#F8FAFC' } : {}}
                  >
                    <td
                      className={SUP_DETAIL_TD_CONTACTS}
                      style={{
                        color: supplierId === 'own' ? '#94A3B8' : 'var(--aifix-navy)',
                        fontSize: '14px',
                      }}
                    >
                      {contact.department}
                    </td>
                    <td
                      className={SUP_DETAIL_TD_CONTACTS}
                      style={{
                        color: supplierId === 'own' ? '#94A3B8' : 'var(--aifix-navy)',
                        fontSize: '14px',
                      }}
                    >
                      {contact.position}
                    </td>
                    <td
                      className={SUP_DETAIL_TD_CONTACTS}
                      style={{
                        color: supplierId === 'own' ? '#94A3B8' : 'var(--aifix-navy)',
                        fontSize: '14px',
                      }}
                    >
                      {contact.name}
                    </td>
                    <td
                      className={SUP_DETAIL_TD_CONTACTS}
                      style={{
                        color: supplierId === 'own' ? '#94A3B8' : 'var(--aifix-navy)',
                        fontSize: '14px',
                      }}
                    >
                      {contact.email}
                    </td>
                    <td
                      className={SUP_DETAIL_TD_CONTACTS}
                      style={{
                        color: supplierId === 'own' ? '#94A3B8' : 'var(--aifix-navy)',
                        fontSize: '14px',
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

        <input
          ref={excelFileInputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={handleExcelFileChange}
        />

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

        {/* 담당자 등록 모달 */}
        {supplierId === 'own' && showContactRegisterModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowContactRegisterModal(false);
              setSelectedCompanyContactEmails([]);
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
                    setSelectedCompanyContactEmails([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-6 h-6" style={{ color: 'var(--aifix-gray)' }} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4 text-sm" style={{ color: 'var(--aifix-gray)' }}>
                  회사 프로필에 등록된 전체 직원 중에서 1명 이상을 선택합니다.
                </div>

                <div className="max-h-[55vh] overflow-y-auto border border-gray-200 rounded-xl">
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
                      {COMPANY_PROFILE_CONTACTS.map((c) => (
                        <tr key={c.email} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedCompanyContactEmails.includes(c.email)}
                              onChange={() => toggleCompanyContactEmail(c.email)}
                              style={{ accentColor: 'var(--aifix-primary)' }}
                            />
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: 'var(--aifix-navy)' }}>
                            {c.department}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: 'var(--aifix-navy)' }}>
                            {c.position}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: 'var(--aifix-navy)' }}>
                            {c.name}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: 'var(--aifix-navy)' }}>
                            {c.email}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: 'var(--aifix-navy)' }}>
                            {c.phone}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowContactRegisterModal(false);
                    setSelectedCompanyContactEmails([]);
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
                  <option value="contacts">담당자 정보</option>
                  <option value="facilities">사업장 정보</option>
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
    </div>
  );
}
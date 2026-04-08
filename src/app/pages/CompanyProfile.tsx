'use client';

import { Pencil, Plus, TableProperties, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  restoreSupSessionFromCookie,
  AIFIXR_SESSION_UPDATED_EVENT,
} from "@/lib/api/client";
import {
  getMySupplierProfile,
  patchMySupplierProfile,
  type SupplierProfileMe,
} from "@/lib/api/supplierProfile";
import { searchRmiSmelters, type RefRmiSmelterItem } from "@/lib/api/dataMgmtReference";
import {
  emptySiteForm,
  useSites,
  type Site,
} from "../contexts/SiteContext";

type ProfileTab = 'basic' | 'contacts' | 'sites';

/** 탭 전환 시 표 위에 표시하는 안내 (선택한 영역의 역할을 바로 이해하도록) */
const TAB_DESCRIPTIONS: Record<ProfileTab, string> = {
  basic:
    '회원가입 시 등록한 정보가 표시됩니다. 아래 항목을 수정한 뒤 저장하면 반영됩니다.',
  contacts:
    '본 시스템에 가입한 직원 정보입니다. 회원가입 시 자동 반영 됩니다.',
  sites:
    '사업장은 회사 전역에서 한 번 등록하면 모든 프로젝트에서 공유됩니다. 데이터 입력 화면에서 목록을 선택해 사용할 수 있습니다.',
};

const PROFILE_TABLE = 'w-full border-collapse border border-gray-300';
const PROFILE_TH =
  'border border-gray-300 bg-[#F8F9FA] py-4 px-4 text-left align-middle text-sm font-semibold text-[var(--aifix-navy)]';
const PROFILE_TD = 'border border-gray-300 py-4 px-4 align-top text-sm text-[var(--aifix-navy)]';
const PROFILE_TD_LABEL =
  'border border-gray-300 bg-[#F9FAFB] py-4 px-4 align-top text-sm font-medium text-[var(--aifix-gray)]';

/** 회사 프로필·백엔드 `supplier_type`에 저장되는 공급자 유형 (3택1) */
const SUPPLIER_TYPE_MINING_SMELTER = '채굴/제련사' as const;

const SUPPLIER_TYPE_OPTIONS: { value: string; title: string; hint: string }[] = [
  {
    value: '제조사',
    title: '제조사',
    hint: '원료·부품을 가공·조립해 제품을 만드는 사업자 (예: 양극재 제조, 셀 조립)',
  },
  {
    value: '가공사',
    title: '가공사',
    hint: '원료를 가공해 중간재를 만드는 사업자 (예: 전구체 가공, 소재 가공)',
  },
  {
    value: SUPPLIER_TYPE_MINING_SMELTER,
    title: '채굴/제련사',
    hint: '천연자원 채굴 또는 제련을 수행하는 사업자 (예: 리튬·니켈 광산, 제련소)',
  },
];

function isSmelterSupplierType(supplierType: string): boolean {
  return supplierType.trim() === SUPPLIER_TYPE_MINING_SMELTER;
}

function isKnownSupplierType(supplierType: string): boolean {
  const t = supplierType.trim();
  return SUPPLIER_TYPE_OPTIONS.some((o) => o.value === t);
}

/** 사업장 표 조회: 미입력 칸 */
function displaySiteCell(value: unknown): string {
  const t = value == null ? "" : String(value).trim();
  return t === "" ? "미기입" : t;
}

/**
 * RMI: 채굴/제련사만 미인증·저장값 표시. 그 외 유형 → 해당없음 (데이터 입력 화면과 동일 규칙).
 */
function displayRmiForSiteTable(supplierType: string, rmiStored: unknown): string {
  if (isSmelterSupplierType(supplierType)) {
    const r = rmiStored == null ? "" : String(rmiStored).trim();
    return r === "" ? "미인증" : r;
  }
  return "해당없음";
}

type BasicFormState = {
  company_name: string;
  business_reg_no: string;
  country_location: string;
  address: string;
  duns_number: string;
  tax_id: string;
  website_url: string;
  rep_name: string;
  rep_email: string;
  rep_phone: string;
  supplier_type: string;
  rmi_certified: string;
  feoc_status: string;
};

const EMPTY_BASIC_FORM: BasicFormState = {
  company_name: '',
  business_reg_no: '',
  country_location: '',
  address: '',
  duns_number: '',
  tax_id: '',
  website_url: '',
  rep_name: '',
  rep_email: '',
  rep_phone: '',
  supplier_type: '',
  rmi_certified: '',
  feoc_status: '',
};

/** 기업 기본정보에 국가만 비어 있고 주소에 국가명이 포함된 경우(예: 대한민국 충청북도…) 사업장 국가 필드 보조 */
function deriveCountryFromAddress(address: string): string {
  const t = address.trim();
  if (!t) return '';
  if (/^대한민국\b/.test(t)) return '대한민국';
  if (/^한국\b/.test(t)) return '대한민국';
  if (/^(Republic of Korea|South Korea)\b/i.test(t)) return '대한민국';
  return '';
}

/** 스킴·호스트 없이 스킴만 저장된 값은 빈 칸으로 표시 */
function normalizeWebsiteUrlForForm(raw: string | null | undefined): string {
  const t = (raw ?? '').trim();
  if (t === '' || t === 'https://' || t === 'http://') return '';
  return t;
}

function profileToBasicForm(p: SupplierProfileMe): BasicFormState {
  return {
    company_name: p.company_name ?? '',
    business_reg_no: p.business_reg_no ?? '',
    country_location: p.country_location ?? '',
    address: (p.address ?? '').trim(),
    duns_number: (p.duns_number ?? '').trim(),
    tax_id: (p.tax_id ?? '').trim(),
    website_url: normalizeWebsiteUrlForForm(p.website_url),
    rep_name: (p.rep_name ?? '').trim(),
    rep_email: (p.rep_email ?? '').trim(),
    rep_phone: (p.rep_phone ?? '').trim(),
    supplier_type: p.supplier_type ?? '',
    rmi_certified: p.rmi_certified ?? '',
    feoc_status: p.feoc_status ?? '',
  };
}

type ContactRow = {
  department: string;
  position: string;
  name: string;
  email: string;
  phone: string;
};

export function CompanyProfile() {
  const router = useRouter();
  const {
    sites,
    sitesLoading,
    sitesError,
    addSite,
    updateSite,
    deleteSite,
    refreshSites,
  } = useSites();
  const [activeTab, setActiveTab] = useState<ProfileTab>('basic');
  const [profile, setProfile] = useState<SupplierProfileMe | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [basicForm, setBasicForm] = useState<BasicFormState>(EMPTY_BASIC_FORM);
  const [basicSaving, setBasicSaving] = useState(false);
  const [showRmiPicker, setShowRmiPicker] = useState(false);
  const [rmiQuery, setRmiQuery] = useState("");
  const [rmiReportType, setRmiReportType] = useState("");
  const [rmiResults, setRmiResults] = useState<RefRmiSmelterItem[]>([]);
  const [rmiTotal, setRmiTotal] = useState(0);
  const [rmiLoading, setRmiLoading] = useState(false);
  const [selectedRmiId, setSelectedRmiId] = useState<number | null>(null);
  const [rmiOffset, setRmiOffset] = useState(0);
  const RMI_PAGE_SIZE = 50;
  const rmiCurrentPage = Math.floor(rmiOffset / RMI_PAGE_SIZE) + 1;
  const rmiTotalPages = Math.max(1, Math.ceil(rmiTotal / RMI_PAGE_SIZE));
  const rmiPageWindow = 10;
  const rmiPageStart = Math.max(
    1,
    Math.min(
      rmiCurrentPage - Math.floor(rmiPageWindow / 2),
      Math.max(1, rmiTotalPages - rmiPageWindow + 1),
    ),
  );
  const rmiPageEnd = Math.min(rmiTotalPages, rmiPageStart + rmiPageWindow - 1);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        await restoreSupSessionFromCookie();
        const data = await getMySupplierProfile();
        if (!cancelled) setProfile(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("401")) {
          if (!cancelled) router.replace("/");
          return;
        }
        if (!cancelled) {
          setProfile(null);
          setProfileError(msg || "프로필을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    void loadProfile();

    const onSession = () => {
      void loadProfile();
    };
    if (typeof window !== "undefined") {
      window.addEventListener(AIFIXR_SESSION_UPDATED_EVENT, onSession);
    }
    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener(AIFIXR_SESSION_UPDATED_EVENT, onSession);
      }
    };
  }, [router]);

  useEffect(() => {
    if (profile?.has_profile) {
      setBasicForm(profileToBasicForm(profile));
    } else {
      setBasicForm(EMPTY_BASIC_FORM);
    }
  }, [profile]);

  const contacts: ContactRow[] = useMemo(() => {
    if (!profile?.has_profile || !profile.contacts?.length) return [];
    return profile.contacts.map((c) => ({
      department: c.department || "—",
      position: c.position || "—",
      name: c.name || "—",
      email: c.email || "—",
      phone: c.phone || "—",
    }));
  }, [profile]);
  const [showModal, setShowModal] = useState(false);
  const [editingServerId, setEditingServerId] = useState<number | null>(null);
  const [siteSaving, setSiteSaving] = useState(false);
  const [isSameAsHeadquarter, setIsSameAsHeadquarter] = useState(false);
  const [newSite, setNewSite] = useState<Site>(() => emptySiteForm());

  const resetSiteForm = () => {
    setIsSameAsHeadquarter(false);
    setEditingServerId(null);
    setNewSite(emptySiteForm());
  };

  const companyRegistrationNumber =
    basicForm.business_reg_no.trim() || (profile?.business_reg_no ?? "").trim() || "";

  const fillSiteFromCompanyBasic = () => {
    if (!profile?.has_profile) return;
    setNewSite((prev) => {
      const addr = (basicForm.address || profile.address || '').trim();
      const loc = (basicForm.country_location || profile.country_location || '').trim();
      const countryVal = loc || deriveCountryFromAddress(addr);
      const brn = basicForm.business_reg_no.trim();
      return {
        ...prev,
        businessRegNo: brn || prev.businessRegNo,
        name: basicForm.company_name.trim() || prev.name,
        country: countryVal || prev.country,
        address: addr || prev.address,
        representative: basicForm.rep_name.trim() || prev.representative,
        email: basicForm.rep_email.trim() || prev.email,
        phone: basicForm.rep_phone.trim() || prev.phone,
        rmiSmelter: basicForm.rmi_certified.trim() || prev.rmiSmelter,
        feoc: basicForm.feoc_status.trim() || prev.feoc,
      };
    });
  };

  const handleSaveBasic = async () => {
    if (!profile?.has_profile) return;
    if (!basicForm.company_name.trim() || !basicForm.business_reg_no.trim()) {
      toast.error('회사명과 사업자등록번호는 필수입니다.');
      return;
    }
    setBasicSaving(true);
    try {
      await restoreSupSessionFromCookie();
      const smelter = isSmelterSupplierType(basicForm.supplier_type);
      const updated = await patchMySupplierProfile({
        company_name: basicForm.company_name.trim(),
        business_reg_no: basicForm.business_reg_no.trim(),
        rep_name: basicForm.rep_name.trim() || null,
        address: basicForm.address.trim() || null,
        country_location: basicForm.country_location.trim(),
        duns_number: basicForm.duns_number.trim(),
        tax_id: basicForm.tax_id.trim(),
        website_url: basicForm.website_url.trim(),
        rep_email: basicForm.rep_email.trim(),
        rep_phone: basicForm.rep_phone.trim(),
        supplier_type: basicForm.supplier_type.trim(),
        rmi_certified: smelter ? basicForm.rmi_certified.trim() : '',
        feoc_status: basicForm.feoc_status.trim(),
      });
      setProfile(updated);
      toast.success('회사 기본정보를 저장했습니다.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setBasicSaving(false);
    }
  };

  const handleSearchRmi = async (nextOffset = 0) => {
    setRmiLoading(true);
    try {
      await restoreSupSessionFromCookie();
      const res = await searchRmiSmelters({
        q: rmiQuery,
        reportType: rmiReportType || undefined,
        limit: RMI_PAGE_SIZE,
        offset: nextOffset,
      });
      setRmiResults(res.items);
      setRmiTotal(res.total);
      setSelectedRmiId(null);
      setRmiOffset(nextOffset);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "RMI 스멜터 조회에 실패했습니다.");
      setRmiResults([]);
      setRmiTotal(0);
      setRmiOffset(0);
    } finally {
      setRmiLoading(false);
    }
  };

  useEffect(() => {
    if (!showRmiPicker) return;
    // 모달 오픈 직후 빈 화면 대신 기본 목록(CMRT)을 즉시 보여준다.
    setRmiReportType((prev) => prev || "CMRT");
    void (async () => {
      setRmiLoading(true);
      try {
        await restoreSupSessionFromCookie();
        const res = await searchRmiSmelters({
          q: "",
          reportType: rmiReportType || "CMRT",
          limit: RMI_PAGE_SIZE,
          offset: 0,
        });
        setRmiResults(res.items);
        setRmiTotal(res.total);
        setSelectedRmiId(null);
        setRmiOffset(0);
      } catch {
        setRmiResults([]);
        setRmiTotal(0);
      } finally {
        setRmiLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRmiPicker]);

  const basicFieldRows: { key: keyof BasicFormState; label: string; required?: boolean; type?: string; placeholder?: string }[] = [
    { key: 'company_name', label: '회사명', required: true },
    { key: 'business_reg_no', label: '사업자등록번호', required: true },
    { key: 'country_location', label: '국가 소재지', placeholder: '예: 대한민국' },
    { key: 'address', label: '상세주소' },
    { key: 'duns_number', label: 'DUNS Number' },
    { key: 'tax_id', label: '택스 ID' },
    { key: 'website_url', label: '공식 홈페이지 주소', type: 'url', placeholder: 'https://' },
    { key: 'rep_name', label: '대표자명', required: true },
    { key: 'rep_email', label: '대표 이메일', type: 'email' },
    { key: 'rep_phone', label: '대표 연락처', type: 'tel' },
  ];

  const feocRow = {
    key: 'feoc_status' as const,
    label: 'FEOC 여부',
    placeholder: '예: 해당 / 미해당',
  };

  const showRmiField = isSmelterSupplierType(basicForm.supplier_type);

  const handleSaveSite = async () => {
    if (!newSite.name.trim()) {
      toast.error('사업장 명은 필수입니다.');
      return;
    }
    if (!newSite.branchWorkplaceNo.trim()) {
      toast.error('종사업장번호를 입력해 주세요.');
      return;
    }
    if (!profile?.has_profile) {
      toast.error('승인된 회사 프로필이 있어야 사업장을 저장할 수 있습니다.');
      return;
    }
    setSiteSaving(true);
    try {
      await restoreSupSessionFromCookie();
      if (editingServerId != null) {
        await updateSite(editingServerId, newSite);
        toast.success('사업장 정보를 수정했습니다.');
      } else {
        await addSite(newSite);
        toast.success('사업장을 등록했습니다.');
      }
      resetSiteForm();
      setShowModal(false);
      await refreshSites();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setSiteSaving(false);
    }
  };

  const openEditSite = (site: Site) => {
    if (site.serverId == null) return;
    setEditingServerId(site.serverId);
    setIsSameAsHeadquarter(false);
    setNewSite({ ...site });
    setShowModal(true);
  };

  const handleDeleteSite = async (site: Site) => {
    if (site.serverId == null) return;
    if (!window.confirm(`「${site.name}」 사업장을 삭제할까요?`)) return;
    try {
      await restoreSupSessionFromCookie();
      await deleteSite(site.serverId);
      toast.success('삭제했습니다.');
      await refreshSites();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '삭제에 실패했습니다.');
    }
  };

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'basic', label: '기업 기본정보' },
    { id: 'contacts', label: '담당자 정보' },
    { id: 'sites', label: '사업장 정보' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-10">
        <h1 className="text-5xl mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          회사 프로필
        </h1>
        
      </div>

      <div className="bg-white rounded-[20px] overflow-hidden mb-6" style={{ boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.05)' }}>
        <div className="flex gap-2 border-b border-gray-200 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="px-6 py-4 border-b-2 transition-all duration-200"
              style={{
                borderBottomColor: activeTab === tab.id ? 'var(--aifix-primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--aifix-primary)' : 'var(--aifix-gray)',
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-8 pt-6 pb-0 border-b border-gray-100">
          <p
            className="text-base leading-relaxed max-w-4xl"
            style={{ color: 'var(--aifix-gray)' }}
            role="status"
            aria-live="polite"
          >
            {TAB_DESCRIPTIONS[activeTab]}
          </p>
          {profileError && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {profileError}
            </p>
          )}
          {!profileLoading && !profileError && profile && !profile.has_profile && (
            <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 max-w-4xl">
              아직 승인된 회사 프로필이 없습니다. 원청 승인이 완료되면 가입 시 등록한 정보가 여기에 표시됩니다.
            </p>
          )}
        </div>

        <div className="p-8 pt-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {profileLoading ? (
                <div className="px-4 py-8 text-sm text-gray-500">프로필 불러오는 중…</div>
              ) : profile?.has_profile ? (
                <>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => profile && setBasicForm(profileToBasicForm(profile))}
                      disabled={basicSaving}
                      className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      되돌리기
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBasic}
                      disabled={basicSaving}
                      className="px-5 py-2.5 rounded-xl text-white font-medium disabled:opacity-50"
                      style={{ background: 'var(--aifix-primary)' }}
                    >
                      {basicSaving ? '저장 중…' : '저장'}
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className={PROFILE_TABLE}>
                      <tbody>
                        {basicFieldRows.map((row) => (
                          <tr key={row.key}>
                            <td className={PROFILE_TD_LABEL} style={{ width: '220px' }}>
                              {row.label}
                              {row.required ? <span className="text-red-500 ml-0.5">*</span> : null}
                            </td>
                            <td className={PROFILE_TD}>
                              <input
                                type={row.type ?? 'text'}
                                value={basicForm[row.key]}
                                onChange={(e) =>
                                  setBasicForm((prev) => ({ ...prev, [row.key]: e.target.value }))
                                }
                                placeholder={row.placeholder}
                                className="w-full max-w-xl px-3 py-2 rounded-lg border border-gray-200 text-[var(--aifix-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--aifix-primary)]/30 focus:border-[var(--aifix-primary)]"
                              />
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td className={PROFILE_TD_LABEL} style={{ width: '220px' }}>
                            공급자 유형
                          </td>
                          <td className={PROFILE_TD}>
                            <select
                              aria-label="공급자 유형"
                              className="w-full max-w-xl px-3 py-2 rounded-lg border border-gray-200 text-[var(--aifix-navy)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--aifix-primary)]/30 focus:border-[var(--aifix-primary)]"
                              value={
                                isKnownSupplierType(basicForm.supplier_type)
                                  ? basicForm.supplier_type.trim()
                                  : ''
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                setBasicForm((prev) => ({
                                  ...prev,
                                  supplier_type: v,
                                  rmi_certified:
                                    v === SUPPLIER_TYPE_MINING_SMELTER
                                      ? prev.rmi_certified
                                      : '',
                                }));
                              }}
                            >
                              <option value="">선택하세요</option>
                              {SUPPLIER_TYPE_OPTIONS.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                  title={opt.hint}
                                >
                                  {opt.title}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2 max-w-xl">
                              제조사 · 가공사 · 채굴/제련사 중 해당 유형을 선택하세요.
                            </p>
                          </td>
                        </tr>
                        {showRmiField ? (
                          <tr>
                            <td className={PROFILE_TD_LABEL} style={{ width: '220px' }}>
                              RMI 인증 여부
                            </td>
                            <td className={PROFILE_TD}>
                              <p className="text-xs text-gray-500 mb-2">
                                채굴/제련사인 경우에만 입력합니다.
                              </p>
                              <div className="flex w-full max-w-xl items-center gap-2">
                                <input
                                  type="text"
                                  value={basicForm.rmi_certified}
                                  onChange={(e) =>
                                    setBasicForm((prev) => ({
                                      ...prev,
                                      rmi_certified: e.target.value,
                                    }))
                                  }
                                  placeholder="예: 인증됨 / 미인증 / 진행중"
                                  className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[var(--aifix-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--aifix-primary)]/30 focus:border-[var(--aifix-primary)]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowRmiPicker(true);
                                    setRmiQuery("");
                                    setRmiReportType("CMRT");
                                    setRmiResults([]);
                                    setRmiTotal(0);
                                    setSelectedRmiId(null);
                                    setRmiOffset(0);
                                  }}
                                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-[var(--aifix-navy)] hover:bg-gray-50"
                                >
                                  <TableProperties className="h-4 w-4 text-[#5B3BFA]" />
                                  RMI 스멜터 검색
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                        <tr>
                          <td className={PROFILE_TD_LABEL} style={{ width: '220px' }}>
                            {feocRow.label}
                          </td>
                          <td className={PROFILE_TD}>
                            <input
                              type="text"
                              value={basicForm.feoc_status}
                              onChange={(e) =>
                                setBasicForm((prev) => ({
                                  ...prev,
                                  feoc_status: e.target.value,
                                }))
                              }
                              placeholder={feocRow.placeholder}
                              className="w-full max-w-xl px-3 py-2 rounded-lg border border-gray-200 text-[var(--aifix-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--aifix-primary)]/30 focus:border-[var(--aifix-primary)]"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className={PROFILE_TABLE}>
                    <tbody>
                      {basicFieldRows.map((row) => (
                        <tr key={row.key}>
                          <td className={PROFILE_TD_LABEL} style={{ width: '220px' }}>
                            {row.label}
                          </td>
                          <td className={PROFILE_TD}>—</td>
                        </tr>
                      ))}
                      <tr>
                        <td className={PROFILE_TD_LABEL} style={{ width: '220px' }}>
                          공급자 유형
                        </td>
                        <td className={PROFILE_TD}>—</td>
                      </tr>
                      <tr>
                        <td className={PROFILE_TD_LABEL} style={{ width: '220px' }}>
                          RMI 인증 여부
                        </td>
                        <td className={PROFILE_TD}>—</td>
                      </tr>
                      <tr>
                        <td className={PROFILE_TD_LABEL} style={{ width: '220px' }}>
                          {feocRow.label}
                        </td>
                        <td className={PROFILE_TD}>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              {profileLoading ? (
                <div className="px-4 py-8 text-sm text-gray-500">프로필 불러오는 중…</div>
              ) : contacts.length === 0 ? (
                <div className="px-4 py-8 text-sm text-gray-500">
                  {profile?.has_profile
                    ? '등록된 담당자 행이 없습니다.'
                    : '승인된 프로필이 있으면 회원가입 시 입력한 담당자 정보가 표시됩니다.'}
                </div>
              ) : (
                <table className={PROFILE_TABLE}>
                  <thead>
                    <tr>
                      <th className={PROFILE_TH}>부서명</th>
                      <th className={PROFILE_TH}>직급</th>
                      <th className={PROFILE_TH}>이름</th>
                      <th className={PROFILE_TH}>이메일</th>
                      <th className={PROFILE_TH}>연락처</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c, index) => (
                      <tr key={`${c.email}-${c.name}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className={PROFILE_TD}>{c.department}</td>
                        <td className={PROFILE_TD}>{c.position}</td>
                        <td className={PROFILE_TD}>{c.name}</td>
                        <td className={PROFILE_TD}>{c.email}</td>
                        <td className={PROFILE_TD}>{c.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'sites' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 mb-6">
                <button
                  type="button"
                  disabled={!profile?.has_profile}
                  onClick={() => {
                    resetSiteForm();
                    setShowModal(true);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90 shrink-0 disabled:opacity-45 disabled:cursor-not-allowed"
                  style={{ background: 'var(--aifix-primary)' }}
                  title={!profile?.has_profile ? '승인된 프로필이 있어야 사업장을 추가할 수 있습니다.' : undefined}
                >
                  <Plus className="w-5 h-5" />
                  <span style={{ fontWeight: 600 }}>사업장 추가</span>
                </button>
              </div>
              {sitesError ? (
                <p className="text-sm text-red-600 mb-4" role="alert">
                  {sitesError}
                </p>
              ) : null}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                {sitesLoading ? (
                  <div className="px-4 py-8 text-sm text-gray-500">사업장 목록을 불러오는 중…</div>
                ) : (
                  <table className={PROFILE_TABLE}>
                    <thead>
                      <tr>
                        <th className={PROFILE_TH}>사업장 명</th>
                        <th className={PROFILE_TH}>사업자등록번호</th>
                        <th className={PROFILE_TH}>종사업장번호</th>
                        <th className={PROFILE_TH}>국가 소재지</th>
                        <th className={PROFILE_TH}>상세주소</th>
                        <th className={PROFILE_TH}>대표자명</th>
                        <th className={PROFILE_TH}>대표 이메일</th>
                        <th className={PROFILE_TH}>대표자 연락처</th>
                        <th className={PROFILE_TH}>RMI 인증 여부</th>
                        <th className={PROFILE_TH}>FEOC 여부</th>
                        <th className={PROFILE_TH}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!profile?.has_profile && sites.length === 0 ? (
                        <tr>
                          <td className={PROFILE_TD} colSpan={11}>
                            승인된 회사 프로필이 있으면 사업장을 DB에 저장할 수 있습니다.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {profile?.has_profile ? (
                            <tr
                              key="__company-hq__"
                              className="hover:bg-gray-50 transition-colors bg-slate-50/50"
                            >
                              <td className={PROFILE_TD}>
                                {(() => {
                                  const cn = (
                                    basicForm.company_name ||
                                    profile.company_name ||
                                    ""
                                  ).trim();
                                  return cn ? `${cn}(본사)` : "미기입(본사)";
                                })()}
                              </td>
                              <td className={PROFILE_TD}>
                                {displaySiteCell(companyRegistrationNumber)}
                              </td>
                              <td className={PROFILE_TD}>-</td>
                              <td className={PROFILE_TD}>
                                {displaySiteCell(
                                  (
                                    basicForm.country_location ||
                                    profile.country_location ||
                                    ""
                                  ).trim() ||
                                    deriveCountryFromAddress(
                                      (
                                        basicForm.address ||
                                        profile.address ||
                                        ""
                                      ).trim(),
                                    ),
                                )}
                              </td>
                              <td className={PROFILE_TD}>
                                {displaySiteCell(
                                  basicForm.address || profile.address || "",
                                )}
                              </td>
                              <td className={PROFILE_TD}>
                                {displaySiteCell(
                                  basicForm.rep_name || profile.rep_name || "",
                                )}
                              </td>
                              <td className={PROFILE_TD}>
                                {displaySiteCell(
                                  basicForm.rep_email || profile.rep_email || "",
                                )}
                              </td>
                              <td className={PROFILE_TD}>
                                {displaySiteCell(
                                  basicForm.rep_phone || profile.rep_phone || "",
                                )}
                              </td>
                              <td className={PROFILE_TD}>
                                {displayRmiForSiteTable(
                                  basicForm.supplier_type || profile.supplier_type || "",
                                  basicForm.rmi_certified || profile.rmi_certified || "",
                                )}
                              </td>
                              <td className={PROFILE_TD}>
                                {displaySiteCell(
                                  basicForm.feoc_status || profile.feoc_status || "",
                                )}
                              </td>
                              <td className={PROFILE_TD}>
                                <span
                                  className="text-xs text-gray-500"
                                  title="기업 기본정보 탭에서 수정합니다."
                                >
                                  기본정보 연동
                                </span>
                              </td>
                            </tr>
                          ) : null}
                          {sites.map((site) => (
                            <tr
                              key={site.serverId ?? site.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className={PROFILE_TD}>{displaySiteCell(site.name)}</td>
                              <td className={PROFILE_TD}>
                                {displaySiteCell(
                                  site.businessRegNo.trim() || companyRegistrationNumber,
                                )}
                              </td>
                              <td className={PROFILE_TD}>
                                {displaySiteCell(site.branchWorkplaceNo)}
                              </td>
                              <td className={PROFILE_TD}>{displaySiteCell(site.country)}</td>
                              <td className={PROFILE_TD}>{displaySiteCell(site.address)}</td>
                              <td className={PROFILE_TD}>
                                {displaySiteCell(site.representative)}
                              </td>
                              <td className={PROFILE_TD}>{displaySiteCell(site.email)}</td>
                              <td className={PROFILE_TD}>{displaySiteCell(site.phone)}</td>
                              <td className={PROFILE_TD}>
                                {displayRmiForSiteTable(
                                  basicForm.supplier_type,
                                  site.rmiSmelter,
                                )}
                              </td>
                              <td className={PROFILE_TD}>{displaySiteCell(site.feoc)}</td>
                              <td className={PROFILE_TD}>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={site.serverId == null || !profile?.has_profile}
                                    onClick={() => openEditSite(site)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-40"
                                    aria-label="수정"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    수정
                                  </button>
                                  <button
                                    type="button"
                                    disabled={site.serverId == null || !profile?.has_profile}
                                    onClick={() => void handleDeleteSite(site)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 text-red-700 text-sm hover:bg-red-50 disabled:opacity-40"
                                    aria-label="삭제"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    삭제
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowModal(false);
            resetSiteForm();
          }}
        >
          <div
            className="bg-white rounded-[20px] p-8 max-w-[800px] w-full max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                {editingServerId != null ? '사업장 수정' : '사업장 등록'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetSiteForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" style={{ color: 'var(--aifix-gray)' }} />
              </button>
            </div>

            <p className="mb-6" style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              사업장은 회사 전역에서 관리되며 프로젝트 데이터 입력 시 선택하여 사용할 수 있습니다.
            </p>

            <div
              className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}
            >
              <input
                type="checkbox"
                checked={isSameAsHeadquarter}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsSameAsHeadquarter(checked);
                  if (checked) {
                    fillSiteFromCompanyBasic();
                  } else {
                    resetSiteForm();
                  }
                }}
                style={{ accentColor: 'var(--aifix-primary)', marginTop: '2px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--aifix-navy)', marginBottom: '4px' }}>
                  사업장이 헤드쿼터(본사)와 동일합니까?
                </div>
                <div style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                  체크하면 아래 사업장 정보가 기업 기본정보에서 자동으로 채워집니다. 해제하면 직접 입력하세요.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  종사업장번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSite.branchWorkplaceNo}
                  onChange={(e) => setNewSite({ ...newSite, branchWorkplaceNo: e.target.value })}
                  placeholder="예: FAC-HQ"
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--aifix-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  사업자등록번호 (사업장 단위)
                </label>
                <input
                  type="text"
                  value={newSite.businessRegNo}
                  onChange={(e) => setNewSite({ ...newSite, businessRegNo: e.target.value })}
                  placeholder="비우면 법인 기본 사업자번호와 별도인 경우만 입력"
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--aifix-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  사업장 명 *
                </label>
                <input
                  type="text"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--aifix-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  국가 소재지
                </label>
                <input
                  type="text"
                  value={newSite.country}
                  onChange={(e) => setNewSite({ ...newSite, country: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--aifix-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  상세주소
                </label>
                <input
                  type="text"
                  value={newSite.address}
                  onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--aifix-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  대표자 명
                </label>
                <input
                  type="text"
                  value={newSite.representative}
                  onChange={(e) => setNewSite({ ...newSite, representative: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--aifix-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  대표 이메일
                </label>
                <input
                  type="email"
                  value={newSite.email}
                  onChange={(e) => setNewSite({ ...newSite, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--aifix-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  대표자 연락처
                </label>
                <input
                  type="tel"
                  value={newSite.phone}
                  onChange={(e) => setNewSite({ ...newSite, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--aifix-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  RMI 인증 여부
                </label>
                <select
                  value={newSite.rmiSmelter}
                  onChange={(e) => setNewSite({ ...newSite, rmiSmelter: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--aifix-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                >
                  <option value="">선택하세요</option>
                  <option value="인증됨">인증됨</option>
                  <option value="미인증">미인증</option>
                  <option value="진행중">진행중</option>
                </select>
              </div>

              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  FEOC 여부
                </label>
                <select
                  value={newSite.feoc}
                  onChange={(e) => setNewSite({ ...newSite, feoc: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--aifix-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                >
                  <option value="">선택하세요</option>
                  <option value="해당">해당</option>
                  <option value="미해당">미해당</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
                style={{ borderColor: 'var(--aifix-gray)', color: 'var(--aifix-navy)', fontWeight: 600 }}
              >
                취소
              </button>
              <button
                type="button"
                disabled={siteSaving}
                onClick={() => void handleSaveSite()}
                className="px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--aifix-primary)', fontWeight: 600 }}
              >
                {siteSaving ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showRmiPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowRmiPicker(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-lg font-bold text-[var(--aifix-navy)]">RMI 스멜터 검색</h3>
              <button
                type="button"
                onClick={() => setShowRmiPicker(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 px-5 py-3">
              <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-xs text-gray-600">
                검색어 (smelter_id/명칭/국가/도시)
                <input
                  value={rmiQuery}
                  onChange={(e) => setRmiQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSearchRmi(0);
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="예: CID002030, Perth Mint"
                />
              </label>
              <label className="flex min-w-[10rem] flex-col gap-1 text-xs text-gray-600">
                타입
                <select
                  value={rmiReportType}
                  onChange={(e) => setRmiReportType(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">전체</option>
                  <option value="CMRT">CMRT</option>
                  <option value="AMRT">AMRT</option>
                  <option value="EMRT">EMRT</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => void handleSearchRmi(0)}
                disabled={rmiLoading}
                className="rounded-lg bg-[var(--aifix-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {rmiLoading ? "조회 중..." : "검색"}
              </button>
            </div>
            <div className="px-5 py-3 text-sm text-gray-600">
              검색 결과: {rmiTotal}건
              <span className="ml-3 text-gray-500">
                ({rmiTotal === 0 ? 0 : rmiOffset + 1} - {Math.min(rmiOffset + rmiResults.length, rmiTotal)})
              </span>
            </div>
            <div className="max-h-[56vh] overflow-auto border-t border-gray-100">
              <table className={PROFILE_TABLE}>
                <thead>
                  <tr>
                    <th className={PROFILE_TH} style={{ width: "64px" }}>선택</th>
                    <th className={PROFILE_TH}>타입</th>
                    <th className={PROFILE_TH}>금속</th>
                    <th className={PROFILE_TH}>Smelter ID</th>
                    <th className={PROFILE_TH}>표준 스멜터명</th>
                    <th className={PROFILE_TH}>국가/도시</th>
                  </tr>
                </thead>
                <tbody>
                  {rmiResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                        {rmiLoading ? "조회 중..." : "검색 결과가 없습니다."}
                      </td>
                    </tr>
                  ) : (
                    rmiResults.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          setSelectedRmiId((prev) => (prev === row.id ? null : row.id))
                        }
                      >
                        <td className={PROFILE_TD}>
                          <input
                            type="checkbox"
                            checked={selectedRmiId === row.id}
                            onChange={(e) => setSelectedRmiId(e.target.checked ? row.id : null)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ accentColor: "var(--aifix-primary)" }}
                          />
                        </td>
                        <td className={PROFILE_TD}>{row.report_type}</td>
                        <td className={PROFILE_TD}>{row.metal}</td>
                        <td className={PROFILE_TD}>
                          <code>{row.smelter_id}</code>
                        </td>
                        <td className={PROFILE_TD}>
                          <div className="max-w-[24rem] truncate" title={row.standard_smelter_name}>
                            {row.standard_smelter_name}
                          </div>
                        </td>
                        <td className={PROFILE_TD}>
                          <div className="max-w-[14rem] truncate" title={`${row.country} / ${row.city}`}>
                            {row.country} / {row.city}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center border-t border-gray-100 px-5 py-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={rmiLoading || rmiCurrentPage <= 1}
                  onClick={() => void handleSearchRmi(0)}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  aria-label="첫 페이지"
                >
                  {"<<"}
                </button>
                <button
                  type="button"
                  disabled={rmiLoading || rmiCurrentPage <= 1}
                  onClick={() => void handleSearchRmi(Math.max(0, (rmiCurrentPage - 2) * RMI_PAGE_SIZE))}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  aria-label="이전 페이지"
                >
                  {"<"}
                </button>
                {Array.from({ length: rmiPageEnd - rmiPageStart + 1 }, (_, i) => rmiPageStart + i).map((p) => {
                  const active = p === rmiCurrentPage;
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={rmiLoading || p < 1 || p > rmiTotalPages}
                      onClick={() => void handleSearchRmi((p - 1) * RMI_PAGE_SIZE)}
                      className={`min-w-8 rounded-lg border px-2.5 py-1.5 text-sm ${
                        active
                          ? "border-[var(--aifix-primary)] bg-[var(--aifix-primary)] text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      } disabled:opacity-50`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={rmiLoading || rmiCurrentPage >= rmiTotalPages}
                  onClick={() => void handleSearchRmi(rmiCurrentPage * RMI_PAGE_SIZE)}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  aria-label="다음 페이지"
                >
                  {">"}
                </button>
                <button
                  type="button"
                  disabled={rmiLoading || rmiCurrentPage >= rmiTotalPages}
                  onClick={() => void handleSearchRmi((rmiTotalPages - 1) * RMI_PAGE_SIZE)}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  aria-label="마지막 페이지"
                >
                  {">>"}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowRmiPicker(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={selectedRmiId == null}
                onClick={() => {
                  const row = rmiResults.find((x) => x.id === selectedRmiId);
                  if (!row) return;
                  setBasicForm((prev) => ({ ...prev, rmi_certified: row.smelter_id }));
                  setShowRmiPicker(false);
                  toast.success(`RMI 선택: ${row.smelter_id}`);
                }}
                className="rounded-lg bg-[var(--aifix-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

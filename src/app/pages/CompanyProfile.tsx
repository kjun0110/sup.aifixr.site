'use client';

import { Plus, X } from "lucide-react";
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
import { useSites } from "../contexts/SiteContext";
import type { Site } from "../contexts/SiteContext";

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

/** 회사 프로필·백엔드 `supplier_type`에 저장되는 공급자 유형 (4택1) */
const SUPPLIER_TYPE_SMELTER = '가공사/제련사' as const;

const SUPPLIER_TYPE_OPTIONS: { value: string; title: string; hint: string }[] = [
  {
    value: '제조사',
    title: '제조사',
    hint: '원료·부품을 가공·조립해 제품을 만드는 사업자 (예: 양극재 제조, 셀 조립)',
  },
  {
    value: SUPPLIER_TYPE_SMELTER,
    title: '가공사/제련사',
    hint: '광물을 제련·정제하거나 전구체 등을 가공하는 사업자 (예: 리튬 제련, 전구체 가공)',
  },
  {
    value: '유통/물류',
    title: '유통/물류',
    hint: '직접 생산 없이 유통·물류만 담당하는 사업자 (예: 화학 유통, 물류센터)',
  },
  {
    value: '채굴사',
    title: '채굴사',
    hint: '천연자원을 직접 채굴하는 사업자 (예: 리튬·니켈 광산)',
  },
];

function isSmelterSupplierType(supplierType: string): boolean {
  return supplierType.trim() === SUPPLIER_TYPE_SMELTER;
}

function isKnownSupplierType(supplierType: string): boolean {
  const t = supplierType.trim();
  return SUPPLIER_TYPE_OPTIONS.some((o) => o.value === t);
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

function profileToBasicForm(p: SupplierProfileMe): BasicFormState {
  return {
    company_name: p.company_name ?? '',
    business_reg_no: p.business_reg_no ?? '',
    country_location: p.country_location ?? '',
    address: (p.address ?? '').trim(),
    duns_number: p.duns_number ?? '',
    tax_id: p.tax_id ?? '',
    website_url: p.website_url ?? '',
    rep_name: (p.rep_name ?? '').trim(),
    rep_email: p.rep_email ?? '',
    rep_phone: p.rep_phone ?? '',
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
  const { sites, addSite } = useSites();
  const [activeTab, setActiveTab] = useState<ProfileTab>('basic');
  const [profile, setProfile] = useState<SupplierProfileMe | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [basicForm, setBasicForm] = useState<BasicFormState>(EMPTY_BASIC_FORM);
  const [basicSaving, setBasicSaving] = useState(false);

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
  const [isSameAsHeadquarter, setIsSameAsHeadquarter] = useState(false);
  const [newSite, setNewSite] = useState<Site>({
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

  const resetSiteForm = () => {
    setIsSameAsHeadquarter(false);
    setNewSite({
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
  };

  const companyRegistrationNumber =
    basicForm.business_reg_no.trim() || (profile?.business_reg_no ?? "").trim() || "";

  const fillSiteFromCompanyBasic = () => {
    if (!profile?.has_profile) return;
    setNewSite((prev) => {
      const addr = (basicForm.address || profile.address || '').trim();
      const loc = (basicForm.country_location || profile.country_location || '').trim();
      const countryVal = loc || deriveCountryFromAddress(addr);
      return {
        ...prev,
        id: basicForm.business_reg_no.trim() || prev.id,
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

  const handleAddSite = () => {
    if (!newSite.id || !newSite.name) {
      alert('사업장번호와 사업장명은 필수 입력입니다.');
      return;
    }
    addSite(newSite);
    resetSiteForm();
    setShowModal(false);
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
                                    v === SUPPLIER_TYPE_SMELTER
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
                              제조사 · 가공사/제련사 · 유통/물류 · 채굴사 중 해당 유형을 선택하세요.
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
                                가공사/제련사인 경우에만 입력합니다.
                              </p>
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
                                className="w-full max-w-xl px-3 py-2 rounded-lg border border-gray-200 text-[var(--aifix-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--aifix-primary)]/30 focus:border-[var(--aifix-primary)]"
                              />
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
                  onClick={() => {
                    resetSiteForm();
                    setShowModal(true);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90 shrink-0"
                  style={{ background: 'var(--aifix-primary)' }}
                >
                  <Plus className="w-5 h-5" />
                  <span style={{ fontWeight: 600 }}>사업장 추가</span>
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className={PROFILE_TABLE}>
                  <thead>
                    <tr>
                      <th className={PROFILE_TH}>사업장 명</th>
                      <th className={PROFILE_TH}>사업자등록번호</th>
                      <th className={PROFILE_TH}>종사업장번호</th>
                      <th className={PROFILE_TH}>사업장번호</th>
                      <th className={PROFILE_TH}>국가 소재지</th>
                      <th className={PROFILE_TH}>상세주소</th>
                      <th className={PROFILE_TH}>대표자명</th>
                      <th className={PROFILE_TH}>대표 이메일</th>
                      <th className={PROFILE_TH}>대표자 연락처</th>
                      <th className={PROFILE_TH}>RMI 인증 여부</th>
                      <th className={PROFILE_TH}>FEOC 여부</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sites.map((site, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className={PROFILE_TD}>{site.name}</td>
                        <td className={PROFILE_TD}>{companyRegistrationNumber}</td>
                        <td className={PROFILE_TD}>{site.id}</td>
                        <td className={PROFILE_TD}>{site.id}</td>
                        <td className={PROFILE_TD}>{site.country}</td>
                        <td className={PROFILE_TD}>{site.address}</td>
                        <td className={PROFILE_TD}>{site.representative}</td>
                        <td className={PROFILE_TD}>{site.email}</td>
                        <td className={PROFILE_TD}>{site.phone}</td>
                        <td className={PROFILE_TD}>{site.rmiSmelter}</td>
                        <td className={PROFILE_TD}>{site.feoc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                사업장 등록
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
                  사업장번호 *
                </label>
                <input
                  type="text"
                  value={newSite.id}
                  onChange={(e) => setNewSite({ ...newSite, id: e.target.value })}
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
                onClick={handleAddSite}
                className="px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
                style={{ background: 'var(--aifix-primary)', fontWeight: 600 }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

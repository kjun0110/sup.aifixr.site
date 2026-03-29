'use client';

import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { restoreSupSessionFromCookie } from "@/lib/api/client";
import { getMySupplierProfile, type SupplierProfileMe } from "@/lib/api/supplierProfile";
import { useSites } from "../contexts/SiteContext";
import type { Site } from "../contexts/SiteContext";

type ProfileTab = 'basic' | 'contacts' | 'sites';

/** 탭 전환 시 표 위에 표시하는 안내 (선택한 영역의 역할을 바로 이해하도록) */
const TAB_DESCRIPTIONS: Record<ProfileTab, string> = {
  basic:
    '기본정보 수정은 원청사 담당자(aaa@aaa.com)에게 문의 바랍니다.',
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

function dash(s: string | null | undefined): string {
  const t = (s ?? "").trim();
  return t.length > 0 ? t : "—";
}

type BasicRow = { label: string; required?: boolean; value: string; isLink?: boolean };

type ContactRow = {
  department: string;
  position: string;
  name: string;
  email: string;
  phone: string;
};

export function CompanyProfile() {
  const { sites, addSite } = useSites();
  const [activeTab, setActiveTab] = useState<ProfileTab>('basic');
  const [profile, setProfile] = useState<SupplierProfileMe | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        await restoreSupSessionFromCookie();
        const data = await getMySupplierProfile();
        if (!cancelled) setProfile(data);
      } catch (e) {
        if (!cancelled) {
          setProfile(null);
          setProfileError(e instanceof Error ? e.message : "프로필을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const basicRows: BasicRow[] = useMemo(() => {
    const p = profile;
    if (!p?.has_profile) {
      const empty = "—";
      return [
        { label: "회사명", required: true, value: empty },
        { label: "사업자등록번호", required: true, value: empty },
        { label: "국가 소재지", value: empty },
        { label: "상세주소", value: empty },
        { label: "DUNS Number", value: empty },
        { label: "텍스 ID", value: empty },
        { label: "공식 홈페이지 주소", value: empty },
        { label: "대표자명", required: true, value: empty },
        { label: "대표 이메일", value: empty },
        { label: "대표 연락처", value: empty },
        { label: "공급자 유형", value: empty },
        { label: "RMI 인증 여부", value: empty },
        { label: "FEOC 여부", value: empty },
      ];
    }
    return [
      { label: "회사명", required: true, value: dash(p.company_name) },
      { label: "사업자등록번호", required: true, value: dash(p.business_reg_no) },
      { label: "국가 소재지", value: "—" },
      { label: "상세주소", value: dash(p.address) },
      { label: "DUNS Number", value: "—" },
      { label: "텍스 ID", value: "—" },
      { label: "공식 홈페이지 주소", value: "—" },
      { label: "대표자명", required: true, value: dash(p.rep_name) },
      { label: "대표 이메일", value: "—" },
      { label: "대표 연락처", value: "—" },
      { label: "공급자 유형", value: "—" },
      { label: "RMI 인증 여부", value: "—" },
      { label: "FEOC 여부", value: "—" },
    ];
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
    profile?.has_profile && profile.business_reg_no.trim()
      ? profile.business_reg_no.trim()
      : "";

  const labelValue = (label: string) =>
    basicRows.find((r) => r.label === label)?.value ?? "—";

  const fillSiteFromCompanyBasic = () => {
    if (!profile?.has_profile) return;
    setNewSite((prev) => ({
      ...prev,
      id: profile.business_reg_no?.trim() || prev.id,
      name: profile.company_name?.trim() || prev.name,
      country: "",
      address: (profile.address ?? "").trim() || prev.address,
      representative: (profile.rep_name ?? "").trim() || prev.representative,
      email: (profile.email ?? "").trim() || prev.email,
      phone: (profile.contact ?? "").trim() || prev.phone,
      rmiSmelter: labelValue("RMI 인증 여부"),
      feoc: labelValue("FEOC 여부"),
    }));
  };

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
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              {profileLoading ? (
                <div className="px-4 py-8 text-sm text-gray-500">프로필 불러오는 중…</div>
              ) : (
                <table className={PROFILE_TABLE}>
                  <tbody>
                    {basicRows.map((row) => (
                      <tr key={row.label}>
                        <td className={PROFILE_TD_LABEL} style={{ width: '220px' }}>
                          {row.label}
                        </td>
                        <td className={PROFILE_TD}>
                          {row.label === '공식 홈페이지 주소' &&
                          row.value !== '—' &&
                          row.value.startsWith('http') ? (
                            <a
                              href={row.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--aifix-primary)', textDecoration: 'underline' }}
                            >
                              {row.value}
                            </a>
                          ) : (
                            row.value
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  onClick={() => setShowModal(true)}
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
                  신재생 에너지 사용 여부
                </label>
                <select
                  value={newSite.renewableEnergy}
                  onChange={(e) => setNewSite({ ...newSite, renewableEnergy: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--aifix-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                >
                  <option value="">선택하세요</option>
                  <option value="사용">사용</option>
                  <option value="미사용">미사용</option>
                </select>
              </div>

              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  환경 인증
                </label>
                <input
                  type="text"
                  value={newSite.certification}
                  onChange={(e) => setNewSite({ ...newSite, certification: e.target.value })}
                  placeholder="예: ISO 14001, ISO 9001"
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

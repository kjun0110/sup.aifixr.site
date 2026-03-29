'use client';

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import { useSites } from "../contexts/SiteContext";
import type { Site } from "../contexts/SiteContext";

interface FacilityFormProps {
  supplierId: string;
  supplier: any;
  /** 상위 탭의 「행추가」에서 증가시키면 사업장 추가 모달을 엽니다. */
  openAddFacilityRequest?: number;
}

export function FacilitiesTab({ supplierId, supplier, openAddFacilityRequest = 0 }: FacilityFormProps) {
  const { sites, addSite } = useSites();
  const [projectSites, setProjectSites] = useState<Site[]>(supplier.facilities || []);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showNewSiteForm, setShowNewSiteForm] = useState(false);
  const [showSelectSiteModal, setShowSelectSiteModal] = useState(false);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
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

  const handleAddExistingSite = (site: Site) => {
    // 이미 추가된 사업장인지 확인(중복은 조용히 스킵)
    setProjectSites((prev) => {
      if (prev.some((s) => s.id === site.id)) return prev;
      return [...prev, site];
    });
  };

  const toggleSelectedSite = (siteId: string) => {
    setSelectedSiteIds((prev) => {
      if (prev.includes(siteId)) return prev.filter((id) => id !== siteId);
      return [...prev, siteId];
    });
  };

  const handleConfirmAddSelectedSites = () => {
    if (selectedSiteIds.length === 0) {
      alert('선택된 사업장이 없습니다.');
      return;
    }

    const selectedSites = sites.filter((s) => selectedSiteIds.includes(s.id));
    selectedSites.forEach(handleAddExistingSite);

    setSelectedSiteIds([]);
    setShowSelectSiteModal(false);
    setShowMethodModal(false);
  };

  const handleAddNewSite = () => {
    if (!newSite.id || !newSite.name) {
      alert('사업장번호와 사업장명은 필수 입력입니다.');
      return;
    }
    
    // 전역 Master에 추가
    addSite(newSite);
    
    // 프로젝트 사업장 리스트에도 추가
    setProjectSites((prev) => [...prev, newSite]);
    
    // 폼 초기화
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
    setShowNewSiteForm(false);
    setShowMethodModal(false);
  };

  const handleLoadCompanyInfo = () => {
    setNewSite((prev) => ({
      ...prev,
      id: supplier.companyInfo.registrationNumber,
      name: supplier.name,
      country: supplier.country,
      address: supplier.location,
      representative: supplier.companyInfo.representative,
      email: supplier.companyInfo.email,
      phone: supplier.companyInfo.phone,
      rmiSmelter: supplier.companyInfo.rmiSmelter,
      feoc: supplier.companyInfo.feoc,
    }));
  };

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

  const handleMethodSelect = (method: 'select' | 'new') => {
    if (method === 'select') {
      setShowSelectSiteModal(true);
    } else {
      setShowNewSiteForm(true);
    }
  };

  useEffect(() => {
    if (supplierId === 'own' && openAddFacilityRequest > 0) {
      // 사업장 추가하기 버튼 클릭 시, 바로 체크박스 선택 모달을 엽니다.
      setShowMethodModal(false);
      setShowNewSiteForm(false);
      setSelectedSiteIds([]);
      setShowSelectSiteModal(true);
    }
  }, [openAddFacilityRequest, supplierId]);

  return (
    <div className="space-y-6">
      {/* Facilities Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-[#F8F9FA] py-4 px-4 text-left align-middle text-sm font-semibold text-[var(--aifix-navy)]">
                사업장 명
              </th>
              <th className="border border-gray-300 bg-[#F8F9FA] py-4 px-4 text-left align-middle text-sm font-semibold text-[var(--aifix-navy)]">
                사업자등록번호
              </th>
              <th className="border border-gray-300 bg-[#F8F9FA] py-4 px-4 text-left align-middle text-sm font-semibold text-[var(--aifix-navy)]">
                종사업장번호
              </th>
              <th className="border border-gray-300 bg-[#F8F9FA] py-4 px-4 text-left align-middle text-sm font-semibold text-[var(--aifix-navy)]">
                국가 소재지
              </th>
              <th className="border border-gray-300 bg-[#F8F9FA] py-4 px-4 text-left align-middle text-sm font-semibold text-[var(--aifix-navy)]">
                상세주소
              </th>
              <th
                className="border border-gray-300 bg-[#F8F9FA] py-4 px-4 text-left align-top text-sm font-semibold text-[var(--aifix-navy)]"
                style={{
                  maxWidth: '14rem',
                  width: '14rem',
                }}
              >
                대표자명
              </th>
              <th className="border border-gray-300 bg-[#F8F9FA] py-4 px-4 text-left align-middle text-sm font-semibold text-[var(--aifix-navy)]">
                대표 이메일
              </th>
              <th className="border border-gray-300 bg-[#F8F9FA] py-4 px-4 text-left align-middle text-sm font-semibold text-[var(--aifix-navy)]">
                대표자 연락처
              </th>
              <th className="border border-gray-300 bg-[#F8F9FA] py-4 px-4 text-left align-middle text-sm font-semibold text-[var(--aifix-navy)]">
                RMI 인증 여부
              </th>
              <th className="border border-gray-300 bg-[#F8F9FA] py-4 px-4 text-left align-middle text-sm font-semibold text-[var(--aifix-navy)]">
                FEOC 여부
              </th>
            </tr>
          </thead>
          <tbody>
            {projectSites.map((facility: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="border border-gray-300 py-4 px-4 align-top text-sm text-[var(--aifix-navy)]">
                  {facility.name}
                </td>
                <td className="border border-gray-300 py-4 px-4 align-top text-sm text-[var(--aifix-navy)]">
                  {supplier?.companyInfo?.registrationNumber ?? ''}
                </td>
                <td className="border border-gray-300 py-4 px-4 align-top text-sm text-[var(--aifix-navy)]">
                  {facility.id}
                </td>
                <td className="border border-gray-300 py-4 px-4 align-top text-sm text-[var(--aifix-navy)]">
                  {facility.country}
                </td>
                <td className="border border-gray-300 py-4 px-4 align-top text-sm text-[var(--aifix-navy)]">
                  {facility.address}
                </td>
                <td
                  className="border border-gray-300 py-4 px-4 align-top text-sm text-[var(--aifix-navy)]"
                  style={{
                    maxWidth: '14rem',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {facility.representative}
                </td>
                <td className="border border-gray-300 py-4 px-4 align-top text-sm text-[var(--aifix-navy)]">
                  {facility.email}
                </td>
                <td className="border border-gray-300 py-4 px-4 align-top text-sm text-[var(--aifix-navy)]">
                  {facility.phone}
                </td>
                <td className="border border-gray-300 py-4 px-4 align-top text-sm text-[var(--aifix-navy)]">
                  {facility.rmiSmelter}
                </td>
                <td className="border border-gray-300 py-4 px-4 align-top text-sm text-[var(--aifix-navy)]">
                  {facility.feoc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Method Selection Modal */}
      {showMethodModal && !showSelectSiteModal && !showNewSiteForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowMethodModal(false)}
        >
          <div 
            className="bg-white rounded-[20px] p-8 max-w-[500px] w-full"
            style={{ boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                사업장 추가 방식 선택
              </h3>
              <button
                onClick={() => setShowMethodModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" style={{ color: 'var(--aifix-gray)' }} />
              </button>
            </div>

            <p className="mb-6" style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              사업장을 추가하는 방법을 선택하세요.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => handleMethodSelect('select')}
                className="w-full p-6 rounded-xl border-2 text-left transition-all duration-200 hover:border-opacity-100"
                style={{ borderColor: 'var(--aifix-primary)',  }}
              >
                <div style={{ fontWeight: 600, color: 'var(--aifix-navy)', marginBottom: '8px', fontSize: '16px' }}>
                  기존 사업장 선택
                </div>
                <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                  회사 프로필에 등록된 사업장 중에서 선택합니다
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('new')}
                className="w-full p-6 rounded-xl border-2 text-left transition-all duration-200 hover:border-opacity-100"
                style={{ borderColor: 'var(--aifix-primary)',  }}
              >
                <div style={{ fontWeight: 600, color: 'var(--aifix-navy)', marginBottom: '8px', fontSize: '16px' }}>
                  새 사업장 등록
                </div>
                <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                  새로운 사업장을 등록합니다 (회사 프로필에도 자동 등록됩니다)
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Existing Site Modal */}
      {showSelectSiteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowSelectSiteModal(false);
            setShowMethodModal(false);
            setSelectedSiteIds([]);
          }}
        >
          <div 
            className="bg-white rounded-[20px] p-8 max-w-[900px] w-full max-h-[80vh] overflow-y-auto"
            style={{ boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                기존 사업장 선택
              </h3>
              <button
                onClick={() => {
                  setShowSelectSiteModal(false);
                  setShowMethodModal(false);
                  setSelectedSiteIds([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" style={{ color: 'var(--aifix-gray)' }} />
              </button>
            </div>

            <div className="space-y-3">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:border-opacity-100"
                  style={{ borderColor: 'var(--aifix-primary)',  }}
                  onClick={() => toggleSelectedSite(site.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSiteIds.includes(site.id)}
                      readOnly
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectedSite(site.id);
                      }}
                      style={{ accentColor: 'var(--aifix-primary)' }}
                    />

                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>사업장번호</div>
                        <div style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>{site.id}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>사업장 명</div>
                        <div style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>{site.name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>국가 소재지</div>
                        <div style={{ color: 'var(--aifix-navy)' }}>{site.country}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>상세주소</div>
                        <div style={{ color: 'var(--aifix-navy)' }}>{site.address}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowSelectSiteModal(false);
                  setShowMethodModal(false);
                  setSelectedSiteIds([]);
                }}
                className="px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
                style={{ borderColor: 'var(--aifix-gray)', color: 'var(--aifix-navy)', fontWeight: 600 }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowSelectSiteModal(false);
                  setShowMethodModal(false);
                  setSelectedSiteIds([]);
                  setShowNewSiteForm(true);
                }}
                className="px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
                style={{ borderColor: 'var(--aifix-gray)', color: 'var(--aifix-primary)', fontWeight: 600 }}
              >
                새 사업장 등록
              </button>
              <button
                onClick={handleConfirmAddSelectedSites}
                className="px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
                style={{ background: 'var(--aifix-primary)', fontWeight: 600 }}
              >
                선택 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Site Form Modal */}
      {showNewSiteForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowNewSiteForm(false);
            setShowMethodModal(false);
            resetSiteForm();
          }}
        >
          <div 
            className="bg-white rounded-[20px] p-8 max-w-[800px] w-full max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                새 사업장 등록
              </h3>
              <button
                onClick={() => {
                  setShowNewSiteForm(false);
                  setShowMethodModal(false);
                  resetSiteForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" style={{ color: 'var(--aifix-gray)' }} />
              </button>
            </div>

            <div 
              className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}
            >
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#0284C7' }} />
              <div style={{ fontSize: '14px', color: '#0284C7' }}>
                새로 등록하는 사업장은 회사 프로필 사업장 정보에 자동 추가됩니다.
              </div>
            </div>

            {/* HQ Same Checkbox */}
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
                    handleLoadCompanyInfo();
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
              {/* 사업장번호 */}
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
                  onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* 사업장 명 */}
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
                  onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* 국가 소재지 */}
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
                  onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* 상세주소 */}
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
                  onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* 대표자 명 */}
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
                  onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* 대표 이메일 */}
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
                  onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* 대표자 연락처 */}
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
                  onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* 신재생 에너지 사용 여부 */}
              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  신재생 에너지 사용 여부
                </label>
                <select
                  value={newSite.renewableEnergy}
                  onChange={(e) => setNewSite({ ...newSite, renewableEnergy: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                >
                  <option value="">선택하세요</option>
                  <option value="사용">사용</option>
                  <option value="미사용">미사용</option>
                </select>
              </div>

              {/* 환경 인증 */}
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
                  onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* RMI 인증 여부 */}
              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  RMI 인증 여부
                </label>
                <select
                  value={newSite.rmiSmelter}
                  onChange={(e) => setNewSite({ ...newSite, rmiSmelter: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                >
                  <option value="">선택하세요</option>
                  <option value="해당">해당</option>
                  <option value="미해당">미해당</option>
                </select>
              </div>

              {/* FEOC 여부 */}
              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  FEOC 여부
                </label>
                <select
                  value={newSite.feoc}
                  onChange={(e) => setNewSite({ ...newSite, feoc: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E2E8F0', color: 'var(--aifix-navy)' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                >
                  <option value="">선택하세요</option>
                  <option value="해당">해당</option>
                  <option value="미해당">미해당</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowNewSiteForm(false);
                  setShowMethodModal(false);
                }}
                className="px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
                style={{ borderColor: 'var(--aifix-gray)', color: 'var(--aifix-navy)', fontWeight: 600 }}
              >
                취소
              </button>
              <button
                onClick={handleAddNewSite}
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

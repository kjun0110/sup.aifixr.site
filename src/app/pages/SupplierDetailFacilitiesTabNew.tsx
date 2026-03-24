'use client';

import { useState } from "react";
import { Info, Plus, X } from "lucide-react";
import { useSites } from "../contexts/SiteContext";
import type { Site } from "../contexts/SiteContext";

interface FacilityFormProps {
  supplierId: string;
  supplier: any;
}

export function FacilitiesTab({ supplierId, supplier }: FacilityFormProps) {
  const { sites, addSite } = useSites();
  const [projectSites, setProjectSites] = useState<Site[]>(supplier.facilities || []);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showNewSiteForm, setShowNewSiteForm] = useState(false);
  const [showSelectSiteModal, setShowSelectSiteModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'select' | 'new' | null>(null);
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
    // 이미 추가된 사업장인지 확인
    if (projectSites.find(s => s.id === site.id)) {
      alert('이미 추가된 사업장입니다.');
      return;
    }
    setProjectSites([...projectSites, site]);
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
    setProjectSites([...projectSites, newSite]);
    
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
    setNewSite({
      ...newSite,
      id: supplier.companyInfo.registrationNumber,
      name: supplier.name,
      country: supplier.country,
      address: supplier.location,
      representative: supplier.companyInfo.representative,
      email: supplier.companyInfo.email,
      phone: supplier.companyInfo.phone,
      rmiSmelter: supplier.companyInfo.rmiSmelter,
      feoc: supplier.companyInfo.feoc,
    });
  };

  const handleMethodSelect = (method: 'select' | 'new') => {
    setSelectedMethod(method);
    if (method === 'select') {
      setShowSelectSiteModal(true);
    } else {
      setShowNewSiteForm(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Message */}
      <div 
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}
      >
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#0284C7' }} />
        <div>
          <div style={{ fontWeight: 600, color: '#0369A1', marginBottom: '4px' }}>
            사업장 정보 안내
          </div>
          <div style={{ fontSize: '14px', color: '#0284C7' }}>
            사업장은 회사 전역에서 관리됩니다. 프로젝트에서는 기존 사업장을 선택하거나 새 사업장을 등록할 수 있습니다.
          </div>
        </div>
      </div>

      {/* Add Facility Button */}
      {supplierId === 'own' && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowMethodModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
            style={{ background: 'var(--aifix-primary)' }}
          >
            <Plus className="w-5 h-5" />
            <span style={{ fontWeight: 600 }}>사업장 추가</span>
          </button>
        </div>
      )}

      {/* Facilities Table */}
      <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                  사업장번호
                </th>
                <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                  사업장 명
                </th>
                <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                  국가 소재지
                </th>
                <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                  상세주소
                </th>
                <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                  대표자 명
                </th>
                <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                  대표 이메일
                </th>
                <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                  대표자 연락처
                </th>
                <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                  신재생 에너지 사용
                </th>
                <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                  환경 인증
                </th>
                <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                  RMI Smelter 여부
                </th>
                <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                  FEOC 여부
                </th>
              </tr>
            </thead>
            <tbody>
              {projectSites.map((facility: any, index: number) => (
                <tr key={index} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {facility.id}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {facility.name}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {facility.country}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {facility.address}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {facility.representative}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {facility.email}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {facility.phone}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {facility.renewableEnergy}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {facility.certification}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {facility.rmiSmelter}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {facility.feoc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                  onClick={() => handleAddExistingSite(site)}
                >
                  <div className="grid grid-cols-2 gap-4">
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
              ))}
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
                새로 등록하는 사업장은 프로젝트 리스트와 회사 프로필 사업장 Master에 모두 추가됩니다.
              </div>
            </div>

            {/* Load Company Info Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={handleLoadCompanyInfo}
                className="px-4 py-2 rounded-lg border transition-all duration-200 hover:bg-gray-50"
                style={{ borderColor: 'var(--aifix-primary)', color: 'var(--aifix-primary)', fontWeight: 500 }}
              >
                기업 기본정보 불러오기
              </button>
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

              {/* RMI Smelter 여부 */}
              <div>
                <label className="block mb-2" style={{ fontWeight: 500, color: 'var(--aifix-gray)' }}>
                  RMI Smelter 여부
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
                  <option value="인증됨">인증됨</option>
                  <option value="미인증">미인증</option>
                  <option value="진행중">진행중</option>
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
                  <option value="인증됨">인증됨</option>
                  <option value="미인증">미인증</option>
                  <option value="진행중">진행중</option>
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

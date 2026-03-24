'use client';

import { Building2, Mail, Phone, MapPin, FileText, AlertCircle, Plus, X } from "lucide-react";
import { useState } from "react";
import { useSites } from "../contexts/SiteContext";
import type { Site } from "../contexts/SiteContext";

export function CompanyProfile() {
  const { sites, addSite } = useSites();
  const [showModal, setShowModal] = useState(false);
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

  const handleAddSite = () => {
    if (!newSite.id || !newSite.name) {
      alert('사업장번호와 사업장명은 필수 입력입니다.');
      return;
    }
    addSite(newSite);
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
    setShowModal(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-5xl mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          회사 프로필
        </h1>
        <p className="text-lg" style={{ color: 'var(--aifix-gray)' }}>
          협력사 정보를 관리하고 프로필을 업데이트합니다
        </p>
      </div>

      {/* Company Info Card */}
      <div className="bg-white rounded-[20px] p-8 mb-6" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
        <div className="flex items-center gap-4 mb-8">
          <div 
            className="w-20 h-20 rounded-[16px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)' }}
          >
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl mb-1" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              우리회사
            </h2>
            <p style={{ color: 'var(--aifix-gray)' }}>사업자등록번호: KR-9876543210</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 mt-1" style={{ color: 'var(--aifix-gray)' }} />
            <div>
              <div style={{ fontSize: '14px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>이메일</div>
              <div style={{ fontWeight: 500, color: 'var(--aifix-navy)' }}>ceo@ourcompany.co.kr</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 mt-1" style={{ color: 'var(--aifix-gray)' }} />
            <div>
              <div style={{ fontSize: '14px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>전화번호</div>
              <div style={{ fontWeight: 500, color: 'var(--aifix-navy)' }}>+82-2-1234-5678</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 mt-1" style={{ color: 'var(--aifix-gray)' }} />
            <div>
              <div style={{ fontSize: '14px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>주소</div>
              <div style={{ fontWeight: 500, color: 'var(--aifix-navy)' }}>Seoul, South Korea</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 mt-1" style={{ color: 'var(--aifix-gray)' }} />
            <div>
              <div style={{ fontSize: '14px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>업종</div>
              <div style={{ fontWeight: 500, color: 'var(--aifix-navy)' }}>배터리 소재 제조</div>
            </div>
          </div>
        </div>
      </div>

      {/* Site Management Section */}
      <div className="bg-white rounded-[20px] p-8 mb-6" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              사업장 관리 (Site Management)
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              사업장은 회사 전역에서 관리되며 프로젝트 데이터 입력 시 선택하여 사용할 수 있습니다.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
            style={{ background: 'var(--aifix-primary)' }}
          >
            <Plus className="w-5 h-5" />
            <span style={{ fontWeight: 600 }}>사업장 추가</span>
          </button>
        </div>

        {/* Sites Table */}
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
                  신재생 에너지 사용 여부
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
              {sites.map((site, index) => (
                <tr key={index} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {site.id}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {site.name}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {site.country}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {site.address}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {site.representative}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {site.email}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {site.phone}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {site.renewableEnergy}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {site.certification}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {site.rmiSmelter}
                  </td>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                    {site.feoc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note */}
      <div 
        className="p-6 rounded-[20px] border-2 border-dashed"
        style={{ borderColor: 'var(--aifix-primary)', backgroundColor: 'var(--aifix-secondary-light)' }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--aifix-primary)' }} />
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--aifix-navy)', marginBottom: '4px' }}>
              구조 설계 단계 안내
            </h4>
            <p style={{ color: 'var(--aifix-gray)', fontSize: '14px' }}>
              회사 프로필의 상세 편집 기능 및 추가 정보는 다음 단계에서 설계됩니다
            </p>
          </div>
        </div>
      </div>

      {/* Add Site Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-[20px] p-8 max-w-[800px] w-full max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                사업장 등록
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" style={{ color: 'var(--aifix-gray)' }} />
              </button>
            </div>

            <p className="mb-6" style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              사업장은 회사 전역에서 관리되며 프로젝트 데이터 입력 시 선택하여 사용할 수 있습니다.
            </p>

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
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
                style={{ borderColor: 'var(--aifix-gray)', color: 'var(--aifix-navy)', fontWeight: 600 }}
              >
                취소
              </button>
              <button
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

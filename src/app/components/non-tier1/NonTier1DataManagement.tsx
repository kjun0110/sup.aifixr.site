'use client';

import { useState } from "react";
import { 
  Save,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Building2,
  Search,
  Filter,
  MessageSquare,
  Send,
  Calendar,
  ChevronRight,
  Info
} from "lucide-react";

type SubTab = "my-data" | "downstream-reference";

type DownstreamData = {
  id: string;
  company: string;
  tier: string;
  product: string;
  status: "submitted" | "pending" | "requested";
  lastSubmitted: string;
  requestStatus: string;
};

type RequestModalType = "edit" | "supplement" | null;

export function NonTier1DataManagement({ tier }: { tier: "tier2" | "tier3" }) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("my-data");
  const [selectedDownstream, setSelectedDownstream] = useState<DownstreamData | null>(null);
  const [requestModal, setRequestModal] = useState<RequestModalType>(null);

  const tierName = tier === "tier2" ? "2차" : "3차";
  const hasDownstream = tier === "tier2";

  const downstreamData: DownstreamData[] = hasDownstream ? [
    {
      id: "1",
      company: "세진케미칼",
      tier: "3차",
      product: "화학 첨가제",
      status: "submitted",
      lastSubmitted: "2026-03-04",
      requestStatus: "-"
    },
    {
      id: "2",
      company: "그린에너지솔루션",
      tier: "3차",
      product: "친환경 용제",
      status: "pending",
      lastSubmitted: "-",
      requestStatus: "수정요청 중"
    },
    {
      id: "3",
      company: "한빛소재",
      tier: "3차",
      product: "기초 원료",
      status: "submitted",
      lastSubmitted: "2026-03-03",
      requestStatus: "-"
    },
    {
      id: "4",
      company: "대한정밀화학",
      tier: "3차",
      product: "특수 코팅제",
      status: "requested",
      lastSubmitted: "2026-03-01",
      requestStatus: "보완요청 중"
    },
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return { bg: "#E8F5E9", text: "#4CAF50" };
      case "pending": return { bg: "#FFF4E6", text: "#FF9800" };
      case "requested": return { bg: "#E3F2FD", text: "#2196F3" };
      default: return { bg: "#F5F5F5", text: "#757575" };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "submitted": return "제출 완료";
      case "pending": return "미제출";
      case "requested": return "보완 요청";
      default: return status;
    }
  };

  return (
    <div className="pt-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          데이터 관리
        </h2>
        <p style={{ color: 'var(--aifix-gray)' }}>
          자사 데이터를 입력하고 하위차사 제출 데이터를 확인합니다
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab("my-data")}
          className="px-6 py-3 transition-all border-b-2"
          style={{
            borderBottomColor: activeSubTab === "my-data" ? 'var(--aifix-primary)' : 'transparent',
            color: activeSubTab === "my-data" ? 'var(--aifix-primary)' : 'var(--aifix-gray)',
            fontWeight: activeSubTab === "my-data" ? 600 : 400,
            fontSize: '15px'
          }}
        >
          자사 데이터
        </button>
        <button
          onClick={() => setActiveSubTab("downstream-reference")}
          className="px-6 py-3 transition-all border-b-2"
          style={{
            borderBottomColor: activeSubTab === "downstream-reference" ? 'var(--aifix-primary)' : 'transparent',
            color: activeSubTab === "downstream-reference" ? 'var(--aifix-primary)' : 'var(--aifix-gray)',
            fontWeight: activeSubTab === "downstream-reference" ? 600 : 400,
            fontSize: '15px'
          }}
        >
          하위차사 참조
        </button>
      </div>

      {/* Content Area */}
      {activeSubTab === "my-data" ? (
        <MyDataTab tier={tierName} />
      ) : (
        <DownstreamReferenceTab 
          tier={tierName}
          hasDownstream={hasDownstream}
          data={downstreamData}
          selectedData={selectedDownstream}
          onSelectData={setSelectedDownstream}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
          onRequestClick={(type) => setRequestModal(type)}
        />
      )}

      {/* Request Modal */}
      {requestModal && selectedDownstream && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setRequestModal(null)}
        >
          <div 
            className="bg-white rounded-[20px] p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.2)" }}
          >
            <h3 className="text-xl mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              수정요청
            </h3>
            
            <div className="mb-4">
              <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                대상 업체
              </label>
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  {selectedDownstream.company}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                요청 메시지
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm"
                rows={5}
                placeholder="요청 사유를 입력하세요..."
                style={{ outline: 'none', resize: 'none' }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRequestModal(null)}
                className="flex-1 py-3 rounded-lg transition-all hover:scale-[1.02]"
                style={{
                  border: '2px solid var(--aifix-gray)',
                  color: 'var(--aifix-gray)',
                  fontWeight: 600
                }}
              >
                취소
              </button>
              <button
                onClick={() => setRequestModal(null)}
                className="flex-1 py-3 rounded-lg transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: 'var(--aifix-primary)',
                  color: 'white',
                  fontWeight: 600
                }}
              >
                수정요청 보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div 
        className="mt-8 p-6 rounded-[20px] flex items-start gap-4"
        style={{ backgroundColor: 'var(--aifix-secondary-light)', border: '2px solid var(--aifix-primary)' }}
      >
        <Info className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--aifix-primary)' }} />
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--aifix-navy)', marginBottom: '8px', fontSize: '16px' }}>
            데이터 관리 탭 안내
          </h4>
          <p style={{ color: 'var(--aifix-gray)', lineHeight: 1.6, fontSize: '14px' }}>
            이 화면에서는 <strong>데이터 입력 및 수정</strong>을 수행합니다. 
            {tierName} 협력사는 하위차사 데이터를 직접 수정할 수 없으며, 수정요청 또는 보완요청만 가능합니다. 
            계산 결과는 'PCF 산정' 탭에서 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

// My Data Tab Component
function MyDataTab({ tier }: { tier: string }) {
  const [sections, setSections] = useState([
    { id: "org", title: "기업/조직 정보", status: "saved", progress: 100 },
    { id: "product", title: "납품 제품 정보", status: "saved", progress: 100 },
    { id: "activity", title: "활동 데이터", status: "incomplete", progress: 75 },
    { id: "energy", title: "에너지 사용 데이터", status: "incomplete", progress: 60 },
    { id: "environment", title: "기타 환경 데이터", status: "validation-failed", progress: 40 },
  ]);

  const getSectionStatusBadge = (status: string) => {
    switch (status) {
      case "saved":
        return (
          <span 
            className="px-3 py-1 rounded-lg text-xs"
            style={{ backgroundColor: '#E8F5E9', color: '#4CAF50', fontWeight: 600 }}
          >
            <CheckCircle className="w-3 h-3 inline mr-1" />
            저장됨
          </span>
        );
      case "incomplete":
        return (
          <span 
            className="px-3 py-1 rounded-lg text-xs"
            style={{ backgroundColor: '#FFF4E6', color: '#FF9800', fontWeight: 600 }}
          >
            <Clock className="w-3 h-3 inline mr-1" />
            미완성
          </span>
        );
      case "validation-failed":
        return (
          <span 
            className="px-3 py-1 rounded-lg text-xs"
            style={{ backgroundColor: '#FFEBEE', color: '#F44336', fontWeight: 600 }}
          >
            <XCircle className="w-3 h-3 inline mr-1" />
            검증 실패
          </span>
        );
      case "needs-revision":
        return (
          <span 
            className="px-3 py-1 rounded-lg text-xs"
            style={{ backgroundColor: '#E3F2FD', color: '#2196F3', fontWeight: 600 }}
          >
            <AlertCircle className="w-3 h-3 inline mr-1" />
            수정 필요
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div 
          className="bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>입력 진행률</span>
            <FileText className="w-5 h-5" style={{ color: 'var(--aifix-primary)' }} />
          </div>
          <div className="text-4xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            75%
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full"
              style={{ 
                width: '75%',
                background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)'
              }}
            />
          </div>
        </div>

        <div 
          className="bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>검증 상태</span>
            <AlertCircle className="w-5 h-5" style={{ color: '#FF9800' }} />
          </div>
          <div className="text-4xl mb-2" style={{ fontWeight: 700, color: '#FF9800' }}>
            1건
          </div>
          <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
            검증 실패 항목
          </div>
        </div>

        <div 
          className="bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>마지막 저장</span>
            <Clock className="w-5 h-5" style={{ color: 'var(--aifix-secondary)' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--aifix-navy)', marginBottom: '4px' }}>
            2026-03-04
          </div>
          <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
            14:32
          </div>
        </div>
      </div>

      {/* Integrated Template Input Area */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div 
            key={section.id}
            className="bg-white rounded-[20px] p-6"
            style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                  {section.title}
                </h3>
                {getSectionStatusBadge(section.status)}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                진행률: <strong style={{ color: 'var(--aifix-primary)' }}>{section.progress}%</strong>
              </div>
            </div>

            {/* Input Form Placeholder */}
            <div 
              className="p-6 rounded-lg mb-6"
              style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    입력 항목 1
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    placeholder="값을 입력하세요"
                    style={{ outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    입력 항목 2
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    placeholder="값을 입력하세요"
                    style={{ outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    입력 항목 3
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    placeholder="값을 입력하세요"
                    style={{ outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    입력 항목 4
                  </label>
                  <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                    <option>선택하세요</option>
                    <option>옵션 1</option>
                    <option>옵션 2</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2.5 rounded-lg transition-all hover:scale-105"
                style={{
                  border: '1px solid var(--aifix-gray)',
                  color: 'var(--aifix-gray)',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                <Clock className="w-4 h-4 inline mr-1.5" />
                임시 저장
              </button>
              <button
                className="px-5 py-2.5 rounded-lg transition-all hover:scale-105"
                style={{
                  border: '2px solid var(--aifix-primary)',
                  color: 'var(--aifix-primary)',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                <CheckCircle className="w-4 h-4 inline mr-1.5" />
                검증 실행
              </button>
              <button
                className="px-5 py-2.5 rounded-lg transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--aifix-primary)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                <Save className="w-4 h-4 inline mr-1.5" />
                저장
              </button>
            </div>

            {/* Validation Message (for validation-failed status) */}
            {section.status === "validation-failed" && (
              <div 
                className="mt-4 p-3 rounded-lg"
                style={{ backgroundColor: '#FFEBEE', border: '1px solid #F44336' }}
              >
                <div className="flex gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#F44336' }} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#F44336', marginBottom: '4px' }}>
                      검증 실패
                    </p>
                    <p style={{ fontSize: '12px', color: '#F44336', lineHeight: 1.5 }}>
                      입력 항목 3의 값이 허용 범위를 벗어났습니다. 값을 확인하고 다시 입력해 주세요.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Downstream Reference Tab Component
function DownstreamReferenceTab({ 
  tier,
  hasDownstream,
  data, 
  selectedData, 
  onSelectData,
  getStatusColor,
  getStatusText,
  onRequestClick
}: { 
  tier: string;
  hasDownstream: boolean;
  data: DownstreamData[];
  selectedData: DownstreamData | null;
  onSelectData: (data: DownstreamData | null) => void;
  getStatusColor: (status: string) => { bg: string; text: string };
  getStatusText: (status: string) => string;
  onRequestClick: (type: "edit" | "supplement") => void;
}) {
  if (!hasDownstream) {
    return (
      <div 
        className="bg-white rounded-[20px] p-12 text-center"
        style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
      >
        <Building2 
          className="w-16 h-16 mx-auto mb-6" 
          style={{ color: 'var(--aifix-gray)', opacity: 0.5 }} 
        />
        <h3 className="text-xl mb-3" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          하위 공급망 없음
        </h3>
        <p style={{ color: 'var(--aifix-gray)', fontSize: '15px', lineHeight: 1.6 }}>
          {tier} 협력사는 하위 공급망이 없습니다.<br />
          자사 데이터를 입력하고 상위차사에 제출합니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Area */}
      <div 
        className="bg-white rounded-[20px] p-6 mb-6"
        style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
            하위차사 필터
          </h3>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{
              border: '1px solid var(--aifix-primary)',
              color: 'var(--aifix-primary)',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            <Filter className="w-4 h-4" />
            필터 초기화
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              업체
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>세진케미칼</option>
              <option>그린에너지솔루션</option>
              <option>한빛소재</option>
            </select>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              차수
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>3차</option>
            </select>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              납품 항목
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>화학 첨가제</option>
              <option>친환경 용제</option>
            </select>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              제출 상태
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>제출 완료</option>
              <option>미제출</option>
              <option>보완 요청</option>
            </select>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              기간
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>최근 7일</option>
              <option>최근 30일</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
            style={{ color: 'var(--aifix-gray)' }} 
          />
          <input
            type="text"
            placeholder="업체명, 납품 항목 검색"
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm"
            style={{ outline: 'none' }}
          />
        </div>
      </div>

      {/* Downstream Data List and Detail Panel */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left - Data List */}
        <div 
          className="col-span-7 bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <h3 className="text-lg mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            하위차사 데이터 목록
          </h3>

          {/* Table Header */}
          <div 
            className="grid grid-cols-12 gap-3 px-4 py-3 mb-2 rounded-lg"
            style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
          >
            <div className="col-span-3" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              업체명
            </div>
            <div className="col-span-3" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              납품 항목
            </div>
            <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              제출 상태
            </div>
            <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              최근 제출일
            </div>
            <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              액션
            </div>
          </div>

          {/* Table Rows */}
          <div className="space-y-1">
            {data.map((row) => {
              const statusColor = getStatusColor(row.status);
              return (
                <div
                  key={row.id}
                  onClick={() => onSelectData(row)}
                  className="grid grid-cols-12 gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                  style={{
                    backgroundColor: selectedData?.id === row.id ? 'var(--aifix-secondary-light)' : 'transparent'
                  }}
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--aifix-navy)' }}>
                        {row.company}
                      </div>
                      <div 
                        className="inline-block px-1.5 py-0.5 rounded text-xs mt-0.5"
                        style={{ 
                          backgroundColor: 'var(--aifix-secondary-light)',
                          color: 'var(--aifix-secondary)',
                          fontWeight: 600
                        }}
                      >
                        {row.tier}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                      {row.product}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span 
                      className="px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: statusColor.bg,
                        color: statusColor.text,
                        fontWeight: 600
                      }}
                    >
                      {getStatusText(row.status)}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                      {row.lastSubmitted}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <button
                      className="text-xs px-3 py-1.5 rounded transition-all hover:scale-105"
                      style={{
                        border: '1px solid var(--aifix-primary)',
                        color: 'var(--aifix-primary)',
                        fontWeight: 600
                      }}
                    >
                      상세 보기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right - Detail Panel */}
        <div 
          className="col-span-5 bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          {selectedData ? (
            <div>
              <h3 className="text-lg mb-6" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                하위차사 상세
              </h3>

              {/* Section 1: 업체 정보 */}
              <div className="mb-6">
                <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  업체 정보
                </h4>
                <div 
                  className="p-4 rounded-lg space-y-2"
                  style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
                >
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--aifix-gray)' }}>업체명</span>
                    <span style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {selectedData.company}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--aifix-gray)' }}>차수</span>
                    <span 
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ 
                        backgroundColor: 'var(--aifix-secondary)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    >
                      {selectedData.tier}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--aifix-gray)' }}>납품 항목</span>
                    <span style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {selectedData.product}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: 제출 데이터 요약 */}
              <div className="mb-6">
                <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  제출 데이터 요약
                </h4>
                <div className="space-y-3">
                  <div 
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>제출 상태</span>
                    <span 
                      className="px-3 py-1 rounded text-sm"
                      style={{ 
                        backgroundColor: getStatusColor(selectedData.status).bg,
                        color: getStatusColor(selectedData.status).text,
                        fontWeight: 600
                      }}
                    >
                      {getStatusText(selectedData.status)}
                    </span>
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>제출 날짜</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" style={{ color: 'var(--aifix-gray)' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                        {selectedData.lastSubmitted}
                      </span>
                    </div>
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>데이터 버전</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-primary)' }}>
                      {selectedData.status === "submitted" ? "v2.3" : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: 요청 이력 */}
              <div className="mb-6">
                <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  요청 이력
                </h4>
                <div 
                  className="p-4 rounded-lg"
                  style={{ 
                    backgroundColor: selectedData.requestStatus !== "-" ? '#E3F2FD' : '#F5F5F5',
                    border: selectedData.requestStatus !== "-" ? '1px solid #2196F3' : 'none'
                  }}
                >
                  {selectedData.requestStatus !== "-" ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4" style={{ color: '#2196F3' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#2196F3' }}>
                          {selectedData.requestStatus}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#2196F3', marginBottom: '8px' }}>
                        최근 요청: 2026-03-03 10:15
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--aifix-gray)', lineHeight: 1.5 }}>
                        "데이터 제출 기한이 임박했습니다. 빠른 제출 부탁드립니다."
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                      최근 요청 내역이 없습니다
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => onRequestClick("edit")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: 'var(--aifix-primary)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  <MessageSquare className="w-5 h-5" />
                  수정요청 보내기
                </button>

                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: '#FFEBEE', border: '1px solid #F44336' }}
                >
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#F44336' }} />
                    <p style={{ fontSize: '11px', color: '#F44336', lineHeight: 1.5 }}>
                      <strong>{tier} 협력사 권한:</strong> 하위 업체 데이터를 직접 수정할 수 없습니다. 
                      수정요청 또는 보완요청만 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <FileText 
                className="w-12 h-12 mb-4" 
                style={{ color: 'var(--aifix-gray)', opacity: 0.5 }} 
              />
              <p style={{ color: 'var(--aifix-gray)', fontSize: '14px' }}>
                하위차사를 선택하면<br />상세 정보가 표시됩니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

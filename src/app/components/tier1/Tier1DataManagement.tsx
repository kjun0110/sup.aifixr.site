'use client';

import { useState } from "react";
import { 
  Save, 
  Edit,
  CheckCircle, 
  AlertCircle, 
  Clock,
  FileText,
  Building2,
  Package,
  Zap,
  BarChart3,
  Send,
  Calendar,
  Info,
  XCircle
} from "lucide-react";

type SubTab = "own-data" | "supplier-data";

type SupplierData = {
  id: string;
  name: string;
  tier: string;
  product: string;
  status: "submitted" | "incomplete" | "pending" | "failed";
  lastSubmit: string;
  revisionRequested: boolean;
};

export function Tier1DataManagement() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("own-data");
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);

  const suppliers: SupplierData[] = [
    {
      id: "1",
      name: "동우전자부품",
      tier: "2차",
      product: "배터리 셀 모듈",
      status: "submitted",
      lastSubmit: "2026-03-03",
      revisionRequested: false
    },
    {
      id: "2",
      name: "한국소재산업",
      tier: "2차",
      product: "음극재",
      status: "failed",
      lastSubmit: "2026-03-02",
      revisionRequested: false
    },
    {
      id: "3",
      name: "세진케미칼",
      tier: "3차",
      product: "화학 첨가제",
      status: "incomplete",
      lastSubmit: "2026-03-01",
      revisionRequested: true
    },
    {
      id: "4",
      name: "그린에너지솔루션",
      tier: "3차",
      product: "분리막",
      status: "pending",
      lastSubmit: "-",
      revisionRequested: false
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return { bg: "#E8F5E9", text: "#4CAF50" };
      case "incomplete": return { bg: "#FFF4E6", text: "#FF9800" };
      case "pending": return { bg: "#E9F5FF", text: "#00B4FF" };
      case "failed": return { bg: "#FFEBEE", text: "#F44336" };
      default: return { bg: "#F5F5F5", text: "#757575" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "submitted": return "제출완료";
      case "incomplete": return "미완성";
      case "pending": return "미제출";
      case "failed": return "검증실패";
      default: return status;
    }
  };

  return (
    <div className="pt-8">
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            데이터 관리
          </h2>
          <p style={{ color: 'var(--aifix-gray)' }}>
            자사 데이터는 입력/수정하고, 하위 협력사 데이터는 요청으로 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105"
            style={{
              border: '2px solid var(--aifix-primary)',
              color: 'var(--aifix-primary)',
              fontWeight: 600,
            }}
          >
            임시 저장
          </button>
          <button
            className="px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105"
            style={{
              border: '2px solid var(--aifix-secondary)',
              color: 'var(--aifix-secondary)',
              fontWeight: 600,
            }}
          >
            검증
          </button>
          <button
            className="px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
              boxShadow: '0px 4px 12px rgba(91, 59, 250, 0.2)',
              color: 'white',
              fontWeight: 600,
            }}
          >
            저장
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab("own-data")}
          className="px-6 py-3 transition-all border-b-2"
          style={{
            borderBottomColor: activeSubTab === "own-data" ? 'var(--aifix-primary)' : 'transparent',
            color: activeSubTab === "own-data" ? 'var(--aifix-primary)' : 'var(--aifix-gray)',
            fontWeight: activeSubTab === "own-data" ? 600 : 400,
            fontSize: '15px'
          }}
        >
          자사 데이터
        </button>
        <button
          onClick={() => setActiveSubTab("supplier-data")}
          className="px-6 py-3 transition-all border-b-2"
          style={{
            borderBottomColor: activeSubTab === "supplier-data" ? 'var(--aifix-primary)' : 'transparent',
            color: activeSubTab === "supplier-data" ? 'var(--aifix-primary)' : 'var(--aifix-gray)',
            fontWeight: activeSubTab === "supplier-data" ? 600 : 400,
            fontSize: '15px'
          }}
        >
          하위차사 데이터
        </button>
      </div>

      {/* Content Area */}
      {activeSubTab === "own-data" ? (
        <OwnDataTab />
      ) : (
        <SupplierDataTab 
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
          onSelectSupplier={setSelectedSupplier}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
        />
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
            이 화면에서는 PCF 계산을 위한 입력 데이터를 관리합니다. 
            PCF 계산 실행 및 결과 확인은 <strong>'PCF 산정'</strong> 탭에서 수행됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

// Own Data Tab Component
function OwnDataTab() {
  const dataSections = [
    {
      id: "delivery",
      title: "납품 항목 정보",
      icon: Package,
      status: "complete",
      fields: ["납품 제품", "계약 항목", "생산 공정 구분"]
    },
    {
      id: "purchase",
      title: "구매 데이터",
      icon: FileText,
      status: "incomplete",
      fields: ["주요 원료", "투입량", "공급 방식"]
    },
    {
      id: "activity",
      title: "활동 데이터",
      icon: Zap,
      status: "complete",
      fields: ["에너지 사용량", "공정 활동 데이터"]
    },
    {
      id: "emission",
      title: "배출계수 선택",
      icon: BarChart3,
      status: "incomplete",
      fields: ["적용 배출계수", "계수 출처"]
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === "complete") {
      return (
        <div 
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
          style={{ backgroundColor: '#E8F5E9', color: '#4CAF50' }}
        >
          <CheckCircle className="w-4 h-4" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>입력 완료</span>
        </div>
      );
    } else if (status === "incomplete") {
      return (
        <div 
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
          style={{ backgroundColor: '#FFF4E6', color: '#FF9800' }}
        >
          <AlertCircle className="w-4 h-4" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>미완성</span>
        </div>
      );
    } else {
      return (
        <div 
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
          style={{ backgroundColor: '#FFEBEE', color: '#F44336' }}
        >
          <XCircle className="w-4 h-4" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>검증 실패</span>
        </div>
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {dataSections.map((section) => {
        const Icon = section.icon;
        return (
          <div 
            key={section.id}
            className="bg-white rounded-[20px] p-6"
            style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--aifix-primary)' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                  {section.title}
                </h3>
              </div>
              {getStatusBadge(section.status)}
            </div>

            {/* Field List */}
            <div className="space-y-4">
              {section.fields.map((field, idx) => (
                <div key={idx}>
                  <label 
                    className="block mb-2"
                    style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}
                  >
                    {field}
                  </label>
                  <input
                    type="text"
                    placeholder={`${field} 입력`}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 transition-all focus:border-[var(--aifix-primary)] focus:outline-none"
                    style={{ fontSize: '14px' }}
                  />
                </div>
              ))}
            </div>

            {/* Card Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                className="w-full py-2.5 rounded-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                style={{
                  border: '1px solid var(--aifix-primary)',
                  color: 'var(--aifix-primary)',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                <Edit className="w-4 h-4" />
                데이터 입력
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Supplier Data Tab Component
function SupplierDataTab({ 
  suppliers, 
  selectedSupplier, 
  onSelectSupplier,
  getStatusColor,
  getStatusLabel 
}: { 
  suppliers: SupplierData[];
  selectedSupplier: SupplierData | null;
  onSelectSupplier: (supplier: SupplierData | null) => void;
  getStatusColor: (status: string) => { bg: string; text: string };
  getStatusLabel: (status: string) => string;
}) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left - Supplier List */}
      <div 
        className="col-span-7 bg-white rounded-[20px] p-6"
        style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
      >
        <h3 className="text-lg mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          하위차사 목록
        </h3>

        {/* Table Header */}
        <div 
          className="grid grid-cols-12 gap-3 px-4 py-3 mb-2 rounded-lg"
          style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
        >
          <div className="col-span-3" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
            업체명
          </div>
          <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
            차수
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
        </div>

        {/* Table Rows */}
        <div className="space-y-1">
          {suppliers.map((supplier) => {
            const statusColor = getStatusColor(supplier.status);
            return (
              <div
                key={supplier.id}
                onClick={() => onSelectSupplier(supplier)}
                className="grid grid-cols-12 gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                style={{
                  backgroundColor: selectedSupplier?.id === supplier.id ? 'var(--aifix-secondary-light)' : 'transparent'
                }}
              >
                <div className="col-span-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--aifix-navy)' }}>
                    {supplier.name}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span 
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ 
                      backgroundColor: 'var(--aifix-secondary-light)',
                      color: 'var(--aifix-secondary)',
                      fontWeight: 600
                    }}
                  >
                    {supplier.tier}
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                    {supplier.product}
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
                    {getStatusLabel(supplier.status)}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                    {supplier.lastSubmit}
                  </span>
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
        {selectedSupplier ? (
          <div>
            <h3 className="text-lg mb-6" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              업체 상세 정보
            </h3>

            {/* Section 1: Company Info */}
            <div 
              className="mb-6 p-4 rounded-lg"
              style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
            >
              <div className="flex items-start gap-3 mb-4">
                <Building2 className="w-5 h-5 mt-0.5" style={{ color: 'var(--aifix-primary)' }} />
                <div className="flex-1">
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                    {selectedSupplier.name}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                    {selectedSupplier.tier} 협력사
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--aifix-gray)' }}>납품 항목</span>
                  <span style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    {selectedSupplier.product}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--aifix-gray)' }}>제출 상태</span>
                  <span 
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ 
                      backgroundColor: getStatusColor(selectedSupplier.status).bg,
                      color: getStatusColor(selectedSupplier.status).text,
                      fontWeight: 600
                    }}
                  >
                    {getStatusLabel(selectedSupplier.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--aifix-gray)' }}>최근 제출일</span>
                  <span style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    {selectedSupplier.lastSubmit}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Data Summary */}
            <div className="mb-6">
              <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                제출 데이터 요약
              </h4>
              <div className="space-y-2">
                {[
                  { name: "납품 항목 정보", status: "complete" },
                  { name: "구매 데이터", status: "complete" },
                  { name: "활동 데이터", status: "incomplete" },
                  { name: "배출계수 선택", status: "complete" },
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--aifix-navy)' }}>
                      {item.name}
                    </span>
                    {item.status === "complete" ? (
                      <CheckCircle className="w-4 h-4" style={{ color: '#4CAF50' }} />
                    ) : (
                      <AlertCircle className="w-4 h-4" style={{ color: '#FF9800' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Actions */}
            <div className="space-y-3">
              <h4 className="text-sm mb-2" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                주요 액션
              </h4>

              <button
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all hover:scale-[1.02]"
                style={{
                  border: '1px solid var(--aifix-gray)',
                  color: 'var(--aifix-gray)',
                  fontWeight: 600
                }}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">재요청 보내기</span>
                </div>
              </button>
            </div>

            {/* Note */}
            <div 
              className="mt-6 p-3 rounded-lg"
              style={{ backgroundColor: '#FFEBEE', border: '1px solid #F44336' }}
            >
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#F44336' }} />
                <p style={{ fontSize: '12px', color: '#F44336', lineHeight: 1.5 }}>
                  <strong>하위 협력사 즉시 편집 불가:</strong> 하위 협력사 데이터를 직접 수정할 수 없으며 수정 요청/보완 요청만 가능합니다.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Building2 
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
  );
}
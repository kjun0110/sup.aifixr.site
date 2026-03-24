'use client';

import { useState } from "react";
import { 
  Building2, 
  Database, 
  Zap, 
  Fuel, 
  Settings, 
  Trash2, 
  Leaf,
  Save,
  Send,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  Filter,
  Search,
  Calendar,
  MessageSquare,
  Factory
} from "lucide-react";
import { QuarterPicker } from "./QuarterPicker";

type DataManagementProps = {
  tier: "tier1" | "tier2" | "tier3";
};

type SupplierData = {
  id: string;
  name: string;
  tier: string;
  status: "submitted" | "pending" | "draft" | "revision-requested";
  lastSubmitted?: string;
  deadline: string;
};

type DataSection = {
  id: string;
  title: string;
  icon: any;
  fields: { label: string; value: string; unit: string }[];
};

export function DataManagement({ tier }: DataManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<"own-data" | "supplier-data">("own-data");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // 조회 조건
  const [ownDataPeriod, setOwnDataPeriod] = useState("2025년 Q1");
  const [ownDataSite, setOwnDataSite] = useState("본사");
  const [supplierDataPeriod, setSupplierDataPeriod] = useState("2025년 Q1");

  // 권한 설정
  const canRequest = tier === "tier1" || tier === "tier2"; // 1차, 2차는 수정요청 가능

  // Mock 하위 협력사 데이터
  const suppliersData: SupplierData[] = tier === "tier1" ? [
    { id: "s1", name: "2차 협력사 A", tier: "2차", status: "submitted", lastSubmitted: "2026-03-03", deadline: "2026-03-10" },
    { id: "s2", name: "2차 협력사 B", tier: "2차", status: "pending", deadline: "2026-03-10" },
    { id: "s3", name: "2차 협력사 C", tier: "2차", status: "submitted", lastSubmitted: "2026-03-04", deadline: "2026-03-10" },
  ] : tier === "tier2" ? [
    { id: "s4", name: "3차 협력사 D", tier: "3차", status: "submitted", lastSubmitted: "2026-03-02", deadline: "2026-03-08" },
    { id: "s5", name: "3차 협력사 E", tier: "3차", status: "draft", deadline: "2026-03-08" },
  ] : [];

  // 필터링된 협력사 목록
  const filteredSuppliers = suppliersData.filter(supplier => {
    const matchesTier = filterTier === "all" || supplier.tier === filterTier;
    const matchesStatus = filterStatus === "all" || supplier.status === filterStatus;
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesStatus && matchesSearch;
  });

  // 데이터 섹션 정의 (자사 및 협력사 공통)
  const dataSections: DataSection[] = [
    {
      id: "energy",
      title: "에너지 사용 데이터",
      icon: Zap,
      fields: [
        { label: "전기 사용량", value: "", unit: "kWh" },
        { label: "가스 사용량", value: "", unit: "m³" },
        { label: "스팀 사용량", value: "", unit: "ton" },
      ]
    },
    {
      id: "fuel",
      title: "연료 사용 데이터",
      icon: Fuel,
      fields: [
        { label: "경유 사용량", value: "", unit: "L" },
        { label: "휘발유 사용량", value: "", unit: "L" },
        { label: "LPG 사용량", value: "", unit: "kg" },
      ]
    },
    {
      id: "process",
      title: "공정 데이터",
      icon: Settings,
      fields: [
        { label: "생산량", value: "", unit: "units" },
        { label: "가동시간", value: "", unit: "hours" },
        { label: "불량률", value: "", unit: "%" },
      ]
    },
    {
      id: "waste",
      title: "폐기물 데이터",
      icon: Trash2,
      fields: [
        { label: "일반 폐기물", value: "", unit: "kg" },
        { label: "지정 폐기물", value: "", unit: "kg" },
        { label: "재활용", value: "", unit: "kg" },
      ]
    },
    {
      id: "environmental",
      title: "기타 환경 데이터",
      icon: Leaf,
      fields: [
        { label: "용수 사용량", value: "", unit: "m³" },
        { label: "배수량", value: "", unit: "m³" },
        { label: "대기오염물질", value: "", unit: "kg" },
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    const config = {
      submitted: { 
        label: "제출완료", 
        color: "var(--aifix-success)", 
        bg: "#E6F7ED",
        icon: CheckCircle 
      },
      pending: { 
        label: "제출대기", 
        color: "#F59E0B", 
        bg: "#FEF3C7",
        icon: Clock 
      },
      draft: { 
        label: "임시저장", 
        color: "var(--aifix-gray)", 
        bg: "#F3F4F6",
        icon: FileText 
      },
      "revision-requested": { 
        label: "수정요청", 
        color: "#EF4444", 
        bg: "#FEE2E2",
        icon: AlertCircle 
      },
    };
    const item = config[status as keyof typeof config];
    const Icon = item.icon;
    
    return (
      <div 
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg"
        style={{ 
          backgroundColor: item.bg,
          color: item.color,
          fontSize: '13px',
          fontWeight: 600
        }}
      >
        <Icon className="w-3.5 h-3.5" />
        {item.label}
      </div>
    );
  };

  // 자사 데이터 탭 렌더링
  const renderOwnDataTab = () => {
    return (
      <div className="space-y-6">
        {/* 조회 조건 */}
        <div 
          className="bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label 
                className="block mb-2"
                style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}
              >
                기간
              </label>
              <QuarterPicker
                value={ownDataPeriod}
                onChange={setOwnDataPeriod}
              />
            </div>
            <div>
              <label 
                className="block mb-2"
                style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}
              >
                사업장
              </label>
              <select
                value={ownDataSite}
                onChange={(e) => setOwnDataSite(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[var(--aifix-primary)] transition-all"
                style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}
              >
                <option value="본사">본사</option>
                <option value="제1공장">제1공장</option>
                <option value="제2공장">제2공장</option>
                <option value="제3공장">제3공장</option>
                <option value="연구소">연구소</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {dataSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="bg-white rounded-[20px] p-6"
                style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)',
                      color: 'white'
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                    {section.title}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {section.fields.map((field, idx) => (
                    <div key={idx}>
                      <label 
                        className="block mb-2"
                        style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}
                      >
                        {field.label}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="0"
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[var(--aifix-primary)] transition-colors"
                          style={{ fontSize: '14px' }}
                        />
                        <div
                          className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center"
                          style={{ fontSize: '14px', color: 'var(--aifix-gray)', fontWeight: 500, minWidth: '80px', justifyContent: 'center' }}
                        >
                          {field.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 파일 업로드 */}
                <div className="mb-6 p-4 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300">
                  <div className="flex items-center justify-center gap-3">
                    <Upload className="w-5 h-5" style={{ color: 'var(--aifix-gray)' }} />
                    <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                      증빙서류 업로드 (선택)
                    </span>
                    <button
                      className="px-4 py-1.5 rounded-lg text-sm transition-colors"
                      style={{
                        border: '1px solid var(--aifix-primary)',
                        color: 'var(--aifix-primary)',
                        fontWeight: 600
                      }}
                    >
                      파일 선택
                    </button>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 justify-end">
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all hover:bg-gray-100"
                    style={{
                      border: '1px solid var(--aifix-gray)',
                      color: 'var(--aifix-gray)',
                      fontWeight: 600
                    }}
                  >
                    <Save className="w-4 h-4" />
                    임시저장
                  </button>
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
                      color: 'white',
                      fontWeight: 600,
                      boxShadow: '0px 4px 12px rgba(91, 59, 250, 0.2)'
                    }}
                  >
                    <Send className="w-4 h-4" />
                    저장
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 하위 협력사 데이터 탭 렌더링
  const renderSupplierDataTab = () => {
    const selectedSupplierData = filteredSuppliers.find(s => s.id === selectedSupplier);

    return (
      <div className="space-y-6">
        {/* 조회 조건 */}
        <div 
          className="bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="w-1/2">
            <label 
              className="block mb-2"
              style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}
            >
              기간
            </label>
            <QuarterPicker
              value={supplierDataPeriod}
              onChange={setSupplierDataPeriod}
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* 좌측: 협력사 리스트 */}
          <div 
            className="col-span-5 bg-white rounded-[20px] p-6"
            style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)", height: 'fit-content' }}
          >
            <h3 className="mb-6" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
              하위 협력사 목록
            </h3>

            {/* 필터 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                  차수
                </label>
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[var(--aifix-primary)]"
                  style={{ fontSize: '14px' }}
                >
                  <option value="all">전체</option>
                  <option value="2차">2차</option>
                  <option value="3차">3차</option>
                  <option value="4차">4차</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                  제출 상태
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[var(--aifix-primary)]"
                  style={{ fontSize: '14px' }}
                >
                  <option value="all">전체</option>
                  <option value="submitted">제출완료</option>
                  <option value="pending">제출대기</option>
                  <option value="draft">임시저장</option>
                </select>
              </div>
            </div>

            {/* 검색 */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
              <input
                type="text"
                placeholder="업체명 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[var(--aifix-primary)]"
                style={{ fontSize: '14px' }}
              />
            </div>

            {/* 협력사 리스트 */}
            <div className="space-y-2">
              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--aifix-gray)', opacity: 0.5 }} />
                  <p style={{ color: 'var(--aifix-gray)', fontSize: '14px' }}>
                    등록된 하위 협력사가 없습니다
                  </p>
                </div>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    onClick={() => setSelectedSupplier(supplier.id)}
                    className="p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-[var(--aifix-primary)]"
                    style={{
                      borderColor: selectedSupplier === supplier.id ? 'var(--aifix-primary)' : '#E5E7EB',
                      backgroundColor: selectedSupplier === supplier.id ? 'var(--aifix-secondary-light)' : 'white'
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--aifix-navy)', marginBottom: '4px' }}>
                          {supplier.name}
                        </h4>
                        <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                          {supplier.tier}
                        </span>
                      </div>
                      {getStatusBadge(supplier.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--aifix-gray)' }}>
                      {supplier.lastSubmitted && (
                        <span>최근 제출: {supplier.lastSubmitted}</span>
                      )}
                      <span>마감일: {supplier.deadline}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 우측: 협력사 데이터 상세 */}
          <div className="col-span-7">
            {!selectedSupplierData ? (
              <div 
                className="bg-white rounded-[20px] p-12 text-center"
                style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
              >
                <Database className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--aifix-gray)', opacity: 0.5 }} />
                <h3 className="mb-2" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                  협력사를 선택하세요
                </h3>
                <p style={{ color: 'var(--aifix-gray)', fontSize: '14px' }}>
                  좌측 목록에서 협력사를 선택하면 데이터를 확인할 수 있습니다
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 헤더 */}
                <div 
                  className="bg-white rounded-[20px] p-6"
                  style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="mb-1" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                        {selectedSupplierData.name}
                      </h3>
                      <p style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                        {selectedSupplierData.tier} • 마감일: {selectedSupplierData.deadline}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {canRequest && (
                        <button
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all hover:bg-gray-100"
                          style={{
                            border: '1px solid var(--aifix-primary)',
                            color: 'var(--aifix-primary)',
                            fontWeight: 600
                          }}
                        >
                          <MessageSquare className="w-4 h-4" />
                          수정 요청
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 데이터 섹션들 (자사 데이터와 동일 구조) */}
                {dataSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div
                      key={section.id}
                      className="bg-white rounded-[20px] p-6"
                      style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
                    >
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)',
                            color: 'white'
                          }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                          {section.title}
                        </h3>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {section.fields.map((field, idx) => (
                          <div key={idx}>
                            <label 
                              className="block mb-2"
                              style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}
                            >
                              {field.label}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="0"
                                disabled
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[var(--aifix-primary)] transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                                style={{ fontSize: '14px' }}
                              />
                              <div
                                className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center"
                                style={{ fontSize: '14px', color: 'var(--aifix-gray)', fontWeight: 500, minWidth: '80px', justifyContent: 'center' }}
                              >
                                {field.unit}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-8">
      {/* 상단 헤더 */}
      <div className="mb-8">
        <h1 className="mb-2" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
          데이터 관리
        </h1>
        <p style={{ color: 'var(--aifix-gray)', fontSize: '15px' }}>
          자사 데이터는 입력/수정하고, 하위 협력사 데이터는 수정 요청만 가능합니다
        </p>
      </div>

      {/* 세부 탭 */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab("own-data")}
          className="px-6 py-3 border-b-2 transition-all"
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
          className="px-6 py-3 border-b-2 transition-all"
          style={{
            borderBottomColor: activeSubTab === "supplier-data" ? 'var(--aifix-primary)' : 'transparent',
            color: activeSubTab === "supplier-data" ? 'var(--aifix-primary)' : 'var(--aifix-gray)',
            fontWeight: activeSubTab === "supplier-data" ? 600 : 400,
            fontSize: '15px'
          }}
        >
          하위 협력사 데이터
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeSubTab === "own-data" ? renderOwnDataTab() : renderSupplierDataTab()}
    </div>
  );
}

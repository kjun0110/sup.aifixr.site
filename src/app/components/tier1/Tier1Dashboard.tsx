import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  ChevronRight,
  AlertTriangle,
  Building2,
  Calendar
} from "lucide-react";

export function Tier1Dashboard() {
  // Mock data
  const kpiData = [
    { 
      label: "전체 데이터 제출률", 
      value: "87%", 
      change: "+12%",
      trend: "up",
      icon: TrendingUp, 
      color: "var(--aifix-together)" 
    },
    { 
      label: "대기 중 작업", 
      value: "5건", 
      change: "확인 필요",
      icon: Clock, 
      color: "var(--aifix-secondary)" 
    },
    { 
      label: "완료된 작업", 
      value: "28건", 
      change: "+8건 이번 주",
      trend: "up",
      icon: CheckCircle, 
      color: "#4CAF50" 
    },
    { 
      label: "보완 요청", 
      value: "3건", 
      change: "조치 필요",
      icon: AlertCircle, 
      color: "#FF9800" 
    },
  ];

  const pendingCompanies = [
    { 
      id: 1,
      name: "동우전자부품", 
      tier: "2차", 
      status: "미제출", 
      lastSubmit: "2026-02-15",
      dueDate: "2026-03-10",
      daysLeft: 6
    },
    { 
      id: 2,
      name: "세진케미칼", 
      tier: "3차", 
      status: "보완필요", 
      lastSubmit: "2026-03-01",
      dueDate: "2026-03-10",
      daysLeft: 6
    },
    { 
      id: 3,
      name: "한국소재산업", 
      tier: "2차", 
      status: "지연", 
      lastSubmit: "2026-01-20",
      dueDate: "2026-03-10",
      daysLeft: 6
    },
    { 
      id: 4,
      name: "그린에너지솔루션", 
      tier: "3차", 
      status: "미제출", 
      lastSubmit: "-",
      dueDate: "2026-03-10",
      daysLeft: 6
    },
  ];

  const supplyChainProgress = [
    { tier: "2차", total: 12, submitted: 9, pending: 2, failed: 1 },
    { tier: "3차", total: 24, submitted: 18, pending: 4, failed: 2 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "미제출": return { bg: "#FFF4E6", text: "#FF9800" };
      case "보완필요": return { bg: "#FFEBEE", text: "#F44336" };
      case "지연": return { bg: "#FCE4EC", text: "#E91E63" };
      default: return { bg: "#E9F5FF", text: "#00B4FF" };
    }
  };

  return (
    <div className="pt-8">
      <div style={{ minHeight: '600px' }}>
      {/* Warning Banner */}
      <div 
        className="mb-8 p-6 rounded-[20px] flex items-center justify-between"
        style={{ backgroundColor: "#FFF4E6", border: "2px solid #FF9800" }}
      >
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-6 h-6" style={{ color: "#FF9800" }} />
          <div>
            <div style={{ fontWeight: 700, color: "#FF9800", fontSize: "16px" }}>
              마감 6일 전 - 미제출 업체 4개, 보완 필요 1개
            </div>
            <div style={{ color: "#FF9800", fontSize: "14px" }}>
              하위 협력사의 데이터 제출 상태를 확인하고 조치하세요
            </div>
          </div>
        </div>
        <button
          className="px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: "#FF9800",
            color: "white",
            fontWeight: 600,
          }}
        >
          미제출 업체 보기
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>하위 협력사 제출률</span>
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--aifix-together)' }} />
          </div>
          <div className="text-4xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            72%
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: '14px', color: 'var(--aifix-courage)' }}>
            <ArrowDownRight className="w-4 h-4" />
            <span>-8% 지난주 대비</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>확인 필요 작업</span>
            <Clock className="w-5 h-5" style={{ color: 'var(--aifix-secondary)' }} />
          </div>
          <div className="text-4xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            12건
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: '14px', color: '#FF9800' }}>
            <span>조치 필요</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>완료된 데이터 항목</span>
            <CheckCircle className="w-5 h-5" style={{ color: '#4CAF50' }} />
          </div>
          <div className="text-4xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            45건
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: '14px', color: '#4CAF50' }}>
            <ArrowUpRight className="w-4 h-4" />
            <span>+5건 이번 주</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>보완요청</span>
            <AlertCircle className="w-5 h-5" style={{ color: '#FF9800' }} />
          </div>
          <div className="text-4xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            8건
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: '14px', color: '#FF9800' }}>
            <span>검토 필요</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pending Companies List (Left - 2 columns) */}
        <div 
          className="lg:col-span-2 bg-white rounded-[20px] p-8" 
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              미제출/지연 업체
            </h3>
            <div className="flex gap-2">
              <select 
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
                style={{ color: 'var(--aifix-navy)' }}
              >
                <option>전체 차수</option>
                <option>2차</option>
                <option>3차</option>
              </select>
              <select 
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
                style={{ color: 'var(--aifix-navy)' }}
              >
                <option>전체 상태</option>
                <option>미제출</option>
                <option>보완필요</option>
                <option>지연</option>
              </select>
            </div>
          </div>

          {/* Table Header */}
          <div 
            className="grid grid-cols-12 gap-4 px-4 py-3 mb-2 rounded-lg"
            style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
          >
            <div className="col-span-3" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              업체명
            </div>
            <div className="col-span-1" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              차수
            </div>
            <div className="col-span-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              상태
            </div>
            <div className="col-span-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              최근 제출일
            </div>
            <div className="col-span-1" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              마감
            </div>
            <div className="col-span-3" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              액션
            </div>
          </div>

          {/* Table Rows */}
          <div className="space-y-2">
            {pendingCompanies.map((company) => {
              const statusColor = getStatusColor(company.status);
              return (
                <div 
                  key={company.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                    <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--aifix-navy)' }}>
                      {company.name}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span 
                      className="px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: 'var(--aifix-secondary-light)',
                        color: 'var(--aifix-secondary)',
                        fontWeight: 600
                      }}
                    >
                      {company.tier}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span 
                      className="px-3 py-1 rounded-lg text-sm"
                      style={{ 
                        backgroundColor: statusColor.bg,
                        color: statusColor.text,
                        fontWeight: 600
                      }}
                    >
                      {company.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                      {company.lastSubmit}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: company.daysLeft <= 7 ? '#F44336' : 'var(--aifix-navy)' }}
                    >
                      D-{company.daysLeft}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-105"
                      style={{
                        backgroundColor: 'var(--aifix-primary)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    >
                      수정요청
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Supply Chain Progress (Right - 1 column) */}
        <div 
          className="bg-white rounded-[20px] p-8" 
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <h3 className="text-2xl mb-6" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            공급망 단계별 진행
          </h3>

          <div className="space-y-6">
            {supplyChainProgress.map((tier) => {
              const submitRate = Math.round((tier.submitted / tier.total) * 100);
              return (
                <div key={tier.tier}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {tier.tier} 협력사
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                      {tier.submitted}/{tier.total}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-gray-200 rounded-full mb-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${submitRate}%`,
                        background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)'
                      }}
                    />
                  </div>

                  {/* Status Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 rounded" style={{ backgroundColor: '#E8F5E9' }}>
                      <div style={{ fontWeight: 600, color: '#4CAF50' }}>제출완료</div>
                      <div style={{ color: '#4CAF50' }}>{tier.submitted}건</div>
                    </div>
                    <div className="text-center p-2 rounded" style={{ backgroundColor: '#FFF4E6' }}>
                      <div style={{ fontWeight: 600, color: '#FF9800' }}>대기중</div>
                      <div style={{ color: '#FF9800' }}>{tier.pending}건</div>
                    </div>
                    <div className="text-center p-2 rounded" style={{ backgroundColor: '#FFEBEE' }}>
                      <div style={{ fontWeight: 600, color: '#F44336' }}>검증실패</div>
                      <div style={{ color: '#F44336' }}>{tier.failed}건</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div 
            className="mt-6 p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-primary)' }}>
                공급망 관리에서 상세 보기
              </span>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--aifix-primary)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          className="bg-white rounded-[20px] p-8 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
            >
              <Send className="w-6 h-6" style={{ color: 'var(--aifix-primary)' }} />
            </div>
            <ChevronRight className="w-6 h-6" style={{ color: 'var(--aifix-gray)' }} />
          </div>
          <h4 className="text-xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            공급망 관리로 이동
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--aifix-gray)', lineHeight: 1.6 }}>
            하위 협력사 구조를 확인하고 데이터 상태를 관리합니다
          </p>
        </button>

        <button
          className="bg-white rounded-[20px] p-8 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
            >
              <CheckCircle className="w-6 h-6" style={{ color: 'var(--aifix-primary)' }} />
            </div>
            <ChevronRight className="w-6 h-6" style={{ color: 'var(--aifix-gray)' }} />
          </div>
          <h4 className="text-xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            데이터 관리로 이동
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--aifix-gray)', lineHeight: 1.6 }}>
            자사 및 하위 협력사 데이터를 입력하고 수정합니다
          </p>
        </button>

        <button
          className="bg-white rounded-[20px] p-8 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: 'var(--aifix-primary)' }} />
            </div>
            <ChevronRight className="w-6 h-6" style={{ color: 'var(--aifix-gray)' }} />
          </div>
          <h4 className="text-xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            PCF 산정으로 이동
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--aifix-gray)', lineHeight: 1.6 }}>
            전체 데이터를 기반으로 PCF를 계산하고 원청사에 전송합니다
          </p>
        </button>
      </div>
      </div>
    </div>
  );
}
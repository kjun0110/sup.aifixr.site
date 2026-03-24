import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ArrowRight,
  Building2,
  FileText,
  Send,
  MessageSquare,
  Bell
} from "lucide-react";

type SupplierSubmission = {
  id: string;
  company: string;
  tier: string;
  product: string;
  status: "submitted" | "pending" | "requested";
  lastSubmitted: string;
  requestStatus: string;
};

export function NonTier1Dashboard({ tier }: { tier: "tier2" | "tier3" }) {
  const supplierSubmissions: SupplierSubmission[] = [
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
  ];

  const alerts = [
    {
      id: "1",
      type: "urgent",
      title: "마감 임박",
      message: "프로젝트 마감일이 3일 남았습니다",
      link: "프로젝트 상세"
    },
    {
      id: "2",
      type: "warning",
      title: "미제출 하위 업체",
      message: "그린에너지솔루션 데이터 미제출",
      link: "공급망 조회"
    },
    {
      id: "3",
      type: "info",
      title: "수정요청 응답 대기",
      message: "그린에너지솔루션 응답 대기 중 (3일 경과)",
      link: "요청 이력"
    },
  ];

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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "urgent": return <AlertCircle className="w-5 h-5" style={{ color: "#F44336" }} />;
      case "warning": return <AlertCircle className="w-5 h-5" style={{ color: "#FF9800" }} />;
      case "info": return <Bell className="w-5 h-5" style={{ color: "#2196F3" }} />;
      default: return <Bell className="w-5 h-5" style={{ color: "var(--aifix-gray)" }} />;
    }
  };

  const tierName = tier === "tier2" ? "2차" : "3차";
  const hasDownstream = tier === "tier2"; // 2차는 하위차사 있음, 3차는 없음

  return (
    <div className="pt-8">
      <div style={{ minHeight: '600px' }}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          대시보드
        </h2>
        <p style={{ color: 'var(--aifix-gray)' }}>
          {tierName} 협력사 업무 현황을 확인합니다
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: 자사 데이터 입력 진행률 */}
        <div 
          className="bg-white rounded-[20px] p-6 cursor-pointer transition-all hover:scale-[1.02]"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>자사 데이터 입력</span>
            <FileText className="w-5 h-5" style={{ color: 'var(--aifix-primary)' }} />
          </div>
          <div className="text-4xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            92%
          </div>
          <div style={{ fontSize: '14px', color: 'var(--aifix-gray)', marginBottom: '8px' }}>
            입력 완료율
          </div>
          <button
            className="flex items-center gap-1 text-sm transition-all hover:underline"
            style={{ color: 'var(--aifix-primary)', fontWeight: 600 }}
          >
            데이터 관리로 이동
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: 하위차사 제출 현황 */}
        {hasDownstream ? (
          <div 
            className="bg-white rounded-[20px] p-6 cursor-pointer transition-all hover:scale-[1.02]"
            style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>하위차사 제출</span>
              <Building2 className="w-5 h-5" style={{ color: 'var(--aifix-secondary)' }} />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                3
              </span>
              <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                / 4
              </span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--aifix-gray)', marginBottom: '8px' }}>
              제출 완료 업체
            </div>
            <button
              className="flex items-center gap-1 text-sm transition-all hover:underline"
              style={{ color: 'var(--aifix-primary)', fontWeight: 600 }}
            >
              공급망 조회로 이동
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div 
            className="bg-white rounded-[20px] p-6"
            style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>하위차사</span>
              <Building2 className="w-5 h-5" style={{ color: 'var(--aifix-gray)' }} />
            </div>
            <div className="text-4xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-gray)' }}>
              0
            </div>
            <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              하위 공급망 없음
            </div>
          </div>
        )}

        {/* Card 3: 수정요청 진행 */}
        {hasDownstream ? (
          <div 
            className="bg-white rounded-[20px] p-6"
            style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>수정요청 진행</span>
              <MessageSquare className="w-5 h-5" style={{ color: '#FF9800' }} />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                2
              </span>
              <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                / 3
              </span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              요청 중 / 처리 완료
            </div>
          </div>
        ) : (
          <div 
            className="bg-white rounded-[20px] p-6"
            style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>수정요청</span>
              <MessageSquare className="w-5 h-5" style={{ color: 'var(--aifix-gray)' }} />
            </div>
            <div className="text-4xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-gray)' }}>
              -
            </div>
            <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              해당 없음
            </div>
          </div>
        )}

        {/* Card 4: 상위차사 제출 상태 */}
        <div 
          className="bg-white rounded-[20px] p-6 cursor-pointer transition-all hover:scale-[1.02]"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>상위차사 제출</span>
            <Send className="w-5 h-5" style={{ color: '#4CAF50' }} />
          </div>
          <div 
            className="inline-flex px-4 py-2 rounded-lg mb-4"
            style={{ backgroundColor: '#FFF4E6', color: '#FF9800', fontWeight: 700, fontSize: '20px' }}
          >
            제출 대기
          </div>
          <div style={{ fontSize: '14px', color: 'var(--aifix-gray)', marginBottom: '8px' }}>
            PCF 계산 완료 후 제출
          </div>
          <button
            className="flex items-center gap-1 text-sm transition-all hover:underline"
            style={{ color: 'var(--aifix-primary)', fontWeight: 600 }}
          >
            PCF 산정·전송으로 이동
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left - 하위차사 제출 현황 리스트 */}
        <div 
          className="col-span-8 bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <h3 className="text-lg mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            {hasDownstream ? "하위차사 제출 현황" : "제출 준비 현황"}
          </h3>

          {hasDownstream ? (
            <>
              {/* Table Header */}
              <div 
                className="grid grid-cols-12 gap-3 px-4 py-3 mb-2 rounded-lg"
                style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
              >
                <div className="col-span-3" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  업체명
                </div>
                <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  납품 항목
                </div>
                <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  제출 상태
                </div>
                <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  최근 제출일
                </div>
                <div className="col-span-3" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  액션
                </div>
              </div>

              {/* Table Rows */}
              <div className="space-y-1">
                {supplierSubmissions.map((submission) => {
                  const statusColor = getStatusColor(submission.status);
                  return (
                    <div
                      key={submission.id}
                      className="grid grid-cols-12 gap-3 px-4 py-3 rounded-lg transition-all hover:bg-gray-50"
                    >
                      <div className="col-span-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--aifix-navy)' }}>
                            {submission.company}
                          </div>
                          <div 
                            className="inline-block px-1.5 py-0.5 rounded text-xs mt-0.5"
                            style={{ 
                              backgroundColor: 'var(--aifix-secondary-light)',
                              color: 'var(--aifix-secondary)',
                              fontWeight: 600
                            }}
                          >
                            {submission.tier}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                          {submission.product}
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
                          {getStatusText(submission.status)}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                          {submission.lastSubmitted}
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        {submission.requestStatus !== "-" && (
                          <span 
                            className="px-2 py-1 rounded text-xs"
                            style={{ 
                              backgroundColor: '#E3F2FD',
                              color: '#2196F3',
                              fontWeight: 600
                            }}
                          >
                            {submission.requestStatus}
                          </span>
                        )}
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

              {/* Note */}
              <div 
                className="mt-6 p-4 rounded-lg"
                style={{ backgroundColor: '#E3F2FD', border: '1px solid #2196F3' }}
              >
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#2196F3' }} />
                  <p style={{ fontSize: '12px', color: '#2196F3', lineHeight: 1.5 }}>
                    <strong>{tierName} 협력사 권한:</strong> 하위 업체 데이터는 직접 수정할 수 없으며, 
                    수정요청 또는 보완요청만 가능합니다.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Building2 
                className="w-12 h-12 mx-auto mb-4" 
                style={{ color: 'var(--aifix-gray)', opacity: 0.5 }} 
              />
              <p style={{ color: 'var(--aifix-gray)', fontSize: '14px' }}>
                {tierName} 협력사는 하위 공급망이 없습니다
              </p>
              <p style={{ color: 'var(--aifix-gray)', fontSize: '13px', marginTop: '8px' }}>
                자사 데이터를 입력하고 상위차사에 제출합니다
              </p>
            </div>
          )}
        </div>

        {/* Right - 알림/경고 영역 */}
        <div 
          className="col-span-4 bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <h3 className="text-lg mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            알림 및 경고
          </h3>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className="p-4 rounded-lg border cursor-pointer transition-all hover:bg-gray-50"
                style={{ 
                  borderColor: alert.type === "urgent" ? "#F44336" : alert.type === "warning" ? "#FF9800" : "#2196F3",
                  backgroundColor: alert.type === "urgent" ? "#FFEBEE" : alert.type === "warning" ? "#FFF4E6" : "#E3F2FD"
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)', marginBottom: '4px' }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                      {alert.message}
                    </div>
                  </div>
                </div>
                <button
                  className="flex items-center gap-1 text-xs transition-all hover:underline"
                  style={{ 
                    color: alert.type === "urgent" ? "#F44336" : alert.type === "warning" ? "#FF9800" : "#2196F3",
                    fontWeight: 600
                  }}
                >
                  {alert.link}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Quick Action */}
          <div className="mt-6">
            <button
              className="w-full py-3 rounded-lg transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--aifix-primary)',
                color: 'white',
                fontWeight: 600
              }}
            >
              전체 알림 보기
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from "react";
import { 
  Search,
  Filter,
  Calendar,
  User,
  Building2,
  FileText,
  MessageSquare,
  Calculator,
  Send,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Info
} from "lucide-react";

type EventType = "input-change" | "request" | "calculation" | "submission";

type HistoryEvent = {
  id: string;
  timestamp: string;
  eventType: EventType;
  targetCompany: string;
  summary: string;
  user: string;
  version: string;
};

export function NonTier1History({ tier }: { tier: "tier2" | "tier3" }) {
  const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const tierName = tier === "tier2" ? "2차" : "3차";
  const hasDownstream = tier === "tier2";

  const historyEvents: HistoryEvent[] = [
    {
      id: "1",
      timestamp: "2026-03-04 14:32",
      eventType: "calculation",
      targetCompany: "우리회사",
      summary: "PCF 재계산 완료 (v2.3)",
      user: "김철수",
      version: "v2.3"
    },
    {
      id: "2",
      timestamp: "2026-03-04 11:20",
      eventType: "input-change",
      targetCompany: "우리회사",
      summary: "에너지 사용 데이터 수정",
      user: "김철수",
      version: "v2.2"
    },
    {
      id: "3",
      timestamp: "2026-03-03 16:45",
      eventType: "submission",
      targetCompany: "동우전자부품 (1차)",
      summary: "상위차사 제출 완료",
      user: "김철수",
      version: "v2.1"
    },
    {
      id: "4",
      timestamp: "2026-03-03 14:15",
      eventType: "calculation",
      targetCompany: "우리회사",
      summary: "PCF 계산 완료 (v2.1)",
      user: "김철수",
      version: "v2.1"
    },
    {
      id: "5",
      timestamp: "2026-03-03 10:15",
      eventType: "request",
      targetCompany: "그린에너지솔루션",
      summary: "수정요청 발송",
      user: "김철수",
      version: "-"
    },
    {
      id: "6",
      timestamp: "2026-03-02 15:30",
      eventType: "input-change",
      targetCompany: "우리회사",
      summary: "활동 데이터 입력",
      user: "이영희",
      version: "v2.0"
    },
    {
      id: "7",
      timestamp: "2026-03-01 09:00",
      eventType: "request",
      targetCompany: "대한정밀화학",
      summary: "보완요청 발송",
      user: "김철수",
      version: "-"
    },
  ];

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case "input-change":
        return <FileText className="w-4 h-4" style={{ color: '#2196F3' }} />;
      case "request":
        return <MessageSquare className="w-4 h-4" style={{ color: '#FF9800' }} />;
      case "calculation":
        return <Calculator className="w-4 h-4" style={{ color: '#4CAF50' }} />;
      case "submission":
        return <Send className="w-4 h-4" style={{ color: '#9C27B0' }} />;
    }
  };

  const getEventTypeName = (type: EventType) => {
    switch (type) {
      case "input-change": return "입력 변경";
      case "request": return "요청";
      case "calculation": return "계산";
      case "submission": return "전송";
    }
  };

  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case "input-change": return { bg: '#E3F2FD', text: '#2196F3' };
      case "request": return { bg: '#FFF4E6', text: '#FF9800' };
      case "calculation": return { bg: '#E8F5E9', text: '#4CAF50' };
      case "submission": return { bg: '#F3E5F5', text: '#9C27B0' };
    }
  };

  return (
    <div className="pt-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          이력
        </h2>
        <p style={{ color: 'var(--aifix-gray)' }}>
          프로젝트 내 모든 활동을 감사 추적 형태로 기록하고 조회합니다
        </p>
      </div>

      {/* Filter Area */}
      <div 
        className="bg-white rounded-[20px] p-6 mb-6"
        style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
            이력 필터
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
              style={{
                backgroundColor: compareMode ? 'var(--aifix-primary)' : 'transparent',
                border: `2px solid var(--aifix-primary)`,
                color: compareMode ? 'white' : 'var(--aifix-primary)',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              <TrendingUp className="w-4 h-4" />
              버전 비교
            </button>
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
        </div>

        <div className="grid grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              업체
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>우리회사</option>
              {hasDownstream && <option>세진케미칼</option>}
              {hasDownstream && <option>그린에너지솔루션</option>}
            </select>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              사용자
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>김철수</option>
              <option>이영희</option>
            </select>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              이벤트 유형
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>입력 변경</option>
              <option>요청</option>
              <option>계산</option>
              <option>전송</option>
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
              <option>최근 90일</option>
            </select>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              버전
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>v2.3</option>
              <option>v2.2</option>
              <option>v2.1</option>
              <option>v2.0</option>
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
            placeholder="이벤트 내용, 업체명, 사용자 검색"
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm"
            style={{ outline: 'none' }}
          />
        </div>
      </div>

      {/* Main Grid */}
      {compareMode ? (
        <VersionCompareView 
          tierName={tierName}
          onBack={() => setCompareMode(false)}
        />
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Left - History List */}
          <div 
            className="col-span-7 bg-white rounded-[20px] p-6"
            style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
          >
            <h3 className="text-lg mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              이력 목록
            </h3>

            {/* Table Header */}
            <div 
              className="grid grid-cols-12 gap-3 px-4 py-3 mb-2 rounded-lg"
              style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
            >
              <div className="col-span-3" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                시간
              </div>
              <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                유형
              </div>
              <div className="col-span-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                변경 내용
              </div>
              <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                사용자
              </div>
              <div className="col-span-1" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                버전
              </div>
            </div>

            {/* Table Rows */}
            <div className="space-y-1">
              {historyEvents.map((event) => {
                const typeColor = getEventTypeColor(event.eventType);
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="grid grid-cols-12 gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                    style={{
                      backgroundColor: selectedEvent?.id === event.id ? 'var(--aifix-secondary-light)' : 'transparent'
                    }}
                  >
                    <div className="col-span-3 flex items-center">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" style={{ color: 'var(--aifix-gray)' }} />
                        <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                          {event.timestamp}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{ 
                          backgroundColor: typeColor.bg,
                          color: typeColor.text,
                          fontWeight: 600
                        }}
                      >
                        {getEventIcon(event.eventType)}
                        {getEventTypeName(event.eventType)}
                      </span>
                    </div>
                    <div className="col-span-4 flex items-center">
                      <span style={{ fontSize: '13px', color: 'var(--aifix-navy)', fontWeight: 500 }}>
                        {event.summary}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" style={{ color: 'var(--aifix-gray)' }} />
                        <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                          {event.user}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-1 flex items-center">
                      <span 
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{ 
                          backgroundColor: event.version !== "-" ? 'var(--aifix-primary-light)' : '#F5F5F5',
                          color: event.version !== "-" ? 'var(--aifix-primary)' : 'var(--aifix-gray)',
                          fontWeight: 600
                        }}
                      >
                        {event.version}
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
            {selectedEvent ? (
              <div>
                <h3 className="text-lg mb-6" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                  이벤트 상세
                </h3>

                {/* Event Meta */}
                <div 
                  className="p-4 rounded-lg mb-6"
                  style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>이벤트 유형</span>
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{ 
                          backgroundColor: getEventTypeColor(selectedEvent.eventType).bg,
                          color: getEventTypeColor(selectedEvent.eventType).text,
                          fontWeight: 600
                        }}
                      >
                        {getEventIcon(selectedEvent.eventType)}
                        {getEventTypeName(selectedEvent.eventType)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>시간</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                        {selectedEvent.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>사용자</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                        {selectedEvent.user}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>대상 업체</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                        {selectedEvent.targetCompany}
                      </span>
                    </div>
                    {selectedEvent.version !== "-" && (
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>버전</span>
                        <span 
                          className="px-2 py-1 rounded text-xs"
                          style={{ 
                            backgroundColor: 'var(--aifix-primary)',
                            color: 'white',
                            fontWeight: 600
                          }}
                        >
                          {selectedEvent.version}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Details */}
                <div className="mb-6">
                  <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    변경 내용 요약
                  </h4>
                  <div 
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <p style={{ fontSize: '13px', color: 'var(--aifix-navy)', lineHeight: 1.6 }}>
                      {selectedEvent.summary}
                    </p>
                  </div>
                </div>

                {/* Change Details (for input-change events) */}
                {selectedEvent.eventType === "input-change" && (
                  <div className="mb-6">
                    <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      변경 전 / 변경 후
                    </h4>
                    <div className="space-y-3">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: '#FFEBEE' }}
                      >
                        <div style={{ fontSize: '12px', color: '#F44336', marginBottom: '4px', fontWeight: 600 }}>
                          변경 전
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--aifix-navy)' }}>
                          에너지 사용량: 1,250 kWh
                        </div>
                      </div>
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: '#E8F5E9' }}
                      >
                        <div style={{ fontSize: '12px', color: '#4CAF50', marginBottom: '4px', fontWeight: 600 }}>
                          변경 후
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--aifix-navy)' }}>
                          에너지 사용량: 1,385 kWh
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Request Details (for request events) */}
                {selectedEvent.eventType === "request" && (
                  <div className="mb-6">
                    <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      요청 메시지
                    </h4>
                    <div 
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: '#FFF4E6', border: '1px solid #FF9800' }}
                    >
                      <p style={{ fontSize: '13px', color: 'var(--aifix-navy)', lineHeight: 1.6 }}>
                        "데이터 제출 기한이 임박했습니다. 빠른 제출 부탁드립니다."
                      </p>
                    </div>
                  </div>
                )}

                {/* Related Links */}
                <div>
                  <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    관련 데이터 링크
                  </h4>
                  <div className="space-y-2">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all hover:bg-gray-50"
                      style={{ border: '1px solid #E0E0E0' }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--aifix-navy)', fontWeight: 500 }}>
                        데이터 관리로 이동
                      </span>
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                    </button>
                    {selectedEvent.version !== "-" && (
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all hover:bg-gray-50"
                        style={{ border: '1px solid #E0E0E0' }}
                      >
                        <span style={{ fontSize: '13px', color: 'var(--aifix-navy)', fontWeight: 500 }}>
                          데이터 조회로 이동
                        </span>
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                      </button>
                    )}
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
                  이력 항목을 선택하면<br />상세 정보가 표시됩니다
                </p>
              </div>
            )}
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
            이력 탭 안내
          </h4>
          <p style={{ color: 'var(--aifix-gray)', lineHeight: 1.6, fontSize: '14px' }}>
            이력 탭은 <strong>감사 추적(Audit Trail)</strong> 목적으로 프로젝트 내 모든 활동을 기록합니다. 
            데이터 입력 변경, 수정요청/보완요청, PCF 계산, 상위차사 전송 등 모든 이벤트가 시간순으로 표시됩니다. 
            이력에서는 어떤 경우에도 수정 기능을 제공하지 않으며, <strong>조회 전용</strong>입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

// Version Compare View Component
function VersionCompareView({ 
  tierName, 
  onBack 
}: { 
  tierName: string;
  onBack: () => void;
}) {
  const [version1, setVersion1] = useState("v2.3");
  const [version2, setVersion2] = useState("v2.1");

  const comparisonData = [
    {
      category: "총 PCF",
      v1: "544.0 kgCO₂e",
      v2: "512.3 kgCO₂e",
      change: "+6.2%",
      trend: "up"
    },
    {
      category: "에너지 사용",
      v1: "245.8 kgCO₂e",
      v2: "228.5 kgCO₂e",
      change: "+7.6%",
      trend: "up"
    },
    {
      category: "원료 투입",
      v1: "178.3 kgCO₂e",
      v2: "175.8 kgCO₂e",
      change: "+1.4%",
      trend: "up"
    },
    {
      category: "하위차사 기여",
      v1: "98.5 kgCO₂e",
      v2: "87.2 kgCO₂e",
      change: "+13.0%",
      trend: "up"
    },
    {
      category: "기타",
      v1: "21.4 kgCO₂e",
      v2: "20.8 kgCO₂e",
      change: "+2.9%",
      trend: "up"
    },
  ];

  return (
    <div>
      <div 
        className="bg-white rounded-[20px] p-6 mb-6"
        style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            버전 비교
          </h3>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{
              border: '1px solid var(--aifix-gray)',
              color: 'var(--aifix-gray)',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            돌아가기
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              버전 1
            </label>
            <select 
              value={version1}
              onChange={(e) => setVersion1(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            >
              <option>v2.3</option>
              <option>v2.2</option>
              <option>v2.1</option>
              <option>v2.0</option>
            </select>
          </div>
          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              버전 2
            </label>
            <select 
              value={version2}
              onChange={(e) => setVersion2(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            >
              <option>v2.3</option>
              <option>v2.2</option>
              <option>v2.1</option>
              <option>v2.0</option>
            </select>
          </div>
        </div>

        {/* Comparison Table */}
        <div>
          {/* Table Header */}
          <div 
            className="grid grid-cols-5 gap-4 px-4 py-3 mb-2 rounded-lg"
            style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
          >
            <div className="col-span-1" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              항목
            </div>
            <div className="col-span-1 text-center" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              {version1}
            </div>
            <div className="col-span-1 text-center" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              {version2}
            </div>
            <div className="col-span-1 text-center" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              변화율
            </div>
            <div className="col-span-1 text-center" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              추세
            </div>
          </div>

          {/* Table Rows */}
          <div className="space-y-1">
            {comparisonData.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-5 gap-4 px-4 py-3 rounded-lg"
                style={{ backgroundColor: index === 0 ? 'var(--aifix-secondary-light)' : 'transparent' }}
              >
                <div className="col-span-1 flex items-center">
                  <span style={{ 
                    fontSize: index === 0 ? '14px' : '13px', 
                    fontWeight: index === 0 ? 700 : 500, 
                    color: 'var(--aifix-navy)' 
                  }}>
                    {row.category}
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    {row.v1}
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    {row.v2}
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <span 
                    className="px-2 py-1 rounded text-xs"
                    style={{ 
                      backgroundColor: row.trend === "up" ? '#FFEBEE' : row.trend === "down" ? '#E8F5E9' : '#F5F5F5',
                      color: row.trend === "up" ? '#F44336' : row.trend === "down" ? '#4CAF50' : 'var(--aifix-gray)',
                      fontWeight: 600
                    }}
                  >
                    {row.change}
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  {row.trend === "up" ? (
                    <TrendingUp className="w-5 h-5" style={{ color: '#F44336' }} />
                  ) : row.trend === "down" ? (
                    <TrendingDown className="w-5 h-5" style={{ color: '#4CAF50' }} />
                  ) : (
                    <Minus className="w-5 h-5" style={{ color: 'var(--aifix-gray)' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Summary */}
        <div 
          className="mt-6 p-4 rounded-lg"
          style={{ backgroundColor: '#E3F2FD', border: '1px solid #2196F3' }}
        >
          <div className="flex gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#2196F3' }} />
            <p style={{ fontSize: '12px', color: '#2196F3', lineHeight: 1.5 }}>
              <strong>분석 요약:</strong> {version1}은 {version2} 대비 전체 PCF가 6.2% 증가했습니다. 
              주요 원인은 에너지 사용량 증가(+7.6%)와 하위차사 기여도 증가(+13.0%)입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

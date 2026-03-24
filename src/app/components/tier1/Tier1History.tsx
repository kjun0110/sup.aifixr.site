'use client';

import { useState } from "react";
import { 
  Search,
  Filter,
  Download,
  FileText,
  Calendar,
  User,
  Edit,
  Send,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Building2,
  Eye,
  GitCompare,
  Clock,
  ChevronRight
} from "lucide-react";

type HistoryEvent = {
  id: string;
  timestamp: string;
  eventType: "data-change" | "edit" | "request" | "calculation" | "transmission";
  target: string;
  targetTier: string;
  summary: string;
  user: string;
  version?: string;
};

export function Tier1History() {
  const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);
  const [showVersionCompare, setShowVersionCompare] = useState(false);

  const historyEvents: HistoryEvent[] = [
    {
      id: "1",
      timestamp: "2026-03-04 16:10:23",
      eventType: "transmission",
      target: "원청사 A",
      targetTier: "-",
      summary: "PCF 계산 결과 전송 완료 (v2.3)",
      user: "김철수 (1차)",
      version: "v2.3"
    },
    {
      id: "2",
      timestamp: "2026-03-04 15:24:15",
      eventType: "calculation",
      target: "전체 공급망",
      targetTier: "1차~3차",
      summary: "PCF 재계산 실행 (총 PCF: 1,102.0 kg CO2e)",
      user: "시스템",
      version: "v2.3"
    },
    {
      id: "3",
      timestamp: "2026-03-04 14:45:32",
      eventType: "edit",
      target: "동우전자부품",
      targetTier: "2차",
      summary: "하위차사 데이터 수정 요청 (에너지 사용량 변경)",
      user: "김철수 (1차)",
      version: "v2.3"
    },
    {
      id: "4",
      timestamp: "2026-03-04 11:20:18",
      eventType: "request",
      target: "세진케미칼",
      targetTier: "3차",
      summary: "보완 요청 발송 (배출계수 선택 누락)",
      user: "김철수 (1차)"
    },
    {
      id: "5",
      timestamp: "2026-03-03 16:33:45",
      eventType: "data-change",
      target: "우리회사 (1차)",
      targetTier: "1차",
      summary: "자사 데이터 저장 (납품 항목 정보 수정)",
      user: "김철수 (1차)",
      version: "v2.2"
    },
    {
      id: "6",
      timestamp: "2026-03-03 14:12:09",
      eventType: "calculation",
      target: "전체 공급망",
      targetTier: "1차~3차",
      summary: "PCF 계산 실행 (총 PCF: 1,089.3 kg CO2e)",
      user: "시스템",
      version: "v2.2"
    },
    {
      id: "7",
      timestamp: "2026-03-02 10:15:22",
      eventType: "request",
      target: "한국소재산업",
      targetTier: "2차",
      summary: "재요청 발송 (마감일 연장 요청)",
      user: "김철수 (1차)"
    },
    {
      id: "8",
      timestamp: "2026-03-01 09:42:11",
      eventType: "transmission",
      target: "원청사 A",
      targetTier: "-",
      summary: "PCF 계산 결과 전송 완료 (v2.1)",
      user: "김철수 (1차)",
      version: "v2.1"
    },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case "transmission": return <Send className="w-4 h-4" style={{ color: '#4CAF50' }} />;
      case "calculation": return <RefreshCw className="w-4 h-4" style={{ color: '#2196F3' }} />;
      case "edit": return <Edit className="w-4 h-4" style={{ color: '#9C27B0' }} />;
      case "request": return <AlertCircle className="w-4 h-4" style={{ color: '#FF9800' }} />;
      case "data-change": return <FileText className="w-4 h-4" style={{ color: '#00BCD4' }} />;
      default: return <FileText className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />;
    }
  };

  const getEventTypeName = (type: string) => {
    switch (type) {
      case "transmission": return "전송";
      case "calculation": return "계산";
      case "edit": return "수정 요청";
      case "request": return "요청";
      case "data-change": return "입력 변경";
      default: return type;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "transmission": return { bg: "#E8F5E9", text: "#4CAF50" };
      case "calculation": return { bg: "#E3F2FD", text: "#2196F3" };
      case "edit": return { bg: "#F3E5F5", text: "#9C27B0" };
      case "request": return { bg: "#FFF4E6", text: "#FF9800" };
      case "data-change": return { bg: "#E0F7FA", text: "#00BCD4" };
      default: return { bg: "#F5F5F5", text: "#757575" };
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
          프로젝트 내 모든 변경·요청·계산·전송 기록을 확인합니다
        </p>
      </div>

      {/* Filter Bar */}
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
              onClick={() => setShowVersionCompare(!showVersionCompare)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
              style={{
                border: '1px solid var(--aifix-primary)',
                color: 'var(--aifix-primary)',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              <GitCompare className="w-4 h-4" />
              버전 비교
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--aifix-primary)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              <Download className="w-4 h-4" />
              로그 내보내기
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              대상 범위
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>자사</option>
              <option>하위차사</option>
            </select>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              차수
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>1차</option>
              <option>2차</option>
              <option>3차</option>
            </select>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              이벤트 타입
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>입력 변경</option>
              <option>하위 수정</option>
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
              <option>사용자 지정</option>
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
            </select>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              사용자
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>김철수 (1차)</option>
              <option>시스템</option>
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
            placeholder="업체명, 계약번호, 항목명 검색"
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm"
            style={{ outline: 'none' }}
          />
        </div>
      </div>

      {/* Version Compare Panel (conditionally shown) */}
      {showVersionCompare && (
        <div 
          className="bg-white rounded-[20px] p-6 mb-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <h3 className="text-lg mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            버전 비교
          </h3>

          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                버전 1
              </label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300">
                <option>v2.3 (현재) - 2026-03-04 15:24</option>
                <option>v2.2 - 2026-03-03 14:12</option>
                <option>v2.1 - 2026-03-01 09:42</option>
              </select>
            </div>

            <div>
              <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                버전 2
              </label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300">
                <option>v2.2 - 2026-03-03 14:12</option>
                <option>v2.1 - 2026-03-01 09:42</option>
                <option>v2.0 - 2026-02-28 10:15</option>
              </select>
            </div>
          </div>

          {/* Comparison Summary */}
          <div 
            className="p-6 rounded-lg"
            style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
          >
            <h4 className="text-sm mb-4" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
              비교 결과 요약 (v2.3 vs v2.2)
            </h4>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>
                  총 PCF 변화
                </div>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--aifix-primary)' }}>
                    +12.7
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                    kg CO2e
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--aifix-gray)', marginTop: '4px' }}>
                  1,089.3 → 1,102.0
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>
                  주요 기여도 변화
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  동우전자부품
                </div>
                <div style={{ fontSize: '12px', color: 'var(--aifix-gray)', marginTop: '4px' }}>
                  38.1% → 39.2% (+1.1%p)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>
                  경고 변화
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#FF9800' }}>
                  2건 → 1건
                </div>
                <div style={{ fontSize: '12px', color: 'var(--aifix-gray)', marginTop: '4px' }}>
                  1건 해결됨
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Table and Detail Panel */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left - History Table */}
        <div 
          className="col-span-8 bg-white rounded-[20px] p-6"
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
              시각
            </div>
            <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              이벤트
            </div>
            <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              대상
            </div>
            <div className="col-span-3" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              요약
            </div>
            <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              사용자
            </div>
          </div>

          {/* Table Rows */}
          <div className="space-y-1" style={{ maxHeight: '600px', overflowY: 'auto' }}>
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
                  <div className="col-span-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--aifix-navy)' }}>
                      {event.timestamp}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div className="flex items-center gap-1.5">
                      {getEventIcon(event.eventType)}
                      <span 
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ 
                          backgroundColor: typeColor.bg,
                          color: typeColor.text,
                          fontWeight: 600
                        }}
                      >
                        {getEventTypeName(event.eventType)}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--aifix-navy)' }}>
                        {event.target}
                      </div>
                      {event.targetTier !== "-" && (
                        <div style={{ fontSize: '11px', color: 'var(--aifix-gray)' }}>
                          {event.targetTier}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                      {event.summary}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" style={{ color: 'var(--aifix-gray)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--aifix-navy)' }}>
                        {event.user}
                      </span>
                    </div>
                    {event.version && (
                      <span 
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ 
                          backgroundColor: 'var(--aifix-secondary-light)',
                          color: 'var(--aifix-primary)',
                          fontWeight: 600
                        }}
                      >
                        {event.version}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right - Detail Panel */}
        <div 
          className="col-span-4 bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          {selectedEvent ? (
            <div>
              <h3 className="text-lg mb-6" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                이벤트 상세
              </h3>

              {/* Event Info */}
              <div className="mb-6">
                <div 
                  className="p-4 rounded-lg mb-4"
                  style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {getEventIcon(selectedEvent.eventType)}
                    <span 
                      className="px-2 py-1 rounded text-sm"
                      style={{ 
                        backgroundColor: getEventTypeColor(selectedEvent.eventType).bg,
                        color: getEventTypeColor(selectedEvent.eventType).text,
                        fontWeight: 600
                      }}
                    >
                      {getEventTypeName(selectedEvent.eventType)}
                    </span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--aifix-navy)', marginBottom: '8px' }}>
                    {selectedEvent.summary}
                  </div>
                  <div className="flex items-center gap-2" style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                    <Clock className="w-3 h-3" />
                    {selectedEvent.timestamp}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--aifix-gray)' }}>대상</span>
                    <span style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {selectedEvent.target}
                    </span>
                  </div>
                  {selectedEvent.targetTier !== "-" && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--aifix-gray)' }}>차수</span>
                      <span 
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ 
                          backgroundColor: 'var(--aifix-secondary-light)',
                          color: 'var(--aifix-secondary)',
                          fontWeight: 600
                        }}
                      >
                        {selectedEvent.targetTier}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--aifix-gray)' }}>사용자</span>
                    <span style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {selectedEvent.user}
                    </span>
                  </div>
                  {selectedEvent.version && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--aifix-gray)' }}>버전</span>
                      <span style={{ fontWeight: 600, color: 'var(--aifix-primary)' }}>
                        {selectedEvent.version}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Change Details */}
              {selectedEvent.eventType === "edit" && (
                <div className="mb-6">
                  <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    변경 내용
                  </h4>
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <div className="space-y-2 text-sm">
                      <div>
                        <span style={{ color: 'var(--aifix-gray)' }}>변경 항목:</span>
                        <span style={{ fontWeight: 600, color: 'var(--aifix-navy)', marginLeft: '8px' }}>
                          에너지 사용량
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--aifix-gray)' }}>변경 전:</span>
                        <span style={{ marginLeft: '8px', color: '#F44336', textDecoration: 'line-through' }}>
                          1,200 kWh
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--aifix-gray)' }}>변경 후:</span>
                        <span style={{ marginLeft: '8px', color: '#4CAF50', fontWeight: 600 }}>
                          1,250 kWh
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Links */}
              <div className="mb-6">
                <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  관련 링크
                </h4>
                <div className="space-y-2">
                  <button
                    className="w-full flex items-center justify-between p-3 rounded-lg transition-all hover:bg-gray-50"
                    style={{ border: '1px solid #E0E0E0' }}
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--aifix-navy)' }}>
                        데이터 조회에서 보기
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                  </button>

                  {selectedEvent.eventType === "edit" && (
                    <button
                      className="w-full flex items-center justify-between p-3 rounded-lg transition-all hover:bg-gray-50"
                      style={{ border: '1px solid #E0E0E0' }}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                        <span style={{ fontSize: '13px', color: 'var(--aifix-navy)' }}>
                          공급망 관리에서 보기
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                    </button>
                  )}

                  {selectedEvent.eventType === "calculation" && (
                    <button
                      className="w-full flex items-center justify-between p-3 rounded-lg transition-all hover:bg-gray-50"
                      style={{ border: '1px solid #E0E0E0' }}
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                        <span style={{ fontSize: '13px', color: 'var(--aifix-navy)' }}>
                          PCF 산정·전송에서 보기
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Comment/Reason (for requests) */}
              {selectedEvent.eventType === "request" && (
                <div>
                  <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    요청 사유
                  </h4>
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: '#FFF4E6', border: '1px solid #FF9800' }}
                  >
                    <p style={{ fontSize: '13px', color: 'var(--aifix-gray)', lineHeight: 1.6 }}>
                      배출계수 선택 항목이 누락되어 있습니다. 
                      적합한 배출계수를 선택하여 데이터를 다시 제출해 주시기 바랍니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <FileText 
                className="w-12 h-12 mb-4" 
                style={{ color: 'var(--aifix-gray)', opacity: 0.5 }} 
              />
              <p style={{ color: 'var(--aifix-gray)', fontSize: '14px' }}>
                이력 행을 선택하면<br />상세 정보가 표시됩니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

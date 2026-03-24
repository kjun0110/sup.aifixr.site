'use client';

import { useState } from "react";
import { 
  Search,
  Filter,
  Building2,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  Send,
  Calendar,
  User
} from "lucide-react";

type SupplierNode = {
  id: string;
  name: string;
  tier: string;
  status: "submitted" | "pending" | "requested";
  lastSubmitted: string;
  isCurrentUser?: boolean;
  children?: SupplierNode[];
};

type RequestModalType = "edit" | "supplement" | null;

export function NonTier1SupplyChainView({ tier }: { tier: "tier2" | "tier3" }) {
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["current", "s1", "s2", "s3", "s4"]));
  const [requestModal, setRequestModal] = useState<RequestModalType>(null);

  const tierName = tier === "tier2" ? "2차" : "3차";
  const hasDownstream = tier === "tier2";

  // Supply chain tree structure
  const supplyChainTree: SupplierNode = {
    id: "upper",
    name: tier === "tier2" ? "원청사 A (상위)" : "동우전자부품 (상위 1차)",
    tier: tier === "tier2" ? "원청" : "1차",
    status: "submitted",
    lastSubmitted: "-",
    children: [
      {
        id: "current",
        name: "우리회사",
        tier: tierName,
        status: "submitted",
        lastSubmitted: "2026-03-04",
        isCurrentUser: true,
        children: hasDownstream ? [
          {
            id: "s1",
            name: "세진케미칼",
            tier: "3차",
            status: "submitted",
            lastSubmitted: "2026-03-04"
          },
          {
            id: "s2",
            name: "그린에너지솔루션",
            tier: "3차",
            status: "pending",
            lastSubmitted: "-"
          },
          {
            id: "s3",
            name: "한빛소재",
            tier: "3차",
            status: "submitted",
            lastSubmitted: "2026-03-03"
          },
          {
            id: "s4",
            name: "대한정밀화학",
            tier: "3차",
            status: "requested",
            lastSubmitted: "2026-03-01"
          }
        ] : []
      }
    ]
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted": return <CheckCircle className="w-4 h-4" style={{ color: "#4CAF50" }} />;
      case "pending": return <Clock className="w-4 h-4" style={{ color: "#FF9800" }} />;
      case "requested": return <AlertCircle className="w-4 h-4" style={{ color: "#2196F3" }} />;
      default: return <XCircle className="w-4 h-4" style={{ color: "#F44336" }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return { bg: "#E8F5E9", text: "#4CAF50" };
      case "pending": return { bg: "#FFF4E6", text: "#FF9800" };
      case "requested": return { bg: "#E3F2FD", text: "#2196F3" };
      default: return { bg: "#FFEBEE", text: "#F44336" };
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

  const renderTreeNode = (node: SupplierNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedSupplier?.id === node.id;

    return (
      <div key={node.id}>
        <div
          onClick={() => setSelectedSupplier(node)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
          style={{
            marginLeft: `${level * 24}px`,
            backgroundColor: isSelected ? 'var(--aifix-secondary-light)' : node.isCurrentUser ? '#FFF9E6' : 'transparent',
            border: node.isCurrentUser ? '2px solid var(--aifix-primary)' : 'none'
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
              ) : (
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          
          {getStatusIcon(node.status)}
          
          <Building2 className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--aifix-navy)' }}>
                {node.name}
              </span>
              {!node.isCurrentUser && (
                <span 
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ 
                    backgroundColor: 'var(--aifix-secondary-light)',
                    color: 'var(--aifix-secondary)',
                    fontWeight: 600
                  }}
                >
                  {node.tier}
                </span>
              )}
              {node.isCurrentUser && (
                <span 
                  className="px-2 py-0.5 rounded text-xs"
                  style={{ 
                    backgroundColor: 'var(--aifix-primary)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  현재 사용자
                </span>
              )}
            </div>
          </div>
          
          <span style={{ fontSize: '11px', color: 'var(--aifix-gray)' }}>
            {node.lastSubmitted}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pt-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          공급망 조회
        </h2>
        <p style={{ color: 'var(--aifix-gray)' }}>
          {hasDownstream 
            ? "하위 공급망 구조와 데이터 제출 상태를 조회합니다" 
            : "공급망 구조를 조회합니다"}
        </p>
      </div>

      {/* Filter Bar */}
      <div 
        className="bg-white rounded-[20px] p-6 mb-6"
        style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
            공급망 필터
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

        <div className="grid grid-cols-4 gap-4 mb-4">
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
              납품 항목
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option>전체</option>
              <option>화학 첨가제</option>
              <option>친환경 용제</option>
              <option>기초 원료</option>
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
            placeholder="업체명 검색"
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm"
            style={{ outline: 'none' }}
          />
        </div>
      </div>

      {/* Main Layout: Tree + Detail Panel */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left - Supply Chain Tree */}
        <div 
          className="col-span-5 bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <h3 className="text-lg mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            공급망 구조
          </h3>

          <div className="space-y-1">
            {renderTreeNode(supplyChainTree)}
          </div>

          {!hasDownstream && (
            <div 
              className="mt-6 p-4 rounded-lg"
              style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
            >
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--aifix-primary)' }} />
                <p style={{ fontSize: '12px', color: 'var(--aifix-gray)', lineHeight: 1.5 }}>
                  <strong>{tierName} 협력사:</strong> 하위 공급망이 없습니다. 
                  자사 데이터를 입력하고 상위차사에 제출합니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right - Supplier Detail Panel */}
        <div 
          className="col-span-7 bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          {selectedSupplier ? (
            <div>
              <h3 className="text-lg mb-6" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                업체 상세 정보
              </h3>

              {/* Section 1: 업체 기본 정보 */}
              <div className="mb-6">
                <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  업체 기본 정보
                </h4>
                <div 
                  className="p-4 rounded-lg space-y-3"
                  style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>업체명</span>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                        {selectedSupplier.name}
                      </span>
                      {selectedSupplier.isCurrentUser && (
                        <span 
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ 
                            backgroundColor: 'var(--aifix-primary)',
                            color: 'white',
                            fontWeight: 600
                          }}
                        >
                          현재 사용자
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>차수</span>
                    <span 
                      className="px-2 py-1 rounded text-sm"
                      style={{ 
                        backgroundColor: 'var(--aifix-secondary)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    >
                      {selectedSupplier.tier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>납품 항목</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {selectedSupplier.id === "s1" ? "화학 첨가제" 
                        : selectedSupplier.id === "s2" ? "친환경 용제"
                        : selectedSupplier.id === "s3" ? "기초 원료"
                        : selectedSupplier.id === "s4" ? "특수 코팅제"
                        : "배터리 소재"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>계약번호</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      CT-2026-{selectedSupplier.id === "current" ? "002" : `10${selectedSupplier.id.charAt(selectedSupplier.id.length - 1)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: 데이터 제출 상태 */}
              <div className="mb-6">
                <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  데이터 제출 상태
                </h4>
                <div className="space-y-3">
                  <div 
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>제출 여부</span>
                    <span 
                      className="px-3 py-1 rounded text-sm"
                      style={{ 
                        backgroundColor: getStatusColor(selectedSupplier.status).bg,
                        color: getStatusColor(selectedSupplier.status).text,
                        fontWeight: 600
                      }}
                    >
                      {getStatusText(selectedSupplier.status)}
                    </span>
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>최근 제출일</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" style={{ color: 'var(--aifix-gray)' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                        {selectedSupplier.lastSubmitted}
                      </span>
                    </div>
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>데이터 버전</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-primary)' }}>
                      {selectedSupplier.status === "submitted" ? "v2.3" : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: 요청 이력 */}
              {!selectedSupplier.isCurrentUser && selectedSupplier.tier !== "원청" && selectedSupplier.tier !== "1차" && (
                <div className="mb-6">
                  <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    요청 이력
                  </h4>
                  <div 
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: '#E3F2FD', border: '1px solid #2196F3' }}
                  >
                    {selectedSupplier.status === "requested" ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4" style={{ color: '#2196F3' }} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#2196F3' }}>
                            보완요청 발송됨
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#2196F3', marginBottom: '8px' }}>
                          최근 요청: 2026-03-02 14:30
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--aifix-gray)', lineHeight: 1.5 }}>
                          "특수 코팅제 투입량 데이터를 확인해 주시기 바랍니다."
                        </div>
                      </div>
                    ) : selectedSupplier.status === "pending" ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4" style={{ color: '#FF9800' }} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#FF9800' }}>
                            수정요청 발송됨
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#FF9800', marginBottom: '8px' }}>
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
              )}

              {/* Action Buttons */}
              {!selectedSupplier.isCurrentUser && selectedSupplier.tier !== "원청" && selectedSupplier.tier !== "1차" && hasDownstream && (
                <div className="space-y-3">
                  <button
                    onClick={() => setRequestModal("edit")}
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
                        <strong>{tierName} 협력사 권한:</strong> 하위 업체 데이터를 직접 수정할 수 없습니다. 
                        수정요청 또는 보완요청만 가능합니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedSupplier.isCurrentUser && (
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: '#FFF9E6', border: '2px solid var(--aifix-primary)' }}
                >
                  <div className="flex gap-2">
                    <User className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--aifix-primary)' }} />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)', marginBottom: '4px' }}>
                        현재 로그인한 사용자
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--aifix-gray)', lineHeight: 1.5 }}>
                        자사 데이터는 '데이터 관리' 탭에서 입력 및 수정할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Building2 
                className="w-12 h-12 mb-4" 
                style={{ color: 'var(--aifix-gray)', opacity: 0.5 }} 
              />
              <p style={{ color: 'var(--aifix-gray)', fontSize: '14px' }}>
                공급망 트리에서 업체를 선택하면<br />상세 정보가 표시됩니다
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Request Modal */}
      {requestModal && (
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
                  {selectedSupplier?.name}
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
    </div>
  );
}

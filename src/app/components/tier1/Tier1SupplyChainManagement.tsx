'use client';

import { useState } from "react";
import { 
  Search, 
  ChevronRight, 
  ChevronDown,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Eye,
  Calendar,
  User,
  Package,
  FileText,
  UserPlus,
  Upload,
  X,
  Mail,
  Paperclip
} from "lucide-react";
import { SupplierInviteModal } from "../shared/SupplierInviteModal";

type CompanyNode = {
  id: string;
  name: string;
  tier: "tier1" | "tier2" | "tier3" | "tier4";
  status: "submitted" | "pending" | "revision" | "failed";
  parentId?: string;
  children?: CompanyNode[];
};

type Company = {
  id: string;
  name: string;
  tier: string;
  status: string;
  lastSubmit: string;
  dueDate: string;
  daysLeft: number;
  revisionRequested: boolean;
  inviteDate?: string;
  lastActivity?: string;
  connectionStatus?: "invited" | "contract_signed" | "registered" | "pending_approval" | "connected";
};

export function Tier1SupplyChainManagement() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root", "tier2-1", "tier2-2", "tier3-1"]));;
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Mock tree data
  const treeData: CompanyNode = {
    id: "root",
    name: "우리회사",
    tier: "tier1",
    status: "submitted",
    children: [
      {
        id: "tier2-1",
        name: "동우전자부품",
        tier: "tier2",
        status: "pending",
        parentId: "root",
        children: [
          { 
            id: "tier3-1", 
            name: "세진케미칼", 
            tier: "tier3", 
            status: "revision", 
            parentId: "tier2-1",
            children: [
              { id: "tier4-1", name: "디오케미칼", tier: "tier4", status: "pending", parentId: "tier3-1" },
              { id: "tier4-2", name: "솔브런트", tier: "tier4", status: "submitted", parentId: "tier3-1" }
            ]
          },
          { id: "tier3-2", name: "그린에너지솔루션", tier: "tier3", status: "pending", parentId: "tier2-1" },
        ]
      },
      {
        id: "tier2-2",
        name: "한국소재산업",
        tier: "tier2",
        status: "failed",
        parentId: "root",
        children: [
          { id: "tier3-3", name: "글로벌메탈", tier: "tier3", status: "submitted", parentId: "tier2-2" },
          { id: "tier3-4", name: "에코플라스틱", tier: "tier3", status: "submitted", parentId: "tier2-2" },
          { id: "tier3-5", name: "바이오소재연구소", tier: "tier3", status: "pending", parentId: "tier2-2" },
        ]
      },
      {
        id: "tier2-3",
        name: "테크놀로지파트너스",
        tier: "tier2",
        status: "submitted",
        parentId: "root",
      },
    ]
  };

  // Mock company list data
  const allCompanies: Company[] = [
    { 
      id: "tier2-1", 
      name: "동우전자부품", 
      tier: "2차", 
      status: "미제출", 
      lastSubmit: "2026-02-15",
      dueDate: "2026-03-10",
      daysLeft: 6,
      revisionRequested: false
    },
    { 
      id: "tier2-2", 
      name: "한국소재산업", 
      tier: "2차", 
      status: "검증실패", 
      lastSubmit: "2026-03-02",
      dueDate: "2026-03-10",
      daysLeft: 6,
      revisionRequested: false
    },
    { 
      id: "tier2-3", 
      name: "테크놀로지파트너스", 
      tier: "2차", 
      status: "제출완료", 
      lastSubmit: "2026-03-03",
      dueDate: "2026-03-10",
      daysLeft: 6,
      revisionRequested: false
    },
    { 
      id: "tier3-1", 
      name: "세진케미칼", 
      tier: "3차", 
      status: "보완필요", 
      lastSubmit: "2026-03-01",
      dueDate: "2026-03-10",
      daysLeft: 6,
      revisionRequested: true
    },
    { 
      id: "tier3-2", 
      name: "그린에너지솔루션", 
      tier: "3차", 
      status: "미제출", 
      lastSubmit: "-",
      dueDate: "2026-03-10",
      daysLeft: 6,
      revisionRequested: false
    },
    { 
      id: "tier3-3", 
      name: "글로벌메탈", 
      tier: "3차", 
      status: "제출완료", 
      lastSubmit: "2026-02-28",
      dueDate: "2026-03-10",
      daysLeft: 6,
      revisionRequested: false
    },
    { 
      id: "tier3-4", 
      name: "에코플라스틱", 
      tier: "3차", 
      status: "제출완료", 
      lastSubmit: "2026-03-01",
      dueDate: "2026-03-10",
      daysLeft: 6,
      revisionRequested: false
    },
    { 
      id: "tier3-5", 
      name: "바이오소재연구소", 
      tier: "3차", 
      status: "미제출", 
      lastSubmit: "-",
      dueDate: "2026-03-10",
      daysLeft: 6,
      revisionRequested: false
    },
    { 
      id: "tier4-1", 
      name: "디오케미칼", 
      tier: "4차", 
      status: "미제출", 
      lastSubmit: "-",
      dueDate: "2026-03-10",
      daysLeft: 6,
      revisionRequested: false
    },
    { 
      id: "tier4-2", 
      name: "솔브런트", 
      tier: "4차", 
      status: "제출완료", 
      lastSubmit: "2026-03-02",
      dueDate: "2026-03-10",
      daysLeft: 6,
      revisionRequested: false
    },
  ];

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
      case "revision": return <AlertCircle className="w-4 h-4" style={{ color: "#F44336" }} />;
      case "failed": return <XCircle className="w-4 h-4" style={{ color: "#F44336" }} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "제출완료": return { bg: "#E8F5E9", text: "#4CAF50" };
      case "미제출": return { bg: "#FFF4E6", text: "#FF9800" };
      case "보완필요": return { bg: "#FFEBEE", text: "#F44336" };
      case "검증실패": return { bg: "#FFEBEE", text: "#F44336" };
      default: return { bg: "#E9F5FF", text: "#00B4FF" };
    }
  };

  const renderTreeNode = (node: CompanyNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all hover:bg-gray-100"
          style={{
            paddingLeft: `${depth * 24 + 12}px`,
            backgroundColor: isSelected ? 'var(--aifix-secondary-light)' : 'transparent',
          }}
          onClick={() => {
            setSelectedNode(node.id);
            if (hasChildren) toggleNode(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
            ) : (
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
          
          <Building2 
            className="w-4 h-4" 
            style={{ 
              color: node.tier === "tier1" ? '#1A439C' : node.tier === "tier2" ? '#00A3B5' : node.tier === "tier4" ? '#9C27B0' : '#6B23C0' 
            }} 
          />
          
          <span 
            style={{ 
              fontSize: '14px', 
              fontWeight: node.tier === "tier1" ? 700 : 500,
              color: 'var(--aifix-navy)',
              flex: 1
            }}
          >
            {node.name}
          </span>
          
          {getStatusIcon(node.status)}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredCompanies = allCompanies.filter(company => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return company.status === "미제출";
    if (activeFilter === "revision") return company.status === "보완필요";
    if (activeFilter === "failed") return company.status === "검증실패";
    return true;
  });

  return (
    <div className="pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            공급망 관리
          </h2>
          <p style={{ color: 'var(--aifix-gray)' }}>
            하위 공급망 구조를 확인하고 협력사 데이터를 관리합니다
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105"
          style={{
            background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
            boxShadow: '0px 4px 12px rgba(91, 59, 250, 0.2)',
            color: 'white',
            fontWeight: 600,
          }}
        >
          <UserPlus className="w-5 h-5" />
          하위 협력사 초대
        </button>
      </div>

      {/* 3 Column Layout */}
      <div className="grid grid-cols-12 gap-6" style={{ minHeight: '600px' }}>
        {/* Left Sidebar - Company Tree */}
        <div 
          className="col-span-3 bg-white rounded-[20px] p-6 overflow-y-auto"
          style={{ 
            boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)",
            maxHeight: '800px'
          }}
        >
          <div className="mb-4">
            <h3 className="text-lg mb-3" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              공급망 트리
            </h3>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                style={{ color: 'var(--aifix-gray)' }} 
              />
              <input
                type="text"
                placeholder="업체명 검색"
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 text-sm"
                style={{ outline: 'none' }}
              />
            </div>

            {/* Tree Controls */}
            <div className="flex gap-2 mb-4">
              <button
                className="flex-1 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  border: '1px solid var(--aifix-primary)',
                  color: 'var(--aifix-primary)',
                  fontWeight: 600
                }}
                onClick={() => setExpandedNodes(new Set(["root", "tier2-1", "tier2-2", "tier2-3"]))}
              >
                모두 펼치기
              </button>
              <button
                className="flex-1 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  border: '1px solid var(--aifix-gray)',
                  color: 'var(--aifix-gray)',
                  fontWeight: 600
                }}
                onClick={() => setExpandedNodes(new Set(["root"]))}
              >
                모두 접기
              </button>
            </div>
          </div>

          {/* Tree */}
          <div className="space-y-1">
            {renderTreeNode(treeData)}
          </div>
        </div>

        {/* Center - Company List */}
        <div 
          className="col-span-6 bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                협력사 목록
              </h3>
              {selectedNode && (
                <div 
                  className="px-3 py-1 rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--aifix-secondary-light)', color: 'var(--aifix-primary)' }}
                >
                  필터: 선택된 노드
                </div>
              )}
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex gap-2">
              {[
                { id: "all", label: "전체", count: allCompanies.length },
                { id: "pending", label: "미제출", count: allCompanies.filter(c => c.status === "미제출").length },
                { id: "revision", label: "보완필요", count: allCompanies.filter(c => c.status === "보완필요").length },
                { id: "failed", label: "검증실패", count: allCompanies.filter(c => c.status === "검증실패").length },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className="px-4 py-2 rounded-lg transition-all text-sm"
                  style={{
                    backgroundColor: activeFilter === filter.id ? 'var(--aifix-primary)' : 'white',
                    color: activeFilter === filter.id ? 'white' : 'var(--aifix-navy)',
                    border: activeFilter === filter.id ? 'none' : '1px solid #E0E0E0',
                    fontWeight: 600
                  }}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          {/* Table Header */}
          <div 
            className="grid grid-cols-12 gap-3 px-4 py-3 mb-2 rounded-lg"
            style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
          >
            <div className="col-span-3" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              업체명
            </div>
            <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              상태
            </div>
            <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              최근 제출일
            </div>
            <div className="col-span-3" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              마감
            </div>
          </div>

          {/* Table Rows */}
          <div className="space-y-1" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredCompanies.map((company) => {
              const statusColor = getStatusColor(company.status);
              return (
                <div
                  key={company.id}
                  className="grid grid-cols-12 gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                  onClick={() => setSelectedCompany(company)}
                  style={{
                    backgroundColor: selectedCompany?.id === company.id ? 'var(--aifix-secondary-light)' : 'transparent'
                  }}
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--aifix-navy)' }}>
                      {company.name}
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
                      {company.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                      {company.lastSubmit}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span 
                      className="text-xs font-semibold"
                      style={{ color: company.daysLeft <= 7 ? '#F44336' : 'var(--aifix-navy)' }}
                    >
                      D-{company.daysLeft}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar - Detail Panel */}
        <div 
          className="col-span-3 bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          {selectedCompany ? (
            <div>
              <h3 className="text-lg mb-6" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                업체 상세
              </h3>

              {/* Company Summary */}
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--aifix-secondary-light)' }}>
                <div className="flex items-start gap-3 mb-3">
                  <Building2 className="w-5 h-5 mt-0.5" style={{ color: 'var(--aifix-primary)' }} />
                  <div className="flex-1">
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                      {selectedCompany.name}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--aifix-gray)' }}>상태</span>
                    <span 
                      className="px-2 py-0.5 rounded"
                      style={{ 
                        backgroundColor: getStatusColor(selectedCompany.status).bg,
                        color: getStatusColor(selectedCompany.status).text,
                        fontWeight: 600,
                        fontSize: '12px'
                      }}
                    >
                      {selectedCompany.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--aifix-gray)' }}>최근 제출일</span>
                    <span style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {selectedCompany.lastSubmit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--aifix-gray)' }}>마감일</span>
                    <span style={{ fontWeight: 600, color: '#F44336' }}>
                      D-{selectedCompany.daysLeft}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini Timeline */}
              <div className="mb-6">
                <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  최근 이력
                </h4>
                <div className="space-y-3">
                  {[
                    { date: "2026-03-03", event: "데이터 제출", type: "submit" },
                    { date: "2026-03-01", event: "보완요청 발송", type: "revision" },
                    { date: "2026-02-28", event: "검증 실패", type: "failed" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div 
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ 
                          backgroundColor: item.type === "submit" ? "#4CAF50" : 
                                         item.type === "revision" ? "#FF9800" : "#F44336" 
                        }}
                      />
                      <div className="flex-1">
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                          {item.event}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--aifix-gray)' }}>
                          {item.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  className="w-full mt-3 py-2 text-xs rounded-lg transition-all"
                  style={{
                    border: '1px solid var(--aifix-primary)',
                    color: 'var(--aifix-primary)',
                    fontWeight: 600
                  }}
                >
                  전체 이력 보기
                </button>
              </div>

              {/* Action Buttons (1차 전용) */}
              <div className="space-y-3">
                <h4 className="text-sm mb-2" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  주요 액션
                </h4>

                <button
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all hover:scale-[1.02]"
                  style={{
                    border: '2px solid var(--aifix-primary)',
                    color: 'var(--aifix-primary)',
                    fontWeight: 600
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">데이터 보기</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>

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
                  <ChevronRight className="w-4 h-4" />
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
                    <strong>직접 수정 불가:</strong> 하위 협력사의 데이터를 직접 수정할 수 없으며 수정 요청/보완 요청만 가능합니다.
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
                협력사를 선택하면<br />상세 정보가 표시됩니다
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <SupplierInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}
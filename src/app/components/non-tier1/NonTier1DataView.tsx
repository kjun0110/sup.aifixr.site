'use client';

import { useState } from "react";
import { 
  ChevronRight, 
  ChevronDown,
  Building2,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Calendar,
  TrendingUp,
  BarChart3,
  Zap,
  Globe,
  Package,
  MessageSquare,
  Send,
  X
} from "lucide-react";
import { QuarterPicker } from "../shared/QuarterPicker";

type SupplyChainNode = {
  id: string;
  name: string;
  tier: "tier2" | "tier3";
  country: string;
  companyType: string;
  dataStatus: "submitted" | "pending" | "incomplete" | "saved";
  lastUpdate: string;
  dqr: number;
  pcfValue?: number;
  pcfStatus: "complete" | "partial" | "none";
  isOwnData: boolean;
  children?: SupplyChainNode[];
};

type CompanyDetail = {
  id: string;
  name: string;
  tier: string;
  country: string;
  companyType: string;
  dataStatus: string;
  lastUpdate: string;
  dqr: number;
  pcfValue?: number;
  pcfStatus: string;
  isOwnData: boolean;
  energyData: { type: string; value: string; unit: string }[];
  fuelData: { type: string; value: string; unit: string }[];
  processData: { type: string; value: string; unit: string }[];
  wasteData: { type: string; value: string; unit: string }[];
};

type RequestModalType = "edit" | "supplement" | null;

export function NonTier1DataView({ tier }: { tier: "tier2" | "tier3" }) {
  const [selectedPeriod, setSelectedPeriod] = useState("2026년 Q1");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root"]));
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetail | null>(null);
  const [requestModal, setRequestModal] = useState<RequestModalType>(null);
  const [requestMessage, setRequestMessage] = useState("");

  const tierName = tier === "tier2" ? "2차" : "3차";
  const hasDownstream = tier === "tier2";

  // Mock supply chain tree data
  const supplyChainTree: SupplyChainNode = tier === "tier2" ? {
    id: "root",
    name: `우리회사 (${tierName})`,
    tier: "tier2",
    country: "대한민국",
    companyType: "전자부품",
    dataStatus: "saved",
    lastUpdate: "2026-03-04",
    dqr: 88,
    pcfValue: 456.2,
    pcfStatus: "complete",
    isOwnData: true,
    children: [
      {
        id: "tier3-1",
        name: "세진케미칼",
        tier: "tier3",
        country: "대한민국",
        companyType: "화학소재",
        dataStatus: "incomplete",
        lastUpdate: "2026-03-01",
        dqr: 72,
        pcfValue: 123.4,
        pcfStatus: "partial",
        isOwnData: false
      },
      {
        id: "tier3-2",
        name: "그린에너지솔루션",
        tier: "tier3",
        country: "대한민국",
        companyType: "에너지",
        dataStatus: "pending",
        lastUpdate: "2026-02-28",
        dqr: 0,
        pcfStatus: "none",
        isOwnData: false
      }
    ]
  } : {
    id: "root",
    name: `우리회사 (${tierName})`,
    tier: "tier3",
    country: "대한민국",
    companyType: "화학소재",
    dataStatus: "saved",
    lastUpdate: "2026-03-04",
    dqr: 85,
    pcfValue: 234.5,
    pcfStatus: "complete",
    isOwnData: true
  };

  // Mock detailed data
  const companyDetails: { [key: string]: CompanyDetail } = {
    "root": {
      id: "root",
      name: `우리회사 (${tierName})`,
      tier: tierName,
      country: "대한민국",
      companyType: tier === "tier2" ? "전자부품" : "화학소재",
      dataStatus: "저장됨",
      lastUpdate: "2026-03-04 15:24",
      dqr: tier === "tier2" ? 88 : 85,
      pcfValue: tier === "tier2" ? 456.2 : 234.5,
      pcfStatus: "완료",
      isOwnData: true,
      energyData: [
        { type: "전력 사용량", value: "850", unit: "kWh" },
        { type: "재생에너지", value: "200", unit: "kWh" }
      ],
      fuelData: [
        { type: "경유", value: "80", unit: "L" }
      ],
      processData: [
        { type: "부품 제조", value: "500", unit: "units" }
      ],
      wasteData: [
        { type: "산업 폐기물", value: "30", unit: "kg" }
      ]
    },
    "tier3-1": {
      id: "tier3-1",
      name: "세진케미칼",
      tier: "3차",
      country: "대한민국",
      companyType: "화학소재",
      dataStatus: "불완전",
      lastUpdate: "2026-03-01 10:15",
      dqr: 72,
      pcfValue: 123.4,
      pcfStatus: "부분완료",
      isOwnData: false,
      energyData: [
        { type: "전력 사용량", value: "450", unit: "kWh" }
      ],
      fuelData: [
        { type: "LNG", value: "300", unit: "m³" }
      ],
      processData: [
        { type: "화학 공정", value: "200", unit: "units" }
      ],
      wasteData: [
        { type: "화학 폐기물", value: "15", unit: "kg" }
      ]
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return { bg: "#E8F5E9", text: "#4CAF50", icon: CheckCircle };
      case "saved":
        return { bg: "#E9F5FF", text: "#00B4FF", icon: CheckCircle };
      case "pending":
        return { bg: "#FFF4E6", text: "#FF9800", icon: Clock };
      case "incomplete":
        return { bg: "#FFEBEE", text: "#F44336", icon: AlertCircle };
      default:
        return { bg: "#E9F5FF", text: "#00B4FF", icon: CheckCircle };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "submitted": return "제출완료";
      case "saved": return "저장됨";
      case "pending": return "미제출";
      case "incomplete": return "불완전";
      default: return status;
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "tier2": return "2차";
      case "tier3": return "3차";
      default: return tier;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "tier2": return "#00A3B5";
      case "tier3": return "#6B23C0";
      default: return "#00A3B5";
    }
  };

  const renderTreeNode = (node: SupplyChainNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const statusColor = getStatusColor(node.dataStatus);
    const StatusIcon = statusColor.icon;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-3 py-3 px-4 rounded-lg transition-all hover:bg-gray-50"
          style={{
            paddingLeft: `${depth * 32 + 16}px`,
            borderLeft: depth > 0 ? '2px solid var(--aifix-secondary-light)' : 'none',
            marginLeft: depth > 0 ? '20px' : '0'
          }}
        >
          {/* Toggle Icon */}
          <div 
            className="cursor-pointer flex-shrink-0"
            onClick={() => hasChildren && toggleNode(node.id)}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-5 h-5" style={{ color: 'var(--aifix-gray)' }} />
              ) : (
                <ChevronRight className="w-5 h-5" style={{ color: 'var(--aifix-gray)' }} />
              )
            ) : (
              <div className="w-5 h-5" />
            )}
          </div>

          {/* Company Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Building2 
              className="w-5 h-5 flex-shrink-0" 
              style={{ color: getTierColor(node.tier) }} 
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span 
                  style={{ 
                    fontSize: '14px', 
                    fontWeight: node.isOwnData ? 700 : 600,
                    color: 'var(--aifix-navy)'
                  }}
                >
                  {node.name}
                </span>
                <span 
                  className="px-2 py-0.5 rounded text-xs"
                  style={{ 
                    backgroundColor: getTierColor(node.tier) + '20',
                    color: getTierColor(node.tier),
                    fontWeight: 600
                  }}
                >
                  {getTierLabel(node.tier)}
                </span>
                {node.isOwnData && (
                  <span 
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ 
                      backgroundColor: 'var(--aifix-primary)',
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    자사
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Country */}
          <div className="flex items-center gap-2 w-28 flex-shrink-0">
            <Globe className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
            <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
              {node.country}
            </span>
          </div>

          {/* Company Type */}
          <div className="flex items-center gap-2 w-32 flex-shrink-0">
            <Package className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
            <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
              {node.companyType}
            </span>
          </div>

          {/* Data Status */}
          <div className="w-24 flex-shrink-0">
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg"
              style={{ 
                backgroundColor: statusColor.bg,
                fontSize: '12px',
                fontWeight: 600,
                color: statusColor.text
              }}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {getStatusLabel(node.dataStatus)}
            </div>
          </div>

          {/* Last Update */}
          <div className="flex items-center gap-2 w-28 flex-shrink-0">
            <Calendar className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
            <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
              {node.lastUpdate}
            </span>
          </div>

          {/* DQR */}
          <div className="w-20 flex-shrink-0 text-center">
            <span 
              style={{ 
                fontSize: '14px', 
                fontWeight: 700,
                color: node.dqr >= 90 ? '#4CAF50' : node.dqr >= 70 ? '#FF9800' : '#F44336'
              }}
            >
              {node.dqr > 0 ? `${node.dqr}%` : '-'}
            </span>
          </div>

          {/* PCF Status */}
          <div className="w-24 flex-shrink-0 text-center">
            <span 
              className="px-2 py-1 rounded text-xs"
              style={{ 
                backgroundColor: node.pcfStatus === 'complete' ? '#E8F5E9' : 
                                node.pcfStatus === 'partial' ? '#FFF4E6' : '#F5F5F5',
                color: node.pcfStatus === 'complete' ? '#4CAF50' : 
                       node.pcfStatus === 'partial' ? '#FF9800' : '#999',
                fontWeight: 600
              }}
            >
              {node.pcfStatus === 'complete' ? '완료' : 
               node.pcfStatus === 'partial' ? '부분' : '없음'}
            </span>
          </div>

          {/* Detail Button */}
          <button
            onClick={() => {
              const detail = companyDetails[node.id];
              if (detail) {
                setSelectedCompany(detail);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:scale-105 flex-shrink-0"
            style={{
              border: '1px solid var(--aifix-primary)',
              color: 'var(--aifix-primary)',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Eye className="w-4 h-4" />
            상세보기
          </button>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalPCF = (node: SupplyChainNode): number => {
    let sum = node.pcfValue || 0;
    if (node.children) {
      node.children.forEach(child => {
        sum += totalPCF(child);
      });
    }
    return sum;
  };

  const countByStatus = (node: SupplyChainNode, status: string): number => {
    let count = node.dataStatus === status ? 1 : 0;
    if (node.children) {
      node.children.forEach(child => {
        count += countByStatus(child, status);
      });
    }
    return count;
  };

  const totalSuppliers = (node: SupplyChainNode): number => {
    let count = 1;
    if (node.children) {
      node.children.forEach(child => {
        count += totalSuppliers(child);
      });
    }
    return count;
  };

  const handleSendRequest = () => {
    console.log("Request sent:", requestModal, requestMessage);
    setRequestModal(null);
    setRequestMessage("");
  };

  return (
    <div className="pt-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          데이터 조회
        </h2>
        <p style={{ color: 'var(--aifix-gray)' }}>
          자사 및 하위 공급망의 PCF 데이터를 조회합니다
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div 
          className="bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              총 PCF
            </span>
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--aifix-secondary)' }} />
          </div>
          <div className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            {totalPCF(supplyChainTree).toFixed(1)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
            kg CO2e
          </div>
        </div>

        <div 
          className="bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>총 공급사</span>
            <BarChart3 className="w-5 h-5" style={{ color: 'var(--aifix-primary)' }} />
          </div>
          <div className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            {totalSuppliers(supplyChainTree)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
            개사
          </div>
        </div>

        <div 
          className="bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>데이터 제출</span>
            <CheckCircle className="w-5 h-5" style={{ color: '#4CAF50' }} />
          </div>
          <div className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            {countByStatus(supplyChainTree, "submitted") + countByStatus(supplyChainTree, "saved")}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
            / {totalSuppliers(supplyChainTree)} 개사
          </div>
        </div>

        <div 
          className="bg-white rounded-[20px] p-6"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>평균 DQR</span>
            <Zap className="w-5 h-5" style={{ color: 'var(--aifix-secondary)' }} />
          </div>
          <div className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            {tier === "tier2" ? "80%" : "85%"}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
            데이터 품질
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div 
        className="bg-white rounded-[20px] p-6 mb-6"
        style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
      >
        <h3 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
          조회 조건
        </h3>
        <div className="w-64">
          <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
            기간
          </label>
          <QuarterPicker 
            value={selectedPeriod}
            onChange={setSelectedPeriod}
          />
        </div>
      </div>

      {/* Supply Chain Tree */}
      <div 
        className="bg-white rounded-[20px] p-6"
        style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
      >
        <h3 className="text-lg mb-6" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          공급망 구조
        </h3>

            {/* Table Header */}
            <div 
              className="flex items-center gap-3 px-4 py-3 mb-4 rounded-lg"
              style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
            >
              <div className="w-5 flex-shrink-0" />
              <div className="flex-1" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                회사명
              </div>
              <div className="w-28 flex-shrink-0" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                국가
              </div>
              <div className="w-32 flex-shrink-0" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                회사 유형
              </div>
              <div className="w-24 flex-shrink-0" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                데이터 상태
              </div>
              <div className="w-28 flex-shrink-0" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                최근 업데이트
              </div>
              <div className="w-20 flex-shrink-0 text-center" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                DQR
              </div>
              <div className="w-24 flex-shrink-0 text-center" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                PCF 상태
              </div>
              <div className="w-20 flex-shrink-0" />
            </div>

        {/* Tree View */}
        <div>
          {renderTreeNode(supplyChainTree)}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCompany && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCompany(null)}
        >
          <div 
            className="bg-white rounded-[20px] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.15)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                상세 정보
              </h3>
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Company Info */}
            <div className="mb-6 p-6 rounded-lg" style={{ backgroundColor: 'var(--aifix-secondary-light)' }}>
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-7 h-7" style={{ color: 'var(--aifix-primary)' }} />
                <h4 className="text-xl" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                  {selectedCompany.name}
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '6px' }}>차수</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--aifix-navy)' }}>{selectedCompany.tier}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '6px' }}>국가</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--aifix-navy)' }}>{selectedCompany.country}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '6px' }}>회사 유형</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--aifix-navy)' }}>{selectedCompany.companyType}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '6px' }}>데이터 상태</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--aifix-navy)' }}>{selectedCompany.dataStatus}</div>
                </div>
              </div>
            </div>

            {/* PCF Info */}
            <div className="mb-6 p-6 rounded-lg" style={{ border: '2px solid var(--aifix-secondary-light)' }}>
              <h5 className="mb-4" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                PCF 정보
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                  <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '8px' }}>PCF 값</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--aifix-primary)' }}>
                    {selectedCompany.pcfValue ? `${selectedCompany.pcfValue}` : '-'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginTop: '4px' }}>kg CO2e</div>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                  <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '8px' }}>DQR</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#4CAF50' }}>
                    {selectedCompany.dqr}%
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginTop: '4px' }}>데이터 품질</div>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                  <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '8px' }}>최근 업데이트</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                    {selectedCompany.lastUpdate}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginTop: '4px' }}>마지막 제출</div>
                </div>
              </div>
            </div>

            {/* Request Buttons for Downstream Companies */}
            {!selectedCompany.isOwnData && (
              <div className="mb-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRequestModal("edit")}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all hover:scale-105"
                  style={{
                    border: '2px solid var(--aifix-primary)',
                    color: 'var(--aifix-primary)',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  수정 요청
                </button>
                </div>
              )}

            {/* Data Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Energy Data */}
              {selectedCompany.energyData.length > 0 && (
                <div>
                  <h5 className="mb-3" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                    에너지 데이터
                  </h5>
                  <div className="space-y-2">
                    {selectedCompany.energyData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                        <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>{item.type}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                          {item.value} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fuel Data */}
              {selectedCompany.fuelData.length > 0 && (
                <div>
                  <h5 className="mb-3" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                    연료 데이터
                  </h5>
                  <div className="space-y-2">
                    {selectedCompany.fuelData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                        <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>{item.type}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                          {item.value} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Process Data */}
              {selectedCompany.processData.length > 0 && (
                <div>
                  <h5 className="mb-3" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                    공정 데이터
                  </h5>
                  <div className="space-y-2">
                    {selectedCompany.processData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                        <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>{item.type}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                          {item.value} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Waste Data */}
              {selectedCompany.wasteData.length > 0 && (
                <div>
                  <h5 className="mb-3" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                    폐기물 데이터
                  </h5>
                  <div className="space-y-2">
                    {selectedCompany.wasteData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                        <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>{item.type}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                          {item.value} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {requestModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setRequestModal(null)}
        >
          <div 
            className="bg-white rounded-[20px] p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.15)" }}
          >
            <h3 className="text-xl mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              {requestModal === "edit" ? "수정 요청" : "보완 요청"}
            </h3>
            <p className="mb-4" style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              {requestModal === "edit" 
                ? "데이터 수정이 필요한 사항을 입력해주세요."
                : "데이터 보완이 필요한 사항을 입력해주세요."}
            </p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 mb-4"
              rows={5}
              placeholder="요청 내용을 입력하세요..."
              style={{ fontSize: '14px' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRequestModal(null)}
                className="flex-1 px-4 py-3 rounded-lg transition-all"
                style={{
                  border: '1px solid var(--aifix-gray)',
                  color: 'var(--aifix-gray)',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                취소
              </button>
              <button
                onClick={handleSendRequest}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                <Send className="w-4 h-4" />
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

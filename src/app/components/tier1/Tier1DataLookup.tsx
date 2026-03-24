'use client';

import { useState } from "react";
import { 
  ChevronRight, 
  ChevronDown,
  Building2,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Eye,
  Calendar,
  TrendingUp,
  BarChart3,
  Zap,
  Globe,
  Package,
  X
} from "lucide-react";
import { QuarterPicker } from "../shared/QuarterPicker";

type SupplyChainNode = {
  id: string;
  name: string;
  tier: "tier1" | "tier2" | "tier3";
  country: string;
  companyType: string;
  dataStatus: "submitted" | "pending" | "incomplete" | "validated";
  lastUpdate: string;
  dqr: number;
  pcfValue?: number;
  pcfStatus: "complete" | "partial" | "none";
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
  energyData: { type: string; value: string; unit: string }[];
  fuelData: { type: string; value: string; unit: string }[];
  processData: { type: string; value: string; unit: string }[];
  wasteData: { type: string; value: string; unit: string }[];
};

export function Tier1DataLookup() {
  const [selectedPeriod, setSelectedPeriod] = useState("2026년 Q1");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root"]));
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetail | null>(null);

  // Mock supply chain tree data
  const supplyChainTree: SupplyChainNode = {
    id: "root",
    name: "우리회사 (1차)",
    tier: "tier1",
    country: "대한민국",
    companyType: "배터리 제조",
    dataStatus: "validated",
    lastUpdate: "2026-03-04",
    dqr: 95,
    pcfValue: 1245.5,
    pcfStatus: "complete",
    children: [
      {
        id: "tier2-1",
        name: "동우전자부품",
        tier: "tier2",
        country: "대한민국",
        companyType: "전자부품",
        dataStatus: "submitted",
        lastUpdate: "2026-03-03",
        dqr: 88,
        pcfValue: 456.2,
        pcfStatus: "complete",
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
            pcfStatus: "partial"
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
            pcfStatus: "none"
          }
        ]
      },
      {
        id: "tier2-2",
        name: "한국소재산업",
        tier: "tier2",
        country: "대한민국",
        companyType: "소재",
        dataStatus: "validated",
        lastUpdate: "2026-03-04",
        dqr: 92,
        pcfValue: 789.3,
        pcfStatus: "complete",
        children: [
          {
            id: "tier3-3",
            name: "글로벌메탈",
            tier: "tier3",
            country: "중국",
            companyType: "금속",
            dataStatus: "submitted",
            lastUpdate: "2026-03-02",
            dqr: 85,
            pcfValue: 234.5,
            pcfStatus: "complete"
          }
        ]
      },
      {
        id: "tier2-3",
        name: "테크놀로지파트너스",
        tier: "tier2",
        country: "일본",
        companyType: "기술부품",
        dataStatus: "submitted",
        lastUpdate: "2026-03-03",
        dqr: 90,
        pcfValue: 567.8,
        pcfStatus: "complete"
      }
    ]
  };

  // Mock detailed data
  const companyDetails: { [key: string]: CompanyDetail } = {
    "root": {
      id: "root",
      name: "우리회사 (1차)",
      tier: "1차",
      country: "대한민국",
      companyType: "배터리 제조",
      dataStatus: "검증완료",
      lastUpdate: "2026-03-04 15:24",
      dqr: 95,
      pcfValue: 1245.5,
      pcfStatus: "완료",
      energyData: [
        { type: "전력 사용량", value: "1,250", unit: "kWh" },
        { type: "재생에너지", value: "450", unit: "kWh" }
      ],
      fuelData: [
        { type: "경유", value: "120", unit: "L" },
        { type: "LNG", value: "800", unit: "m³" }
      ],
      processData: [
        { type: "배터리 조립", value: "1,000", unit: "units" }
      ],
      wasteData: [
        { type: "일반 폐기물", value: "50", unit: "kg" }
      ]
    },
    "tier2-1": {
      id: "tier2-1",
      name: "동우전자부품",
      tier: "2차",
      country: "대한민국",
      companyType: "전자부품",
      dataStatus: "제출완료",
      lastUpdate: "2026-03-03 14:10",
      dqr: 88,
      pcfValue: 456.2,
      pcfStatus: "완료",
      energyData: [
        { type: "전력 사용량", value: "850", unit: "kWh" }
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
      case "validated":
      case "submitted":
        return { bg: "#E8F5E9", text: "#4CAF50", icon: CheckCircle };
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
      case "validated": return "검증완료";
      case "submitted": return "제출완료";
      case "pending": return "미제출";
      case "incomplete": return "불완전";
      default: return status;
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "tier1": return "1차";
      case "tier2": return "2차";
      case "tier3": return "3차";
      default: return tier;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "tier1": return "#1A439C";
      case "tier2": return "#00A3B5";
      case "tier3": return "#6B23C0";
      default: return "#1A439C";
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
                    fontWeight: node.tier === "tier1" ? 700 : 600,
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
            {countByStatus(supplyChainTree, "validated") + countByStatus(supplyChainTree, "submitted")}
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
            89%
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
    </div>
  );
}

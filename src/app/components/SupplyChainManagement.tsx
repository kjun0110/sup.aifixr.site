'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { 
  Search, 
  ChevronRight, 
  ChevronDown,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Calendar,
  UserPlus,
  MessageSquare,
  FileText,
  User
} from "lucide-react";
import { SupplierInviteModal } from "./shared/SupplierInviteModal";

type CompanyNode = {
  id: string;
  name: string;
  tier: "tier0" | "tier1" | "tier2" | "tier3" | "tier4";
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

type DirectChildTier = "tier1" | "tier2" | "tier3" | "tier4";

type CompanyDirectoryItem = {
  id: string;
  name: string;
  tier: DirectChildTier;
  taxId: string;
};

// Mock: "회사명 검색" 드롭다운 후보 — 차수: 0차=원청(SDI), 1차=동우/한국/테크, 2차=세진/그린 등, 3차=디오/솔브, 4차=디오 하위
const MOCK_COMPANY_DIRECTORY: CompanyDirectoryItem[] = [
  // 1차 (tier1)
  { id: "tier1-1", name: "동우전자부품 (나)", tier: "tier1", taxId: "110-81-12345" },
  { id: "tier1-2", name: "한국소재산업", tier: "tier1", taxId: "120-82-23456" },
  { id: "tier1-3", name: "테크놀로지파트너스", tier: "tier1", taxId: "130-83-34567" },
  // 2차 (tier2)
  { id: "tier2-1", name: "세진케미칼", tier: "tier2", taxId: "210-91-12345" },
  { id: "tier2-2", name: "그린에너지솔루션", tier: "tier2", taxId: "220-92-23456" },
  { id: "tier2-3", name: "글로벌메탈", tier: "tier2", taxId: "210-91-11111" },
  { id: "tier2-4", name: "에코플라스틱", tier: "tier2", taxId: "220-92-22222" },
  { id: "tier2-5", name: "바이오소재연구소", tier: "tier2", taxId: "230-93-33333" },
  // 3차 (tier3)
  { id: "tier3-1", name: "디오케미칼", tier: "tier3", taxId: "310-01-12345" },
  { id: "tier3-2", name: "솔브런트", tier: "tier3", taxId: "320-02-23456" },
  // 4차 (tier4)
  { id: "tier4-1", name: "켐텍소재", tier: "tier4", taxId: "410-01-11111" },
];

export function SupplyChainManagement({ tier }: { tier: "tier1" | "tier2" | "tier3" }) {
  const params = useParams();
  const projectId = typeof params.projectId === "string" ? params.projectId : params.projectId?.[0];
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root", "tier1-1", "tier2-1", "tier3-1"]));
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // 직하위차사 등록 모달
  const [showRegisterDirectChildModal, setShowRegisterDirectChildModal] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedRegisterCompany, setSelectedRegisterCompany] = useState<CompanyDirectoryItem | null>(null);
  const [registerBusinessNumber, setRegisterBusinessNumber] = useState("");
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [extraCompanies, setExtraCompanies] = useState<Company[]>([]);
  const [extraTreeChildren, setExtraTreeChildren] = useState<CompanyNode[]>([]);

  type DataRequestStatus = 'NOT_REQUESTED' | 'REQUESTED' | 'SUBMITTED';
  const LS_REQUEST_STATUS_KEY = 'aifix_mock_data_request_status_by_target_v1';

  const [requestStatusById, setRequestStatusById] = useState<Record<string, DataRequestStatus>>({});

  // 권한 설정 (데이터 요청 버튼은 데이터관리 탭으로 이동; 여기서는 참고용)
  const canInviteSuppliers = true;
  const canRequestData = tier === "tier1" || tier === "tier2";

  // Load request status mock from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_REQUEST_STATUS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, DataRequestStatus>;
      setRequestStatusById(parsed ?? {});
    } catch {
      // ignore (mock)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_REQUEST_STATUS_KEY, JSON.stringify(requestStatusById));
    } catch {
      // ignore (mock)
    }
  }, [LS_REQUEST_STATUS_KEY, requestStatusById]);

  const currentTierNum = tier === 'tier1' ? 1 : tier === 'tier2' ? 2 : 3;

  const getRequestStatusLabel = (status: DataRequestStatus | undefined) => {
    if (status === 'REQUESTED') return '요청됨';
    if (status === 'SUBMITTED') return '제출 완료';
    return '미요청';
  };

  const getRequestStatusStyle = (status: DataRequestStatus | undefined) => {
    switch (status) {
      case 'REQUESTED':
        return { bg: '#FFF4E6', text: '#FF9800', border: '#FFCC80' };
      case 'SUBMITTED':
        return { bg: '#E8F5E9', text: '#4CAF50', border: '#A5D6A7' };
      default:
        return { bg: '#F5F5F5', text: '#757575', border: '#E0E0E0' };
    }
  };

  // Mock tree data — 차수: 0차=SDI(원청), 1차=동우/한국/테크, 2차=세진/그린(동우 직하위) 등, 3차=디오/솔브(세진 직하위), 4차=디오 직하위 1개
  const getTreeData = (): CompanyNode => {
    // 4차: 디오케미칼 직하위 1개 (공통 서브트리)
    const dioChildren: CompanyNode[] = [
      { id: "tier4-1", name: "켐텍소재", tier: "tier4", status: "pending", parentId: "tier3-1" },
    ];

    if (tier === "tier1") {
      // P1: 로그인=동우전자부품(1차) → 직상위 0차(삼성SDI) + 나(동우) + 2차(세진/그린) + 3차(디오/솔브) + 디오 하위 4차
      if (projectId === "p1") {
        return {
          id: "root",
          name: "삼성SDI",
          tier: "tier0",
          status: "submitted",
          parentId: undefined,
          children: [
            {
              id: "tier1-1",
              name: "동우전자부품 (나)",
              tier: "tier1",
              status: "submitted",
              parentId: "root",
              children: [
                {
                  id: "tier2-1",
                  name: "세진케미칼",
                  tier: "tier2",
                  status: "revision",
                  parentId: "tier1-1",
                  children: [
                    { id: "tier3-1", name: "디오케미칼", tier: "tier3", status: "pending", parentId: "tier2-1", children: dioChildren },
                    { id: "tier3-2", name: "솔브런트", tier: "tier3", status: "submitted", parentId: "tier2-1" },
                  ],
                },
                { id: "tier2-2", name: "그린에너지솔루션", tier: "tier2", status: "pending", parentId: "tier1-1" },
              ],
            },
          ],
        };
      }

      // 기본(1차 사용자 전체 트리): 0차 SDI → 1차(동우/한국/테크) → 2차 → 3차 → 4차
      return {
        id: "root",
        name: "SDI",
        tier: "tier0",
        status: "submitted",
        children: [
          {
            id: "tier1-1",
            name: "동우전자부품 (나)",
            tier: "tier1",
            status: "pending",
            parentId: "root",
            children: [
              {
                id: "tier2-1",
                name: "세진케미칼",
                tier: "tier2",
                status: "revision",
                parentId: "tier1-1",
                children: [
                  { id: "tier3-1", name: "디오케미칼", tier: "tier3", status: "pending", parentId: "tier2-1", children: dioChildren },
                  { id: "tier3-2", name: "솔브런트", tier: "tier3", status: "submitted", parentId: "tier2-1" },
                ],
              },
              { id: "tier2-2", name: "그린에너지솔루션", tier: "tier2", status: "pending", parentId: "tier1-1" },
            ],
          },
          {
            id: "tier1-2",
            name: "한국소재산업",
            tier: "tier1",
            status: "failed",
            parentId: "root",
            children: [
              { id: "tier2-3", name: "글로벌메탈", tier: "tier2", status: "submitted", parentId: "tier1-2" },
              { id: "tier2-4", name: "에코플라스틱", tier: "tier2", status: "submitted", parentId: "tier1-2" },
              { id: "tier2-5", name: "바이오소재연구소", tier: "tier2", status: "pending", parentId: "tier1-2" },
            ],
          },
          { id: "tier1-3", name: "테크놀로지파트너스", tier: "tier1", status: "submitted", parentId: "root" },
        ],
      };
    } else if (tier === "tier2") {
      // p2: 로그인=세진케미칼(2차) → 동우(1차) 루트, 세진(나)만(자기 브랜치만), 디오/솔브(3차), 디오 하위 4차 (그린에너지솔루션 미표시)
      if (projectId === "p2") {
        return {
          id: "root",
          name: "동우전자부품",
          tier: "tier1",
          status: "submitted",
          children: [
            {
              id: "tier2-1",
              name: "세진케미칼 (나)",
              tier: "tier2",
              status: "revision",
              parentId: "root",
              children: [
                { id: "tier3-1", name: "디오케미칼", tier: "tier3", status: "pending", parentId: "tier2-1", children: dioChildren },
                { id: "tier3-2", name: "솔브런트", tier: "tier3", status: "submitted", parentId: "tier2-1" },
              ],
            },
          ],
        };
      }

      return {
        id: "root",
        name: "SDI",
        tier: "tier0",
        status: "submitted",
        children: [
          { id: "tier2-1", name: "세진케미칼", tier: "tier2", status: "submitted", parentId: "root" },
          { id: "tier2-2", name: "그린에너지솔루션", tier: "tier2", status: "pending", parentId: "root" },
        ],
      };
    } else {
      // tier3: P3 로그인=디오케미칼(3차) → 상위 세진케미칼, 디오케미칼(나), 직하위 켐텍소재
      if (projectId === "p3") {
        return {
          id: "root",
          name: "세진케미칼",
          tier: "tier2",
          status: "submitted",
          parentId: undefined,
          children: [
            {
              id: "tier3-1",
              name: "디오케미칼 (나)",
              tier: "tier3",
              status: "pending",
              parentId: "root",
              children: [
                { id: "tier4-1", name: "켐텍소재", tier: "tier4", status: "pending", parentId: "tier3-1" },
              ],
            },
          ],
        };
      }
      return {
        id: "root",
        name: "SDI",
        tier: "tier0",
        status: "submitted",
        children: [],
      };
    }
  };

  const baseTreeData = useMemo(() => getTreeData(), [tier, projectId]);
  const treeData = useMemo(() => {
    if (extraTreeChildren.length === 0) return baseTreeData;
    return {
      ...baseTreeData,
      children: [...(baseTreeData.children ?? []), ...extraTreeChildren],
    };
  }, [baseTreeData, extraTreeChildren]);

  const getRequestIndicator = (id: string) => {
    const st = requestStatusById[id];
    if (st === 'REQUESTED') return <span title="요청됨" style={{ marginLeft: 6, fontSize: 12 }}>📩</span>;
    if (st === 'SUBMITTED') return <span title="제출 완료" style={{ marginLeft: 6, fontSize: 12 }}>✅</span>;
    return null;
  };

  // Mock company list data — 차수 라벨: 1차/2차/3차/4차
  const getAllCompanies = (): Company[] => {
    if (tier === "tier1") {
      // P1: 동우전자부품 하위만 — 2차(세진/그린), 3차(디오/솔브), 4차(켐텍소재)
      if (projectId === "p1") {
        return [
          { id: "tier2-1", name: "세진케미칼", tier: "2차", status: "보완필요", lastSubmit: "2026-03-01", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: true },
          { id: "tier2-2", name: "그린에너지솔루션", tier: "2차", status: "미제출", lastSubmit: "-", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
          { id: "tier3-1", name: "디오케미칼", tier: "3차", status: "미제출", lastSubmit: "-", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
          { id: "tier3-2", name: "솔브런트", tier: "3차", status: "제출완료", lastSubmit: "2026-03-02", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
          { id: "tier4-1", name: "켐텍소재", tier: "4차", status: "미제출", lastSubmit: "-", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        ];
      }

      // 기본: 1차(동우/한국/테크), 2차(세진/그린/글로벌메탈/에코/바이오), 3차(디오/솔브), 4차(켐텍소재)
      return [
        { id: "tier1-1", name: "동우전자부품 (나)", tier: "1차", status: "미제출", lastSubmit: "2026-02-15", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        { id: "tier1-2", name: "한국소재산업", tier: "1차", status: "검증실패", lastSubmit: "2026-03-02", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        { id: "tier1-3", name: "테크놀로지파트너스", tier: "1차", status: "제출완료", lastSubmit: "2026-03-03", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        { id: "tier2-1", name: "세진케미칼", tier: "2차", status: "보완필요", lastSubmit: "2026-03-01", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: true },
        { id: "tier2-2", name: "그린에너지솔루션", tier: "2차", status: "미제출", lastSubmit: "-", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        { id: "tier2-3", name: "글로벌메탈", tier: "2차", status: "제출완료", lastSubmit: "2026-02-28", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        { id: "tier2-4", name: "에코플라스틱", tier: "2차", status: "제출완료", lastSubmit: "2026-03-01", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        { id: "tier2-5", name: "바이오소재연구소", tier: "2차", status: "미제출", lastSubmit: "-", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        { id: "tier3-1", name: "디오케미칼", tier: "3차", status: "미제출", lastSubmit: "-", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        { id: "tier3-2", name: "솔브런트", tier: "3차", status: "제출완료", lastSubmit: "2026-03-02", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        { id: "tier4-1", name: "켐텍소재", tier: "4차", status: "미제출", lastSubmit: "-", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
      ];
    } else if (tier === "tier2") {
      if (projectId === "p2") {
        return [
          { id: "tier2-1", name: "세진케미칼 (나)", tier: "2차", status: "보완필요", lastSubmit: "2026-03-01", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: true },
          { id: "tier3-1", name: "디오케미칼", tier: "3차", status: "미제출", lastSubmit: "-", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
          { id: "tier3-2", name: "솔브런트", tier: "3차", status: "제출완료", lastSubmit: "2026-03-02", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
          { id: "tier4-1", name: "켐텍소재", tier: "4차", status: "미제출", lastSubmit: "-", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        ];
      }

      return [
        { id: "tier2-1", name: "세진케미칼", tier: "2차", status: "제출완료", lastSubmit: "2026-03-04", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        { id: "tier2-2", name: "그린에너지솔루션", tier: "2차", status: "미제출", lastSubmit: "-", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
      ];
    } else if (tier === "tier3") {
      if (projectId === "p3") {
        return [
          { id: "tier3-1", name: "디오케미칼 (나)", tier: "3차", status: "미제출", lastSubmit: "-", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
          { id: "tier4-1", name: "켐텍소재", tier: "4차", status: "미제출", lastSubmit: "-", dueDate: "2026-03-10", daysLeft: 6, revisionRequested: false },
        ];
      }
      return [];
    } else {
      return [];
    }
  };

  const allCompaniesBase = useMemo(() => getAllCompanies(), [tier, projectId]);
  const allCompanies = [...allCompaniesBase, ...extraCompanies];

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
              color: node.tier === "tier0" ? '#374151' : node.tier === "tier1" ? '#1A439C' : node.tier === "tier2" ? '#00A3B5' : node.tier === "tier3" ? '#6B23C0' : '#9C27B0'
            }} 
          />
          
          <span 
            style={{ 
              fontSize: '14px', 
              fontWeight: node.tier === "tier0" || node.tier === "tier1" || (tier === "tier2" && node.tier === "tier2") || (tier === "tier3" && node.tier === "tier3") ? 700 : 500,
              color: 'var(--aifix-navy)',
              flex: 1
            }}
          >
            {node.name}
            {/* Request status indicator (📩 / ✅) */}
            {(() => {
              const st = requestStatusById[node.id];
              if (st === 'REQUESTED') return <span title="요청됨" style={{ marginLeft: 6, fontSize: 12 }}>📩</span>;
              if (st === 'SUBMITTED') return <span title="제출 완료" style={{ marginLeft: 6, fontSize: 12 }}>✅</span>;
              return null;
            })()}
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

  const getTierName = () => {
    if (tier === "tier1") return "1차";
    if (tier === "tier2") return "2차";
    return "3차";
  };

  return (
    <div className="pt-8 min-w-0">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            공급망 관리
          </h2>
          <p style={{ color: 'var(--aifix-gray)' }}>
            하위 공급망 구조를 확인하고 협력사 데이터를 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowRegisterDirectChildModal(true);
              setCompanyQuery("");
              setSelectedRegisterCompany(null);
              setRegisterBusinessNumber("");
              setCompanyDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105"
            style={{
              background: "white",
              border: "1px solid var(--aifix-primary)",
              color: "var(--aifix-primary)",
              fontWeight: 700,
            }}
          >
            <UserPlus className="w-5 h-5" />
            직하위차사 등록
          </button>
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
      </div>

      {/* 3 Column Layout - min-w-0으로 그리드가 컨테이너를 넘지 않도록 */}
      <div className="grid grid-cols-12 gap-6 min-w-0" style={{ minHeight: '600px' }}>
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
                onClick={() => {
                  const allNodeIds = tier === "tier1"
                    ? (projectId === "p1" ? ["root", "tier1-1", "tier2-1", "tier3-1"] : ["root", "tier1-1", "tier1-2", "tier2-1", "tier3-1"])
                    : tier === "tier2"
                    ? (projectId === "p2" ? ["root", "tier2-1", "tier3-1", "tier4-1"] : ["root"])
                    : tier === "tier3" && projectId === "p3"
                    ? ["root", "tier3-1", "tier4-1"]
                    : ["root"];
                  setExpandedNodes(new Set(allNodeIds));
                }}
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
          {allCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Building2 
                className="w-16 h-16 mb-4" 
                style={{ color: 'var(--aifix-gray)', opacity: 0.5 }} 
              />
              <h3 className="text-lg mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                등록된 하위 협력사가 없습니다
              </h3>
              <p style={{ color: 'var(--aifix-gray)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                "하위 협력사 초대" 버튼을 클릭하여<br />
                협력사를 등록하고 데이터를 요청할 수 있습니다.
              </p>
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
          ) : (
            <>
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
                <div className="col-span-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  업체명
                </div>
                <div className="col-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  상태
                </div>
                <div className="col-span-3" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
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
                      <div className="col-span-4 flex items-center gap-2">
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
                      <div className="col-span-3 flex items-center">
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
            </>
          )}
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

              {/* Action Buttons */}
              <div className="space-y-3">
                <h4 className="text-sm mb-2" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  주요 액션
                </h4>

                {canRequestData && (
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: 'var(--aifix-primary)',
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">수정요청 보내기</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

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

                {canRequestData && (
                  <>
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
                  </>
                )}
              </div>

              {/* Permission Note */}
              <div 
                className="mt-6 p-3 rounded-lg"
                style={{ 
                  backgroundColor: canRequestData ? '#FFEBEE' : '#F5F5F5', 
                  border: `1px solid ${canRequestData ? '#F44336' : '#E0E0E0'}` 
                }}
              >
                <div className="flex gap-2">
                  <AlertCircle
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: canRequestData ? '#F44336' : '#757575' }}
                  />
                  <p
                    style={{
                      fontSize: '12px',
                      color: canRequestData ? '#F44336' : '#757575',
                      lineHeight: 1.5
                    }}
                  >
                    {canRequestData ? (
                      <>
                        <strong>요청 기반 권한:</strong> 하위 협력사 데이터는 즉시 편집할 수 없으며 수정요청/보완요청만 가능합니다.
                      </>
                    ) : (
                      <>
                        <strong>조회 전용:</strong> 조회 전용입니다. 자사 데이터는 '데이터 관리' 탭에서 입력/수정할 수 있습니다.
                      </>
                    )}
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

      {/* 직하위차사 등록 모달 */}
      {showRegisterDirectChildModal && (() => {
        const directChildTier: DirectChildTier = tier === "tier1" ? "tier2" : tier === "tier2" ? "tier3" : "tier4";
        const directChildTierLabel = tier === "tier1" ? "2차" : tier === "tier2" ? "3차" : "4차";

        const query = companyQuery.trim().toLowerCase();
        const candidates = MOCK_COMPANY_DIRECTORY
          .filter((c) => c.tier === directChildTier)
          .filter((c) => (query ? c.name.toLowerCase().includes(query) : true))
          .slice(0, 8);

        const close = () => {
          setShowRegisterDirectChildModal(false);
          setCompanyQuery("");
          setSelectedRegisterCompany(null);
          setRegisterBusinessNumber("");
          setCompanyDropdownOpen(false);
        };

        const handleRegister = () => {
          if (!selectedRegisterCompany) {
            alert("회사명을 선택해주세요.");
            return;
          }
          const biz = registerBusinessNumber.trim();
          if (!biz) {
            alert("사업자등록번호를 입력해주세요.");
            return;
          }

          const exists = allCompanies.some((c) => c.name === selectedRegisterCompany.name);
          if (exists) {
            alert("이미 등록된 회사입니다.");
            return;
          }

          const nowId = `direct-${Date.now()}`;
          const nextTreeNode: CompanyNode = {
            id: nowId,
            name: selectedRegisterCompany.name,
            tier: directChildTier,
            status: "pending",
            parentId: "root",
          };

          setExtraTreeChildren((prev) => [...prev, nextTreeNode]);
          setExtraCompanies((prev) => [
            ...prev,
            {
              id: nowId,
              name: selectedRegisterCompany.name,
              tier: directChildTierLabel,
              status: "미제출",
              lastSubmit: "-",
              dueDate: "2026-03-10",
              daysLeft: 6,
              revisionRequested: false,
            },
          ]);

          alert("직하위 협력사가 등록되었습니다.");
          close();
        };

        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={close}
          >
            <div
              className="bg-white rounded-[20px] w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-8 py-6 flex items-start justify-between border-b border-gray-100">
                <div>
                  <div className="text-xl font-bold" style={{ color: "var(--aifix-navy)" }}>
                    직하위 협력사 등록하기
                  </div>
                  <div className="text-sm" style={{ color: "var(--aifix-gray)", marginTop: 4 }}>
                    협력사의 직하위차사로 연결될 회사를 등록합니다.
                  </div>
                </div>
                <button
                  onClick={close}
                  className="px-3 py-2 rounded-lg transition-all"
                  style={{ border: "1px solid var(--aifix-gray)", background: "white" }}
                >
                  취소
                </button>
              </div>

              <div className="px-8 py-6">
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <div className="text-sm font-semibold mb-2" style={{ color: "var(--aifix-navy)" }}>
                      1. 회사명
                    </div>
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: "var(--aifix-gray)" }}
                      />
                      <input
                        value={companyQuery}
                        onChange={(e) => {
                          setCompanyQuery(e.target.value);
                          setCompanyDropdownOpen(true);
                          setSelectedRegisterCompany(null);
                          setRegisterBusinessNumber("");
                        }}
                        onFocus={() => setCompanyDropdownOpen(true)}
                        placeholder="회사명 검색"
                        className="w-full rounded-[16px] border border-gray-200 p-3 pl-10 text-sm"
                        style={{ outline: "none" }}
                      />

                      {companyDropdownOpen && candidates.length > 0 && (
                        <div
                          className="absolute z-10 mt-2 w-full rounded-[16px] border border-gray-200 bg-white shadow-lg overflow-hidden"
                        >
                          {candidates.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedRegisterCompany(c);
                                setCompanyQuery(c.name);
                                setRegisterBusinessNumber(c.taxId);
                                setCompanyDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                              style={{ color: "var(--aifix-navy)", fontWeight: 600 }}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}

                      {companyDropdownOpen && candidates.length === 0 && companyQuery.trim() && (
                        <div className="absolute z-10 mt-2 w-full rounded-[16px] border border-gray-200 bg-white p-3 text-sm" style={{ color: "var(--aifix-gray)" }}>
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold mb-2" style={{ color: "var(--aifix-navy)" }}>
                      2. 사업자등록번호
                    </div>
                    <input
                      value={registerBusinessNumber}
                      onChange={(e) => setRegisterBusinessNumber(e.target.value)}
                      placeholder="예: 110-81-12345"
                      className="w-full rounded-[16px] border border-gray-200 p-3 text-sm"
                      style={{ outline: "none" }}
                    />
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  className="px-6 py-3 rounded-xl transition-all"
                  style={{ border: "1px solid var(--aifix-gray)", color: "var(--aifix-gray)", fontWeight: 700 }}
                  onClick={close}
                >
                  취소
                </button>
                <button
                  className="px-6 py-3 rounded-xl transition-all text-white"
                  style={{ background: "linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)", fontWeight: 800 }}
                  onClick={handleRegister}
                >
                  등록하기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Invite Modal */}
      <SupplierInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}

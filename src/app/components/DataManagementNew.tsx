'use client';

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  postSupDataRequest,
  postSupSupplyChainTree,
  type SupDataRequestCreateBody,
  type SupSupplyChainTreeNodeDto,
} from "../../lib/api/data-mgmt";
import { 
  ChevronRight,
  ChevronDown,
  Eye,
  MapPin,
  Calendar,
  Search,
  Info,
  CheckCircle2,
  CheckCircle,
  Clock,
  Send,
  Building2,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { MonthPicker } from "./MonthPicker";

// 뒤로가기 시 조회조건 복원용 (상세보기→뒤로가기 시에만)
const DATA_MGMT_FILTER_STORAGE_KEY = 'aifix_data_mgmt_filters_v1';
const DATA_MGMT_BACK_FLAG_KEY = 'aifix_data_mgmt_from_back_v1';

export type DataMgmtLinkedProject = {
  projectId: number;
  productId: number;
  supplierId: number;
  productVariantId?: number | null;
};

type DataManagementNewProps = {
  tier: "tier1" | "tier2" | "tier3";
  /** 실제 프로젝트(real-*)일 때만 전달 — 공급망 트리 API(루트=내 협력사) */
  linkedProject?: DataMgmtLinkedProject | null;
};

/** 조회 기간 기본 라벨: 캘린더 기준 전월만 (1월이면 작년 12월) */
function defaultDataMgmtPeriodLabel(): string {
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  let prevY = curY;
  let prevM = curM - 1;
  if (prevM < 1) {
    prevM = 12;
    prevY -= 1;
  }
  return `${prevY}년 ${prevM}월`;
}

function periodToYmKorean(period: string): string | null {
  const trimmed = period.trim();
  if (!trimmed) return null;
  const matches = [...trimmed.matchAll(/(\d{4})\s*년\s*(\d{1,2})\s*월/g)];
  const m = matches.length > 0 ? matches[0] : null;
  if (!m) return null;
  return `${m[1]}-${String(parseInt(m[2], 10)).padStart(2, "0")}`;
}

type SupplierNode = {
  id: string;
  name: string;
  country: string;
  type: string;
  volume: string;
  dataStatus: "완료" | "검토중" | "미제출";
  lastUpdate: string;
  dqr: string;
  pcfStatus: "완료" | "검증중" | "계산 대기" | "미제출" | "미작성";
  pcfResult: number | null; // kg CO₂e
  children?: SupplierNode[];
  isOwn?: boolean;
};

type RequestModalNode = {
  id: string;
  nodeId: number | null;
  name: string;
  tier: string;
  children?: RequestModalNode[];
};

function mapSupTreeToSupplierNode(
  api: SupSupplyChainTreeNodeDto,
  opts?: { rootId?: string },
): SupplierNode {
  const id =
    opts?.rootId ??
    (api.node_id != null ? `n-${api.node_id}` : `s-${api.supplier_id}`);
  const ds = (api.data_status || "").toLowerCase();
  const dataStatus: SupplierNode["dataStatus"] =
    ds === "complete" ? "완료" : ds === "reviewing" ? "검토중" : "미제출";
  const ps = (api.pcf_status || "").toLowerCase();
  const pcfStatus: SupplierNode["pcfStatus"] =
    ps === "complete"
      ? "완료"
      : ps === "not_written"
        ? "미작성"
        : ps === "pending_calc"
          ? "계산 대기"
        : ps === "verifying"
          ? "검증중"
          : ps === "not_submitted"
            ? "미제출"
            : "계산 대기";
  const rawKg = api.pcf_total_co2e_kg;
  const pcfResult =
    rawKg != null && Number.isFinite(Number(rawKg)) ? Number(rawKg) : null;
  return {
    id,
    name: api.is_me ? `${api.supplier_name} (나)` : api.supplier_name,
    country: api.country?.trim() || "—",
    type: api.company_type?.trim() || "—",
    volume: api.delivery_qty?.trim() || "—",
    dataStatus,
    lastUpdate: api.last_updated?.trim() || "—",
    dqr: api.dqr?.trim() || "—",
    pcfStatus,
    pcfResult,
    isOwn: Boolean(api.is_me),
    children: (api.children ?? []).map((ch) => mapSupTreeToSupplierNode(ch)),
  };
}

export function DataManagementNew({
  tier,
  linkedProject = null,
}: DataManagementNewProps) {
  const params = useParams();
  const projectId = typeof params.projectId === 'string' ? params.projectId : params.projectId?.[0] ?? 'p1';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState(defaultDataMgmtPeriodLabel);
  const [showResults, setShowResults] = useState(searchParams.get("show") === "true");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // P1(동우전자부품): 세진(tier3-1) → 디오(tier4-1) → 4차까지 기본 펼침
    if (projectId === 'p1' && tier === 'tier1') return new Set(['root', 'tier3-1', 'tier4-1']);
    // P3(디오케미칼): 디오(나) → 켐텍소재 기본 펼침
    if (projectId === 'p3' && tier === 'tier3') return new Set(['root', 'tier4-1']);
    // 1차 협력사 목업: 동우(나) 루트 → 세진→디오→켐텍 일부 펼침
    if (projectId !== 'p2' && tier === 'tier1') return new Set(['root', 'tier3-1', 'tier4-1']);
    return new Set(['root']);
  });

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestTargets, setRequestTargets] = useState<Set<string>>(new Set());
  const [requestExpandedNodeIds, setRequestExpandedNodeIds] = useState<Set<string>>(new Set(["root"]));
  const [requestMessage, setRequestMessage] = useState('');
  const [requestDueDate, setRequestDueDate] = useState('');
  const [apiRoot, setApiRoot] = useState<SupplierNode | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    if (!linkedProject || !showResults || !period?.trim()) {
      setApiRoot(null);
      setApiLoading(false);
      return;
    }
    const ym = periodToYmKorean(period);
    if (!ym) return;
    const [ys, ms] = ym.split("-");
    const reportingYear = parseInt(ys, 10);
    const reportingMonth = parseInt(ms, 10);
    if (!Number.isFinite(reportingYear) || !Number.isFinite(reportingMonth)) return;

    let cancelled = false;
    setApiLoading(true);
    (async () => {
      try {
        const raw = await postSupSupplyChainTree(
          linkedProject.projectId,
          linkedProject.productId,
          linkedProject.supplierId,
          {
            reporting_year: reportingYear,
            reporting_month: reportingMonth,
            product_variant_id: linkedProject.productVariantId ?? null,
          },
        );
        if (!cancelled) {
          setApiRoot(mapSupTreeToSupplierNode(raw, { rootId: "root" }));
        }
      } catch (e) {
        if (!cancelled) {
          setApiRoot(null);
          toast.error(
            e instanceof Error ? e.message : "공급망 데이터를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [linkedProject, showResults, period]);

  useEffect(() => {
    if (!showRequestModal) return;
    setRequestTargets(new Set());
    setRequestExpandedNodeIds(new Set(["root"]));
    setRequestMessage('');
    setRequestDueDate('');
  }, [showRequestModal]);

  // 뒤로가기 시에만 조회조건 복원 (상세보기→뒤로가기). 새로고침/다른 탭 이동 시에는 복원하지 않음
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    try {
      const fromBack = typeof window !== 'undefined' ? sessionStorage.getItem(DATA_MGMT_BACK_FLAG_KEY) : null;
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem(DATA_MGMT_FILTER_STORAGE_KEY) : null;
      if (!raw || !fromBack) {
        sessionStorage.removeItem(DATA_MGMT_FILTER_STORAGE_KEY);
        sessionStorage.removeItem(DATA_MGMT_BACK_FLAG_KEY);
        return;
      }
      const s = JSON.parse(raw) as Record<string, unknown>;
      if (s.period != null) setPeriod(String(s.period));
      if (s.showResults === true) setShowResults(true);
      if (Array.isArray(s.expandedNodes)) setExpandedNodes(new Set(s.expandedNodes as string[]));
    } catch {
      /* ignore */
    }
    sessionStorage.removeItem(DATA_MGMT_FILTER_STORAGE_KEY);
    sessionStorage.removeItem(DATA_MGMT_BACK_FLAG_KEY);
  }, []);

  // Mock supply chain data (프로젝트/차수 기준으로 "우리회사" 기준점이 달라집니다)
  const supplyChainData: SupplierNode = useMemo(() => {
    // p2: (협력사 포털) 로그인 사용자=세진케미칼 → 세진케미칼 + 하위(디오/솔브) + 디오 하위 4차(켐텍소재)만 표시
    if (projectId === 'p2' && tier === 'tier2') {
      return {
        id: 'root',
        name: '세진케미칼 (나)',
        country: 'South Korea',
        type: '화학소재',
        volume: '18,000 kg',
        dataStatus: '검토중',
        lastUpdate: '2026-03-01',
        dqr: '3.9',
        pcfStatus: '검증중',
        pcfResult: 8500,
        isOwn: true,
        children: [
          {
            id: 'tier3-1',
            name: '디오케미칼',
            country: 'South Korea',
            type: '정제 원료',
            volume: '6,000 kg',
            dataStatus: '미제출',
            lastUpdate: '-',
            dqr: '-',
            pcfStatus: '미제출',
            pcfResult: null,
            children: [
              {
                id: 'tier4-1',
                name: '켐텍소재',
                country: 'South Korea',
                type: '원료',
                volume: '2,000 kg',
                dataStatus: '미제출',
                lastUpdate: '-',
                dqr: '-',
                pcfStatus: '미제출',
                pcfResult: null,
              },
            ],
          },
          {
            id: 'tier3-2',
            name: '솔브런트',
            country: 'Japan',
            type: '촉매/보조재',
            volume: '4,500 kg',
            dataStatus: '완료',
            lastUpdate: '2026-03-02',
            dqr: '4.3',
            pcfStatus: '완료',
            pcfResult: 3200,
          },
        ],
      };
    }

    // p3: (협력사 포털) 우리회사=디오케미칼 → 상위차사 데이터 비노출, 디오케미칼(나) 루트 + 직하위 켐텍소재만
    if (projectId === 'p3' && tier === 'tier3') {
      return {
        id: 'root',
        name: '디오케미칼 (나)',
        country: 'South Korea',
        type: '정제 원료',
        volume: '6,000 kg',
        dataStatus: '미제출',
        lastUpdate: '-',
        dqr: '-',
        pcfStatus: '미제출',
        pcfResult: null,
        isOwn: true,
        children: [
          {
            id: 'tier4-1',
            name: '켐텍소재',
            country: 'South Korea',
            type: '원료',
            volume: '2,000 kg',
            dataStatus: '미제출',
            lastUpdate: '-',
            dqr: '-',
            pcfStatus: '미제출',
            pcfResult: null,
          },
        ],
      };
    }

    // 1차 협력사 목업 공통: 루트 = 내 기업(동우) — 원청(SD)부터 내리지 않음
    if (tier === 'tier1') {
      return {
        id: 'root',
        name: '동우전자부품 (나)',
        country: 'South Korea',
        type: 'Battery Manufacturer',
        volume: '36,000 kg',
        dataStatus: '완료',
        lastUpdate: '2026-03-05',
        dqr: '4.2',
        pcfStatus: '완료',
        pcfResult: 32420.3,
        isOwn: true,
        children: [
          {
            id: 'tier3-1',
            name: '세진케미칼',
            country: 'South Korea',
            type: '화학소재',
            volume: '18,000 kg',
            dataStatus: '검토중',
            lastUpdate: '2026-03-01',
            dqr: '3.9',
            pcfStatus: '검증중',
            pcfResult: 18200,
            children: [
              {
                id: 'tier4-1',
                name: '디오케미칼',
                country: 'South Korea',
                type: '정제 원료',
                volume: '6,000 kg',
                dataStatus: '미제출',
                lastUpdate: '-',
                dqr: '-',
                pcfStatus: '미제출',
                pcfResult: null,
                children: [
                  {
                    id: 'tier5-1',
                    name: '켐텍소재',
                    country: 'South Korea',
                    type: '원료',
                    volume: '2,000 kg',
                    dataStatus: '미제출',
                    lastUpdate: '-',
                    dqr: '-',
                    pcfStatus: '미제출',
                    pcfResult: null,
                  },
                ],
              },
              {
                id: 'tier4-2',
                name: '솔브런트',
                country: 'Japan',
                type: '촉매/보조재',
                volume: '4,500 kg',
                dataStatus: '완료',
                lastUpdate: '2026-03-02',
                dqr: '4.3',
                pcfStatus: '완료',
                pcfResult: 3200,
              },
            ],
          },
          {
            id: 'tier3-2',
            name: '그린에너지솔루션',
            country: 'South Korea',
            type: '에너지',
            volume: '12,000 kg',
            dataStatus: '미제출',
            lastUpdate: '-',
            dqr: '-',
            pcfStatus: '미제출',
            pcfResult: null,
          },
        ],
      };
    }

    // 기본: 0차 SDI → 1차(동우/한국/테크) → 2차(세진/그린 등) → 3차(디오/솔브) → 4차(디오 하위 켐텍소재)
    return {
      id: "root",
      name: "SDI",
      country: "South Korea",
      type: "배터리 소재 제조",
      volume: "50,000 kg",
      dataStatus: "완료",
      lastUpdate: "2026-03-08",
      dqr: "4.5",
      pcfStatus: "계산 대기",
      pcfResult: null,
      isOwn: true,
      children: [
        {
          id: "tier1-1",
          name: "동우전자부품",
          country: "South Korea",
          type: "Battery Manufacturer",
          volume: "36,000 kg",
          dataStatus: "완료",
          lastUpdate: "2026-03-05",
          dqr: "4.2",
          pcfStatus: "완료",
          pcfResult: 32420.3,
          children: [
            {
              id: "tier2-1",
              name: "세진케미칼",
              country: "South Korea",
              type: "화학소재",
              volume: "18,000 kg",
              dataStatus: "검토중",
              lastUpdate: "2026-03-01",
              dqr: "3.9",
              pcfStatus: "검증중",
              pcfResult: 18200,
              children: [
                {
                  id: "tier3-1",
                  name: "디오케미칼",
                  country: "South Korea",
                  type: "정제 원료",
                  volume: "6,000 kg",
                  dataStatus: "미제출",
                  lastUpdate: "-",
                  dqr: "-",
                  pcfStatus: "미제출",
                  pcfResult: null,
                  children: [
                    {
                      id: "tier5-1",
                      name: "켐텍소재",
                      country: "South Korea",
                      type: "원료",
                      volume: "2,000 kg",
                      dataStatus: "미제출",
                      lastUpdate: "-",
                      dqr: "-",
                      pcfStatus: "미제출",
                      pcfResult: null,
                    },
                  ],
                },
                {
                  id: "tier3-2",
                  name: "솔브런트",
                  country: "Japan",
                  type: "촉매/보조재",
                  volume: "4,500 kg",
                  dataStatus: "완료",
                  lastUpdate: "2026-03-02",
                  dqr: "4.3",
                  pcfStatus: "완료",
                  pcfResult: 3200,
                },
              ],
            },
            {
              id: "tier2-2",
              name: "그린에너지솔루션",
              country: "South Korea",
              type: "에너지",
              volume: "12,000 kg",
              dataStatus: "미제출",
              lastUpdate: "-",
              dqr: "-",
              pcfStatus: "미제출",
              pcfResult: null,
            },
          ],
        },
        {
          id: "tier1-2",
          name: "한국소재산업",
          country: "China",
          type: "소재",
          volume: "28,000 kg",
          dataStatus: "검토중",
          lastUpdate: "2026-03-07",
          dqr: "3.1",
          pcfStatus: "계산 대기",
          pcfResult: 9500,
          children: [
            {
              id: "tier2-3",
              name: "글로벌메탈",
              country: "China",
              type: "금속",
              volume: "15,000 kg",
              dataStatus: "완료",
              lastUpdate: "2026-03-02",
              dqr: "4.0",
              pcfStatus: "완료",
              pcfResult: 4100,
            },
            {
              id: "tier2-4",
              name: "에코플라스틱",
              country: "China",
              type: "화학소재",
              volume: "11,000 kg",
              dataStatus: "완료",
              lastUpdate: "2026-03-01",
              dqr: "4.2",
              pcfStatus: "완료",
              pcfResult: 2800,
            },
            {
              id: "tier2-5",
              name: "바이오소재연구소",
              country: "China",
              type: "바이오",
              volume: "9,000 kg",
              dataStatus: "미제출",
              lastUpdate: "2026-02-28",
              dqr: "-",
              pcfStatus: "미제출",
              pcfResult: null,
            },
          ],
        },
        {
          id: "tier1-3",
          name: "테크놀로지파트너스",
          country: "Japan",
          type: "기술부품",
          volume: "22,000 kg",
          dataStatus: "완료",
          lastUpdate: "2026-03-03",
          dqr: "3.6",
          pcfStatus: "계산 대기",
          pcfResult: 3120,
        },
      ],
    };
  }, [projectId, tier]);

  const displayTree = useMemo((): SupplierNode | null => {
    if (linkedProject) return apiRoot;
    return supplyChainData;
  }, [linkedProject, apiRoot, supplyChainData]);

  const showLeafEmptyBanner = Boolean(
    !linkedProject &&
      displayTree &&
      (!displayTree.children || displayTree.children.length === 0),
  );

  const requestModalTree: RequestModalNode = useMemo(() => {
    const rootTier = Number((tier || "tier1").replace("tier", "")) || 1;
    const convert = (node: SupplierNode, depth: number): RequestModalNode => {
      const tid = rootTier + depth;
      const parsedNodeId = node.id.startsWith("n-") ? Number(node.id.slice(2)) : null;
      return {
        id: node.id,
        nodeId: Number.isFinite(parsedNodeId) ? parsedNodeId : null,
        name: node.name,
        tier: `tier${tid}`,
        children: (node.children ?? []).map((c) => convert(c, depth + 1)),
      };
    };
    if (displayTree) return convert(displayTree, 0);
    return { id: "root", nodeId: null, name: "-", tier: "tier0" };
  }, [displayTree, tier]);

  const isTargetSelectableByPolicy = (depthFromRoot: number) => {
    if (tier === 'tier1') return depthFromRoot >= 2;
    return depthFromRoot === 2;
  };

  const collectSelectableTargetIds = (node: RequestModalNode, depth: number = 0): string[] => {
    const result: string[] = [];
    if (depth >= 1 && isTargetSelectableByPolicy(depth)) result.push(node.id);
    if (node.children) {
      node.children.forEach((c) => result.push(...collectSelectableTargetIds(c, depth + 1)));
    }
    return result;
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

  const handleSearch = () => {
    if (!period?.trim()) return; // 필수 조건 미충족 시 무시
    setShowResults(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('show', 'true');
    router.replace(`${pathname}?${params.toString()}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "완료":
        return { bg: "#E8F5E9", text: "#4CAF50" };
      case "검토중":
        return { bg: "#FFF4E6", text: "#FF9800" };
      case "미제출":
        return { bg: "#FFEBEE", text: "#F44336" };
      default:
        return { bg: "#F5F5F5", text: "#757575" };
    }
  };

  const getPcfStatusColor = (status: string) => {
    switch (status) {
      case "완료":
        return { bg: "#E8F5E9", text: "#4CAF50" };
      case "검증중":
        return { bg: "#E3F2FD", text: "#2196F3" };
      case "계산 대기":
        return { bg: "#FFF9C4", text: "#FF9800" };
      case "미작성":
        return { bg: "#F3F4F6", text: "#6B7280" };
      case "미제출":
        return { bg: "#FFEBEE", text: "#F44336" };
      default:
        return { bg: "#F5F5F5", text: "#757575" };
    }
  };

  // 하위 협력사 중 PCF 미산정 또는 미제출이 있는지
  const hasMissingChildPcf = (supplier: SupplierNode): boolean => {
    if (!supplier.children || supplier.children.length === 0) return false;
    return supplier.children.some(
      (c) => c.pcfResult === null || hasMissingChildPcf(c)
    );
  };

  // Check if all children are ready for upstream calculation
  const isUpstreamReady = (supplier: SupplierNode): boolean => {
    if (!supplier.children || supplier.children.length === 0) {
      // No children means this is a leaf node - always ready
      return true;
    }
    // All children must have PCF status "완료" for upstream to be ready
    return supplier.children.every(child => child.pcfStatus === "완료");
  };

  // PCF 상태 배지 - 원청사(상태 열) 스타일: 데이터 미제출, 하위 데이터 부족, PCF 계산 완료
  const getPcfUnifiedStatusBadge = (supplier: SupplierNode) => {
    const hasChildren = supplier.children && supplier.children.length > 0;
    const upstreamReady = isUpstreamReady(supplier);

    if (supplier.pcfStatus === "미작성") {
      return (
        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
          미작성
        </span>
      );
    }
    if (supplier.pcfStatus === "미제출") {
      return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">데이터 미제출</span>;
    }
    if (hasChildren && !upstreamReady) {
      return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />하위 데이터 부족</span>;
    }
    if (supplier.pcfStatus === "계산 대기") {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" />계산 대기</span>;
    }
    if (supplier.pcfStatus === "검증중") {
      return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" />검증중</span>;
    }
    if (supplier.pcfStatus === "완료" && supplier.pcfResult === null) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" />계산 대기</span>;
    }
    return (
      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        PCF 산정 완료
      </span>
    );
  };

  const renderSupplierRow = (supplier: SupplierNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(supplier.id);
    const hasChildren = supplier.children && supplier.children.length > 0;
    /* 회사명 폭 제한, 국가~상세보기 열이 나머지 공간 균등 분배 */
    const gridCols = 'minmax(220px, 320px) minmax(100px, 1fr) minmax(120px, 1fr) minmax(130px, 1fr) minmax(120px, 1fr) minmax(100px, 1fr)';

    return (
      <div key={supplier.id}>
        <div 
          className="grid items-center gap-x-2 py-4 pr-4 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors w-full min-w-0"
          style={{ gridTemplateColumns: gridCols }}
        >
          {/* 회사명 with expand/collapse - indent는 이 셀에만 적용 */}
          <div className="flex items-center gap-2 min-w-0" style={{ paddingLeft: level * 40 }}>
            {hasChildren ? (
              <button
                onClick={() => toggleNode(supplier.id)}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                ) : (
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
                )}
              </button>
            ) : (
              <div className="w-6 flex-shrink-0" />
            )}
            <span 
              className="truncate"
              style={{ 
                color: supplier.isOwn ? 'var(--aifix-primary)' : 'var(--aifix-navy)', 
                fontWeight: supplier.isOwn ? 700 : 500,
                fontSize: '14px'
              }}
            >
              {supplier.name}
            </span>
          </div>

          {/* 국가 */}
          <div className="min-w-0">
            <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
              {supplier.country}
            </span>
          </div>

          {/* 제품 유형 */}
          <div className="min-w-0 truncate">
            <span style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
              {supplier.type}
            </span>
          </div>

          {/* PCF 결과 (kg CO₂e) - 원청사 형식 */}
          <div
            className={`text-center min-w-0 flex flex-col items-center justify-center gap-0.5 ${supplier.isOwn ? 'text-[#00B4FF]' : 'text-gray-900'}`}
          >
            {supplier.pcfResult !== null ? (
              <>
                <span className={`font-medium ${supplier.isOwn ? 'font-bold' : ''}`}>
                  {supplier.pcfResult.toLocaleString()} kg CO₂e
                </span>
                {hasMissingChildPcf(supplier) && (
                  <span
                    className="text-xs text-orange-600 font-medium"
                    title="하위 협력사 데이터 미반영, 자사·운송·일부 하위 기준 산정"
                  >
                    부분 산정
                  </span>
                )}
              </>
            ) : (
              '미산정'
            )}
          </div>

          {/* 데이터 상태 - 중앙 정렬 */}
          <div className="min-w-0 flex justify-center">
            {getPcfUnifiedStatusBadge(supplier)}
          </div>

          {/* 상세보기 - 중앙 정렬 */}
          <div className="min-w-0 flex justify-center">
            <button
              onClick={() => {
                // 뒤로가기 시 조회조건 복원을 위해 저장
                try {
                  sessionStorage.setItem(DATA_MGMT_FILTER_STORAGE_KEY, JSON.stringify({
                    period,
                    showResults,
                    expandedNodes: Array.from(expandedNodes),
                  }));
                } catch { /* ignore */ }
                // supplierId를 행별 id로 넘겨서 상세 화면에서 회사명이 올바르게 보이도록 합니다.
                const supplierKey = supplier.isOwn ? "own" : supplier.id;

                router.push(
                  `/projects/${projectId}/suppliers/${supplierKey}?backTab=data-mgmt&supplierName=${encodeURIComponent(supplier.name)}&supplierCountry=${encodeURIComponent(supplier.country)}&supplierType=${encodeURIComponent(supplier.type)}&supplierVolume=${encodeURIComponent(supplier.volume)}&supplierStatus=${encodeURIComponent(supplier.dataStatus)}&supplierPcfStatus=${encodeURIComponent(supplier.pcfStatus)}`
                );
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
              style={{ color: 'var(--aifix-primary)', fontWeight: 600 }}
            >
              <Eye className="w-4 h-4" />
              <span style={{ fontSize: '14px' }}>상세보기</span>
            </button>
          </div>
        </div>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && supplier.children!.map(child => 
          renderSupplierRow(child, level + 1)
        )}
      </div>
    );
  };

  return (
    <div className="pt-8 min-w-0">
      <div style={{ minHeight: '600px' }} className="min-w-0">
      <>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          데이터 관리
        </h2>
        <p style={{ color: 'var(--aifix-gray)' }}>
          자사 데이터를 입력하고 하위 협력사 데이터를 확인하세요
        </p>
      </div>

      {/* Search Conditions Card */}
      <div className="bg-white rounded-[20px] p-8 mb-8" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
        <h3 className="text-xl mb-6" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          조회 조건
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Period Selector - 필수 */}
          <div>
            <label className="block mb-3" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
              기간 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <MonthPicker
              value={period}
              onChange={(v) => {
                setPeriod(v);
                setShowResults(false);
              }}
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSearch}
            disabled={!period?.trim()}
            className="px-8 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
            style={{ 
              background: period?.trim() 
                ? 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)' 
                : '#9CA3AF',
              fontWeight: 600 
            }}
          >
            조회
          </button>
        </div>
      </div>

      {/* Results Section - 필수 조건(기간) 선택 시에만 표시 */}
      {showResults && period?.trim() && (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              공급망 데이터
            </h3>
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 hover:opacity-90"
              style={{
                background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
                boxShadow: '0px 4px 12px rgba(91, 59, 250, 0.2)',
                color: 'white',
                fontWeight: 600,
              }}
            >
              <Send className="w-5 h-5" />
              하위 협력사 데이터 요청
            </button>
          </div>

          {/* Supply Chain Tree Table - Grid 레이아웃으로 열 정렬, overflow-x-auto로 가로 스크롤 */}
          <div className="bg-white rounded-[20px] overflow-x-auto overflow-y-visible" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)", minWidth: 'min-content' }}>
            {/* Table Header - 데이터 행과 동일한 gridTemplateColumns */}
            <div
              className="grid items-center gap-x-2 py-4 pr-4 px-4 border-b-2 border-gray-200 w-full min-w-0"
              style={{ backgroundColor: '#F8F9FA', gridTemplateColumns: 'minmax(220px, 320px) minmax(100px, 1fr) minmax(120px, 1fr) minmax(130px, 1fr) minmax(120px, 1fr) minmax(100px, 1fr)' }}
            >
              <div>
                <span style={{ color: 'var(--aifix-navy)', fontWeight: 700, fontSize: '14px' }}>
                  회사명
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--aifix-navy)', fontWeight: 700, fontSize: '14px' }}>
                  국가
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--aifix-navy)', fontWeight: 700, fontSize: '14px' }}>
                  제품유형
                </span>
              </div>
              <div className="text-center">
                <span style={{ color: 'var(--aifix-navy)', fontWeight: 700, fontSize: '14px' }}>
                  PCF 결과 (kg CO₂e)
                </span>
              </div>
              <div className="text-center">
                <span style={{ color: 'var(--aifix-navy)', fontWeight: 700, fontSize: '14px' }}>
                  데이터 상태
                </span>
              </div>
              <div className="text-center">
                <span style={{ color: 'var(--aifix-navy)', fontWeight: 700, fontSize: '14px' }}>
                  상세보기
                </span>
              </div>
            </div>

            {/* Table Body */}
            <div>
              {linkedProject && apiLoading && !displayTree ? (
                <div className="py-16 text-center text-gray-500">공급망 데이터를 불러오는 중…</div>
              ) : displayTree ? (
                renderSupplierRow(displayTree)
              ) : linkedProject ? (
                <div className="py-16 text-center text-gray-500">트리를 표시할 수 없습니다.</div>
              ) : null}
            </div>
          </div>

          {/* PCF Status Info */}
          <div 
            className="rounded-xl p-4 mt-6 flex items-start gap-3"
            style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}
          >
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#0284C7' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#0369A1', marginBottom: '4px' }}>
                PCF 계산 의존 구조
              </div>
              <div style={{ fontSize: '14px', color: '#0284C7' }}>
                행별 상태: 해당 월 데이터를 아직 만들지 않았으면 <strong>미작성</strong>, 저장(초안)은 되었으나 PCF 산정 전이면 <strong>계산 대기</strong>, 산정이 끝나면 <strong>PCF 산정 완료</strong>입니다. 하위 협력사 PCF가 모두 완료되어야 상위 산정이 가능하며, 하위에 미작성·미제출·검증중·계산 대기가 있으면 상위는 <strong>하위 데이터 부족</strong>으로 표시됩니다.
              </div>
            </div>
          </div>

          {/* Empty State (목업 전용: 하위 없는 리프 루트) */}
          {showLeafEmptyBanner ? (
            <div className="text-center py-24 bg-white rounded-[20px] mt-8" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
              <div 
                className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
              >
                <Search className="w-12 h-12" style={{ color: 'var(--aifix-secondary)' }} />
              </div>
              <h3 className="text-2xl mb-2" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                선택한 기간에 데이터가 없습니다
              </h3>
              <p style={{ color: 'var(--aifix-gray)' }}>
                다른 기간을 선택하거나 데이터를 입력해주세요
              </p>
            </div>
          ) : null}
        </>
      )}

      {/* 데이터 요청 모달 */}
      {showRequestModal && (() => {
        const eligibleTargetIds = collectSelectableTargetIds(requestModalTree, 0);
        const collectTargetsByTier = (node: RequestModalNode, depth: number = 0): Record<string, string[]> => {
          const out: Record<string, string[]> = {};
          const walk = (n: RequestModalNode, d: number) => {
            if (d >= 1 && isTargetSelectableByPolicy(d)) {
              out[n.tier] = out[n.tier] ?? [];
              out[n.tier].push(n.id);
            }
            if (n.children) n.children.forEach((c) => walk(c, d + 1));
          };
          walk(node, depth);
          return out;
        };
        const targetsByTier = collectTargetsByTier(requestModalTree, 0);
        const tier2Ids = targetsByTier['tier2'] ?? [];
        const tier3Ids = targetsByTier['tier3'] ?? [];

        const toggleTarget = (id: string, checked: boolean) => {
          setRequestTargets((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
          });
        };

        const toggleRequestNodeExpand = (id: string) => {
          setRequestExpandedNodeIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          });
        };

        const renderSelectorNode = (node: RequestModalNode, depthFromRoot: number) => {
          const selectable = isTargetSelectableByPolicy(depthFromRoot);
          const disabled = !selectable;
          const checked = requestTargets.has(node.id);
          const isBase = node.id === 'root';
          const hasChildren = Boolean(node.children && node.children.length > 0);
          const isExpanded = requestExpandedNodeIds.has(node.id);

          return (
            <div key={node.id} style={{ marginLeft: depthFromRoot * 18 }}>
              <div
                className="flex items-center gap-2 py-1"
                style={{ opacity: disabled && !isBase ? 0.45 : 1 }}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    className="rounded p-0.5 hover:bg-gray-100"
                    onClick={() => toggleRequestNodeExpand(node.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--aifix-gray)" }} />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--aifix-gray)" }} />
                    )}
                  </button>
                ) : (
                  <div className="w-4 h-4" />
                )}
                {isBase ? (
                  <div className="w-4 h-4" />
                ) : (
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => toggleTarget(node.id, e.target.checked)}
                  />
                )}
                <Building2
                  className="w-4 h-4"
                  style={{
                    color: node.tier === 'tier1' ? '#1A439C' : node.tier === 'tier2' ? '#00A3B5' : node.tier === 'tier4' ? '#9C27B0' : '#6B23C0',
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--aifix-navy)' }}>
                  {node.name}
                </span>
              </div>
              {hasChildren && isExpanded && (
                <div>
                  {node.children.map((child) => renderSelectorNode(child, depthFromRoot + 1))}
                </div>
              )}
            </div>
          );
        };

        const handleSendRequests = async () => {
          const targetIds = Array.from(requestTargets);
          if (targetIds.length === 0) {
            alert('요청 대상을 선택해주세요.');
            return;
          }
          if (!requestDueDate) {
            alert('제출 기한을 선택해주세요.');
            return;
          }
          if (!linkedProject) {
            alert('실데이터 프로젝트에서만 요청 전송이 가능합니다.');
            return;
          }
          if (!linkedProject.productVariantId) {
            alert('제품 변형 정보가 없어 요청을 전송할 수 없습니다.');
            return;
          }
          const ym = periodToYmKorean(period);
          if (!ym) {
            alert('요청 대상 월을 확인할 수 없습니다.');
            return;
          }
          const [ys, ms] = ym.split("-");
          const reportingYear = parseInt(ys, 10);
          const reportingMonth = parseInt(ms, 10);
          const idToNode = new Map<string, RequestModalNode>();
          const walk = (n: RequestModalNode) => {
            idToNode.set(n.id, n);
            n.children?.forEach(walk);
          };
          walk(requestModalTree);
          const targetNodeIds = targetIds
            .map((id) => idToNode.get(id)?.nodeId ?? null)
            .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
          if (targetNodeIds.length === 0) {
            alert('요청 가능한 공급망 노드가 없습니다.');
            return;
          }
          const payload: SupDataRequestCreateBody = {
            project_id: linkedProject.projectId,
            product_id: linkedProject.productId,
            product_variant_id: linkedProject.productVariantId,
            reporting_year: reportingYear,
            reporting_month: reportingMonth,
            requester_supply_chain_node_id: requestModalTree.nodeId,
            request_mode: "chain",
            message: requestMessage || null,
            due_date: requestDueDate,
            target_supply_chain_node_ids: targetNodeIds,
          };
          try {
            await postSupDataRequest(payload);
            toast.success(`${targetNodeIds.length}개 대상에게 데이터 요청을 전송했습니다.`);
            setShowRequestModal(false);
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            toast.error(`데이터 요청 전송 실패: ${msg}`);
          }
        };

        const baseSubtreeRoot = requestModalTree;

        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRequestModal(false)}
          >
            <div
              className="bg-white rounded-[20px] w-full max-w-6xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-8 py-6 flex items-start justify-between border-b border-gray-100">
                <div>
                  <div className="text-xl font-bold" style={{ color: 'var(--aifix-navy)' }}>
                    데이터 요청 모달
                  </div>
                  <div className="text-sm" style={{ color: 'var(--aifix-gray)', marginTop: 4 }}>
                    {tier === 'tier1'
                      ? '선택한 하위 공급망에 동시 요청을 보냅니다.'
                      : '현재 차수에서는 직하위 협력사에게만 데이터 요청이 가능합니다.'}
                  </div>
                </div>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 transition-all"
                  onClick={() => setShowRequestModal(false)}
                >
                  <XCircle className="w-5 h-5" style={{ color: 'var(--aifix-gray)' }} />
                </button>
              </div>

              <div className="px-8 py-6 overflow-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-6">
                    <div className="text-sm font-semibold mb-3" style={{ color: 'var(--aifix-navy)' }}>
                      ① 요청 대상 선택
                    </div>
                    <div className="flex gap-2 mb-3">
                      <button
                        className="px-4 py-2 rounded-lg text-xs transition-all"
                        style={{ border: '1px solid var(--aifix-primary)', color: 'var(--aifix-primary)', fontWeight: 700 }}
                        onClick={() => setRequestTargets(new Set(eligibleTargetIds))}
                      >
                        전체 선택
                      </button>
                      {tier === 'tier1' && (
                        <>
                          <button
                            className="px-4 py-2 rounded-lg text-xs transition-all"
                            style={{ border: '1px solid var(--aifix-gray)', color: 'var(--aifix-gray)', fontWeight: 700 }}
                            onClick={() => setRequestTargets(new Set(tier2Ids))}
                            disabled={tier2Ids.length === 0}
                          >
                            2차만
                          </button>
                          <button
                            className="px-4 py-2 rounded-lg text-xs transition-all"
                            style={{ border: '1px solid var(--aifix-gray)', color: 'var(--aifix-gray)', fontWeight: 700 }}
                            onClick={() => setRequestTargets(new Set(tier3Ids))}
                            disabled={tier3Ids.length === 0}
                          >
                            3차만
                          </button>
                        </>
                      )}
                    </div>
                    <div
                      className="border rounded-[16px] p-4"
                      style={{ borderColor: 'var(--aifix-secondary-light)' }}
                    >
                      <div className="text-xs mb-3" style={{ color: 'var(--aifix-gray)' }}>
                        현재 선택된 노드: <span style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>{baseSubtreeRoot.name}</span>
                      </div>
                      <div className="max-h-[300px] overflow-auto pr-2">
                        {renderSelectorNode(requestModalTree, 0)}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-6">
                    <div className="text-sm font-semibold mb-3" style={{ color: 'var(--aifix-navy)' }}>
                      ② 요청 메시지 입력
                    </div>
                    <textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="요청 목적 및 기한을 입력하세요"
                      className="w-full rounded-[16px] border border-gray-200 p-4 text-sm"
                      style={{ minHeight: 110, outline: 'none' }}
                    />
                    <div className="mt-6">
                      <div className="text-sm font-semibold mb-3" style={{ color: 'var(--aifix-navy)' }}>
                        ③ 제출 기한 설정
                      </div>
                      <input
                        type="date"
                        value={requestDueDate}
                        onChange={(e) => setRequestDueDate(e.target.value)}
                        className="w-full rounded-[16px] border border-gray-200 p-3 text-sm"
                        style={{ outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  className="px-6 py-3 rounded-xl transition-all"
                  style={{ border: '1px solid var(--aifix-gray)', color: 'var(--aifix-gray)', fontWeight: 700 }}
                  onClick={() => setShowRequestModal(false)}
                >
                  취소
                </button>
                <button
                  className="px-6 py-3 rounded-xl transition-all text-white"
                  style={{ background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)', fontWeight: 800 }}
                  onClick={handleSendRequests}
                >
                  요청 보내기
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      </>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  Play,
  RefreshCw,
  Send,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  XCircle,
  BarChart3,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity
} from "lucide-react";
import { MonthPicker } from "../MonthPicker";
import {
  getSupPcfReadiness,
  getSupPcfRuns,
  getSupPcfTransferReadiness,
  postSupPcfRunExecute,
  postSupPcfTransferShare,
  type PcfReadinessSupplierResponse,
  type PcfRunListItemDto,
  type SupPcfTransferReadinessResponse,
} from "@/lib/api/pcf";
import { restoreSupSessionFromCookie, AIFIXR_SESSION_UPDATED_EVENT } from "@/lib/api/client";
import { getMyProjectDetail, type SupplierProject } from "@/lib/api/supply-chain";

type TierType = "tier1" | "tier2" | "tier3";
type ReadinessStatus = "complete" | "partial" | "incomplete";

interface PCFCalculationProps {
  tier: TierType;
  supplierType?: string;
}

interface CalculationHistoryItem {
  id: string;
  product: string;
  bomVersion: string;
  period: string;
  dqr: string;
  totalEmission: string;
  kgBasedPcf: string;
  status: "complete" | "partial" | "processing";
  date: string;
}

function mapApiRunKindToSupplyVersion(runKind: string): string {
  const k = (runKind || "").toLowerCase();
  if (k === "batch") return "부분산정";
  if (k === "node_rollup") return "최종산정";
  return runKind.trim() || "—";
}

function mapApiRunStateToUi(
  runKind: string,
  status: string,
): "complete" | "partial" | "processing" {
  const s = (status || "").toLowerCase();
  const k = (runKind || "").toLowerCase();
  if (s === "pending") return "processing";
  if (s === "success" && k === "node_rollup") return "complete";
  if (s === "success" && k === "batch") return "partial";
  return "processing";
}

function mapPcfRunToHistoryItem(
  r: PcfRunListItemDto,
  dqrHint: string | null,
): CalculationHistoryItem {
  const period = `${r.reporting_year}-${String(r.reporting_month).padStart(2, "0")}`;
  const total =
    r.total_co2e_kg != null && Number.isFinite(Number(r.total_co2e_kg))
      ? `${Number(r.total_co2e_kg).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg CO₂e`
      : "—";
  const kgPcf =
    r.pcf_per_product_mass_kg != null && Number.isFinite(Number(r.pcf_per_product_mass_kg))
      ? Number(r.pcf_per_product_mass_kg).toFixed(4)
      : "—";
  const when = r.finished_at ?? r.created_at ?? "";
  const dateStr = when ? when.slice(0, 10) : "—";
  return {
    id: r.display_id?.trim() || `run-${r.id}`,
    product: (r.product_name ?? "").trim() || "—",
    bomVersion: (r.bom_label ?? "").trim() || "—",
    period,
    dqr: dqrHint ?? "—",
    totalEmission: total,
    kgBasedPcf: kgPcf,
    status: mapApiRunStateToUi(r.run_kind, r.status),
    date: dateStr,
  };
}

function getRunTimestampMs(r: PcfRunListItemDto): number {
  const raw = r.finished_at ?? r.created_at;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

function getRunPriorityScore(r: PcfRunListItemDto): number {
  const kind = (r.run_kind || "").toLowerCase();
  const status = (r.status || "").toLowerCase();
  const isFinalKind = kind === "node_rollup";
  const isDone = status === "success" || status === "completed";
  const isPending = status === "pending";

  // 동일 대상일 때 최종산정(node_rollup)을 부분산정(batch)보다 우선 노출
  return (isFinalKind ? 100 : 10) + (isDone ? 2 : isPending ? 1 : 0);
}

function buildHistoryDisplayRuns(runs: PcfRunListItemDto[]): PcfRunListItemDto[] {
  const byTarget = new Map<string, PcfRunListItemDto>();
  for (const r of runs) {
    const key = [
      r.project_id,
      r.product_id,
      r.product_variant_id ?? "na",
      r.reporting_year,
      r.reporting_month,
    ].join(":");
    const prev = byTarget.get(key);
    if (!prev) {
      byTarget.set(key, r);
      continue;
    }
    const prevScore = getRunPriorityScore(prev);
    const nextScore = getRunPriorityScore(r);
    if (nextScore > prevScore) {
      byTarget.set(key, r);
      continue;
    }
    if (nextScore === prevScore && getRunTimestampMs(r) >= getRunTimestampMs(prev)) {
      byTarget.set(key, r);
    }
  }
  return Array.from(byTarget.values()).sort((a, b) => getRunTimestampMs(b) - getRunTimestampMs(a));
}

interface ComputationTreeNode {
  id: string;
  label: string;
  type: "product" | "own" | "supplier" | "item";
  emission: string;
  tier?: string;
  children?: ComputationTreeNode[];
  expanded?: boolean;
}

function periodToYm(period: string): string | null {
  const m = period.match(/(\d{4})\s*년\s*(\d{1,2})\s*월/);
  if (!m) return null;
  return `${m[1]}-${String(parseInt(m[2], 10)).padStart(2, '0')}`;
}

function defaultPreviousMonthKorean(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export function PCFCalculation({ tier, supplierType = "" }: PCFCalculationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isTransmitted, setIsTransmitted] = useState(false);
  const [lastRun, setLastRun] = useState<'none' | 'partial' | 'final'>('none');
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPreviousMonthKorean);
  /** PCF 계산 결과 이력 테이블에서 선택한 행 — 상세보기 패널에 그대로 반영 */
  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<CalculationHistoryItem | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root", "supplier-group"]));
  /** `GET /pcf/readiness/supplier` — 원청 PCF 준비도와 동일한 백엔드 로직 */
  const [supReadiness, setSupReadiness] = useState<PcfReadinessSupplierResponse | null>(null);
  const [supReadinessLoading, setSupReadinessLoading] = useState(false);
  const [supTransferReadiness, setSupTransferReadiness] = useState<SupPcfTransferReadinessResponse | null>(null);
  /** `/projects/real-{id}` 만 있고 URL에 dm* 쿼리가 없을 때 `getMyProjectDetail`로 보완 (데이터관리·SupplierDetail과 동일 소스) */
  const [resolvedProject, setResolvedProject] = useState<SupplierProject | null>(null);
  const [resolvedProjectLoading, setResolvedProjectLoading] = useState(false);
  const [pcfRuns, setPcfRuns] = useState<PcfRunListItemDto[]>([]);
  const [pcfRunsLoading, setPcfRunsLoading] = useState(false);
  const [pcfTab, setPcfTab] = useState<"calculation" | "history">("calculation");

  const tierName = tier === "tier1" ? "1차" : tier === "tier2" ? "2차" : "3차";
  const isMiningSmelter = supplierType.trim() === "채굴/제련사";
  const hasDownstream = !isMiningSmelter && (tier === "tier1" || tier === "tier2");
  const upperCompanyName = tier === "tier1" ? "원청사 A" : tier === "tier2" ? "상위 1차 협력사" : "상위 2차 협력사";

  const ym = periodToYm(selectedPeriod);

  const projectPkFromPath = useMemo(() => {
    const m = /\/projects\/real-(\d+)/i.exec(pathname ?? "");
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [pathname]);

  useEffect(() => {
    const pickInt = (keys: string[]): number | null => {
      for (const k of keys) {
        const v = searchParams.get(k);
        if (!v) continue;
        const n = parseInt(v, 10);
        if (Number.isFinite(n) && n > 0) return n;
      }
      return null;
    };
    const productFromUrl = pickInt(["productId", "dmProductId"]);
    const variantFromUrl = pickInt(["productVariantId", "dmProductVariantId", "dmVariantId"]);
    const fullFromUrl = productFromUrl != null && variantFromUrl != null;

    if (!projectPkFromPath) {
      setResolvedProject(null);
      setResolvedProjectLoading(false);
      return;
    }
    if (fullFromUrl) {
      setResolvedProject(null);
      setResolvedProjectLoading(false);
      return;
    }

    let cancelled = false;
    setResolvedProjectLoading(true);
    setResolvedProject(null);
    void (async () => {
      try {
        await restoreSupSessionFromCookie();
        const d = await getMyProjectDetail(projectPkFromPath);
        if (!cancelled) setResolvedProject(d);
      } catch {
        if (!cancelled) setResolvedProject(null);
      } finally {
        if (!cancelled) setResolvedProjectLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectPkFromPath, searchParams]);

  const runContext = useMemo(() => {
    const pickInt = (keys: string[]): number | null => {
      for (const k of keys) {
        const v = searchParams.get(k);
        if (!v) continue;
        const n = parseInt(v, 10);
        if (Number.isFinite(n) && n > 0) return n;
      }
      return null;
    };
    const projectId = pickInt(["projectId"]) ?? projectPkFromPath;
    const productId =
      pickInt(["productId", "dmProductId"]) ??
      (resolvedProject?.product_id != null && resolvedProject.product_id >= 1
        ? resolvedProject.product_id
        : null);
    const variantFromUrl = pickInt(["productVariantId", "dmProductVariantId", "dmVariantId"]);
    const fromDetail = resolvedProject?.product_variant_id;
    const productVariantId =
      variantFromUrl ??
      (fromDetail != null && Number.isFinite(fromDetail) && fromDetail >= 1 ? fromDetail : null);
    if (!projectId || !productId || !productVariantId || !ym) return null;
    const [ys, ms] = ym.split("-");
    const reportingYear = parseInt(ys, 10);
    const reportingMonth = parseInt(ms, 10);
    if (!Number.isFinite(reportingYear) || !Number.isFinite(reportingMonth)) return null;
    return {
      project_id: projectId,
      product_id: productId,
      product_variant_id: productVariantId,
      reporting_year: reportingYear,
      reporting_month: reportingMonth,
    };
  }, [searchParams, ym, projectPkFromPath, resolvedProject]);

  const loadPcfRuns = useCallback(async () => {
    if (!runContext) {
      setPcfRuns([]);
      setPcfRunsLoading(false);
      return;
    }
    setPcfRunsLoading(true);
    try {
      await restoreSupSessionFromCookie();
      const list = await getSupPcfRuns({
        project_id: runContext.project_id,
        product_id: runContext.product_id,
        product_variant_id: runContext.product_variant_id,
        reporting_year: pcfTab === "calculation" ? runContext.reporting_year : undefined,
        reporting_month: pcfTab === "calculation" ? runContext.reporting_month : undefined,
        limit: 50,
      });
      setPcfRuns(list);
    } catch {
      setPcfRuns([]);
    } finally {
      setPcfRunsLoading(false);
    }
  }, [runContext, pcfTab]);

  useEffect(() => {
    void loadPcfRuns();
  }, [loadPcfRuns]);

  useEffect(() => {
    if (!runContext) {
      setSupReadiness(null);
      setSupReadinessLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setSupReadiness(null);
      setSupReadinessLoading(true);
      try {
        await restoreSupSessionFromCookie();
        const r = await getSupPcfReadiness({
          project_id: runContext.project_id,
          product_id: runContext.product_id,
          product_variant_id: runContext.product_variant_id,
          reporting_year: runContext.reporting_year,
          reporting_month: runContext.reporting_month,
        });
        if (!cancelled) setSupReadiness(r);
      } catch {
        if (!cancelled) setSupReadiness(null);
      } finally {
        if (!cancelled) setSupReadinessLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runContext]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSession = () => {
      if (!runContext) return;
      void (async () => {
        setSupReadinessLoading(true);
        try {
          await restoreSupSessionFromCookie();
          const r = await getSupPcfReadiness({
            project_id: runContext.project_id,
            product_id: runContext.product_id,
            product_variant_id: runContext.product_variant_id,
            reporting_year: runContext.reporting_year,
            reporting_month: runContext.reporting_month,
          });
          setSupReadiness(r);
          await loadPcfRuns();
        } catch {
          setSupReadiness(null);
        } finally {
          setSupReadinessLoading(false);
        }
      })();
    };
    window.addEventListener(AIFIXR_SESSION_UPDATED_EVENT, onSession);
    return () => window.removeEventListener(AIFIXR_SESSION_UPDATED_EVENT, onSession);
  }, [runContext, loadPcfRuns]);

  useEffect(() => {
    if (!runContext) {
      setLastRun('none');
      setIsTransmitted(false);
      return;
    }
    const isDone = (s?: string) => {
      const v = (s || "").toLowerCase();
      return v === "completed" || v === "success";
    };
    const hasFinal = pcfRuns.some((r) => isDone(r.status) && (r.run_kind || "").toLowerCase() === "node_rollup");
    const hasPartial = pcfRuns.some((r) => isDone(r.status) && (r.run_kind || "").toLowerCase() === "batch");
    setLastRun(hasFinal ? "final" : hasPartial ? "partial" : "none");
  }, [runContext, pcfRuns]);

  useEffect(() => {
    if (!runContext) {
      setSupTransferReadiness(null);
      setIsTransmitted(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await restoreSupSessionFromCookie();
        const tr = await getSupPcfTransferReadiness(runContext);
        if (!cancelled) {
          setSupTransferReadiness(tr);
          setIsTransmitted(Boolean(tr.already_transferred));
        }
      } catch {
        if (!cancelled) {
          setSupTransferReadiness(null);
          setIsTransmitted(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runContext]);

  /** API 기준 준비 단계 (원청 OPR readiness와 동일한 의미) */
  const readinessStatusForUi = useMemo((): "complete" | "partial" | "incomplete" => {
    if (!runContext) return "partial";
    if (!supReadiness) return "incomplete";
    if (!supReadiness.own_pcf_input_ready) return "incomplete";
    if (supReadiness.child_total === 0 || supReadiness.all_children_shared) return "complete";
    return "partial";
  }, [runContext, supReadiness]);

  const readinessCards = useMemo(() => {
    type CardRow = {
      id: string;
      label: string;
      status: ReadinessStatus;
      value: string;
      icon: typeof CheckCircle;
      iconColor: string;
      statusColor: string;
    };
    const calcStage = (() => {
      if (lastRun === "final") {
        return {
          status: "complete" as ReadinessStatus,
          value: "최종산정 완료",
          icon: CheckCircle,
          iconColor: "#4CAF50",
          statusColor: "#4CAF50",
        };
      }
      if (lastRun === "partial") {
        return {
          status: "partial" as ReadinessStatus,
          value: "최종산정 대기",
          icon: Clock,
          iconColor: "#FF9800",
          statusColor: "#FF9800",
        };
      }
      return {
        status: "partial" as ReadinessStatus,
        value: "부분산정 대기",
        icon: AlertCircle,
        iconColor: "#9E9E9E",
        statusColor: "#9E9E9E",
      };
    })();

    if (!runContext) {
      if (projectPkFromPath && resolvedProjectLoading) {
        return [
          {
            id: "own-data",
            label: "자사 데이터",
            status: "partial" as ReadinessStatus,
            value: "불러오는 중…",
            icon: Activity,
            iconColor: "#9E9E9E",
            statusColor: "#9E9E9E",
          },
          {
            id: "supplier-data",
            label: "하위 협력사 데이터",
            status: "partial" as ReadinessStatus,
            value: "불러오는 중…",
            icon: Activity,
            iconColor: "#9E9E9E",
            statusColor: "#9E9E9E",
          },
          {
            id: "coverage",
            label: "데이터 커버리지",
            status: "partial" as ReadinessStatus,
            value: "불러오는 중…",
            icon: Activity,
            iconColor: "#9E9E9E",
            statusColor: "#9E9E9E",
          },
          {
            id: "calc-stage",
            label: "산정 상태",
            status: calcStage.status,
            value: calcStage.value,
            icon: calcStage.icon,
            iconColor: calcStage.iconColor,
            statusColor: calcStage.statusColor,
          },
        ] satisfies CardRow[];
      }
      return [
        {
          id: "own-data",
          label: "자사 데이터",
          status: "partial" as ReadinessStatus,
          value: "—",
          icon: Activity,
          iconColor: "#9E9E9E",
          statusColor: "#9E9E9E",
        },
        {
          id: "supplier-data",
          label: "하위 협력사 데이터",
          status: "partial" as ReadinessStatus,
          value: "—",
          icon: Activity,
          iconColor: "#9E9E9E",
          statusColor: "#9E9E9E",
        },
        {
          id: "coverage",
          label: "데이터 커버리지",
          status: "partial" as ReadinessStatus,
          value: "—",
          icon: Activity,
          iconColor: "#9E9E9E",
          statusColor: "#9E9E9E",
        },
        {
          id: "calc-stage",
          label: "산정 상태",
          status: calcStage.status,
          value: calcStage.value,
          icon: calcStage.icon,
          iconColor: calcStage.iconColor,
          statusColor: calcStage.statusColor,
        },
      ] satisfies CardRow[];
    }

    if (supReadinessLoading) {
      return [
        {
          id: "own-data",
          label: "자사 데이터",
          status: "partial" as ReadinessStatus,
          value: "불러오는 중…",
          icon: Activity,
          iconColor: "#9E9E9E",
          statusColor: "#9E9E9E",
        },
        {
          id: "supplier-data",
          label: "하위 협력사 데이터",
          status: "partial" as ReadinessStatus,
          value: "불러오는 중…",
          icon: Activity,
          iconColor: "#9E9E9E",
          statusColor: "#9E9E9E",
        },
        {
          id: "coverage",
          label: "데이터 커버리지",
          status: "partial" as ReadinessStatus,
          value: "불러오는 중…",
          icon: Activity,
          iconColor: "#9E9E9E",
          statusColor: "#9E9E9E",
        },
        {
          id: "calc-stage",
          label: "산정 상태",
          status: calcStage.status,
          value: calcStage.value,
          icon: calcStage.icon,
          iconColor: calcStage.iconColor,
          statusColor: calcStage.statusColor,
        },
      ] satisfies CardRow[];
    }

    const r = supReadiness;
    if (!r) {
      return [
        {
          id: "own-data",
          label: "자사 데이터",
          status: "incomplete" as ReadinessStatus,
          value: "조회 실패",
          icon: XCircle,
          iconColor: "#F44336",
          statusColor: "#F44336",
        },
        {
          id: "supplier-data",
          label: "하위 협력사 데이터",
          status: "incomplete" as ReadinessStatus,
          value: "—",
          icon: AlertTriangle,
          iconColor: "#FF9800",
          statusColor: "#FF9800",
        },
        {
          id: "coverage",
          label: "데이터 커버리지",
          status: "incomplete" as ReadinessStatus,
          value: "—",
          icon: BarChart3,
          iconColor: "#9E9E9E",
          statusColor: "#9E9E9E",
        },
        {
          id: "calc-stage",
          label: "산정 상태",
          status: calcStage.status,
          value: calcStage.value,
          icon: calcStage.icon,
          iconColor: calcStage.iconColor,
          statusColor: calcStage.statusColor,
        },
      ] satisfies CardRow[];
    }

    const ownOk = r.own_pcf_input_ready;
    const downstreamValue = `${r.child_shared_count}/${r.child_total}`;
    const downstreamStatus: ReadinessStatus =
      r.child_total === 0 || r.all_children_shared ? "complete" : "partial";

    return [
      {
        id: "own-data",
        label: "자사 데이터",
        status: (ownOk ? "complete" : "incomplete") as ReadinessStatus,
        value: ownOk ? "완료" : "미완료",
        icon: ownOk ? CheckCircle : XCircle,
        iconColor: ownOk ? "#4CAF50" : "#F44336",
        statusColor: ownOk ? "#4CAF50" : "#F44336",
      },
      {
        id: "supplier-data",
        label: "하위 협력사 데이터",
        status: downstreamStatus,
        value: downstreamValue,
        icon: downstreamStatus === "complete" ? CheckCircle : AlertTriangle,
        iconColor: downstreamStatus === "complete" ? "#4CAF50" : "#FF9800",
        statusColor: downstreamStatus === "complete" ? "#4CAF50" : "#FF9800",
      },
      {
        id: "coverage",
        label: "데이터 커버리지",
        status: "complete" as ReadinessStatus,
        value: `${Number(r.data_coverage_pct).toFixed(1)}%`,
        icon: BarChart3,
        iconColor: "#00B4FF",
        statusColor: "#00B4FF",
      },
      {
        id: "calc-stage",
        label: "산정 상태",
        status: calcStage.status,
        value: calcStage.value,
        icon: calcStage.icon,
        iconColor: calcStage.iconColor,
        statusColor: calcStage.statusColor,
      },
    ] satisfies CardRow[];
  }, [runContext, supReadiness, supReadinessLoading, projectPkFromPath, resolvedProjectLoading, lastRun]);

  const calculationHistoryRows = useMemo(() => {
    const dqrHint =
      supReadiness != null && Number.isFinite(Number(supReadiness.avg_dqr))
        ? Number(supReadiness.avg_dqr).toFixed(1)
        : null;
    return buildHistoryDisplayRuns(pcfRuns).map((r) => mapPcfRunToHistoryItem(r, dqrHint));
  }, [pcfRuns, supReadiness]);

  // 계산 트리 데이터
  const getComputationTree = (): ComputationTreeNode => {
    if (tier === "tier1") {
      return {
        id: "root",
        label: "총 PCF",
        type: "product",
        emission: "32,420.3 kg CO₂e",
        children: [
          {
            id: "own",
            label: "자사 배출량",
            type: "own",
            emission: "8,240.5 kg CO₂e",
            children: [
              {
                id: "own-1",
                label: "전력 사용",
                type: "item",
                emission: "3,672 kg CO₂e"
              },
              {
                id: "own-2",
                label: "LNG 사용",
                type: "item",
                emission: "2,450 kg CO₂e"
              },
              {
                id: "own-3",
                label: "공정 배출",
                type: "item",
                emission: "1,520 kg CO₂e"
              },
              {
                id: "own-4",
                label: "시설 물류",
                type: "item",
                emission: "598.5 kg CO₂e"
              }
            ]
          },
          {
            id: "tier1-supplier-1",
            label: "Tier 1 - 한국레전더",
            type: "supplier",
            tier: "2차",
            emission: "15,200.8 kg CO₂e",
            children: [
              {
                id: "tier1-supplier-1-1",
                label: "리튬 분말",
                type: "item",
                emission: "8,500 kg CO₂e"
              },
              {
                id: "tier1-supplier-1-2",
                label: "흡수제 가공",
                type: "item",
                emission: "4,200.3 kg CO₂e"
              },
              {
                id: "tier1-supplier-1-3",
                label: "전력 사용",
                type: "item",
                emission: "2,500.5 kg CO₂e"
              }
            ]
          },
          {
            id: "tier1-supplier-2",
            label: "Tier 1 - 파일럿 네트로코시",
            type: "supplier",
            tier: "2차",
            emission: "5,800 kg CO₂e",
            children: [
              {
                id: "tier1-supplier-2-1",
                label: "BMS 제조",
                type: "item",
                emission: "3,600 kg CO₂e"
              },
              {
                id: "tier1-supplier-2-2",
                label: "운송",
                type: "item",
                emission: "2,200 kg CO₂e"
              }
            ]
          },
          {
            id: "tier2-supplier",
            label: "Tier 2 - 셈보스",
            type: "supplier",
            tier: "3차",
            emission: "3,179 kg CO₂e",
            children: [
              {
                id: "tier2-supplier-1",
                label: "리튬 제료",
                type: "item",
                emission: "2,100 kg CO₂e"
              },
              {
                id: "tier2-supplier-2",
                label: "운송 (철도 /후자)",
                type: "item",
                emission: "1,079 kg CO₂e"
              }
            ]
          }
        ]
      };
    } else if (tier === "tier2") {
      return {
        id: "root",
        label: "총 PCF",
        type: "product",
        emission: "18,620.5 kg CO₂e",
        children: [
          {
            id: "own",
            label: "자사 배출량",
            type: "own",
            emission: "8,245.2 kg CO₂e",
            children: [
              {
                id: "own-1",
                label: "전력 사용",
                type: "item",
                emission: "3,200 kg CO₂e"
              },
              {
                id: "own-2",
                label: "LNG 사용",
                type: "item",
                emission: "2,845.2 kg CO₂e"
              },
              {
                id: "own-3",
                label: "공정 배출",
                type: "item",
                emission: "1,600 kg CO₂e"
              },
              {
                id: "own-4",
                label: "시설 물류",
                type: "item",
                emission: "600 kg CO₂e"
              }
            ]
          },
          {
            id: "tier1-supplier-1",
            label: "Tier 1 - 세진케미칼",
            type: "supplier",
            tier: "3차",
            emission: "6,194.7 kg CO₂e",
            children: [
              {
                id: "tier1-supplier-1-1",
                label: "화학물질 제조",
                type: "item",
                emission: "4,100 kg CO₂e"
              },
              {
                id: "tier1-supplier-1-2",
                label: "전력 사용",
                type: "item",
                emission: "2,094.7 kg CO₂e"
              }
            ]
          },
          {
            id: "tier1-supplier-2",
            label: "Tier 1 - 그린에너지솔루션",
            type: "supplier",
            tier: "3차",
            emission: "4,180.6 kg CO₂e",
            children: [
              {
                id: "tier1-supplier-2-1",
                label: "전력 생산",
                type: "item",
                emission: "2,500 kg CO₂e"
              },
              {
                id: "tier1-supplier-2-2",
                label: "시설 운영",
                type: "item",
                emission: "1,680.6 kg CO₂e"
              }
            ]
          }
        ]
      };
    } else {
      // tier3
      return {
        id: "root",
        label: "총 PCF",
        type: "product",
        emission: "6,194.7 kg CO₂e",
        children: [
          {
            id: "own",
            label: "자사 배출량",
            type: "own",
            emission: "6,194.7 kg CO₂e",
            children: [
              {
                id: "own-1",
                label: "전력 사용",
                type: "item",
                emission: "3,500 kg CO₂e"
              },
              {
                id: "own-2",
                label: "LNG 사용",
                type: "item",
                emission: "1,800 kg CO₂e"
              },
              {
                id: "own-3",
                label: "공정 배출",
                type: "item",
                emission: "694.7 kg CO₂e"
              },
              {
                id: "own-4",
                label: "시설 물류",
                type: "item",
                emission: "200 kg CO₂e"
              }
            ]
          }
        ]
      };
    }
  };

  // 하위 협력사 데이터
  const getSupplierData = () => {
    if (tier === "tier1") {
      return [
        { company: "동우전자부품", tier: "2차", pcf: "10,245.8 kg CO₂e", dqr: "1.4", date: "2026-02-28", status: "complete" as const },
        { company: "한국소재산업", tier: "2차", pcf: "8,734.6 kg CO₂e", dqr: "1.8", date: "2026-02-27", status: "complete" as const },
        { company: "세진케미칼", tier: "3차", pcf: "6,194.7 kg CO₂e", dqr: "2.1", date: "2026-02-26", status: "complete" as const }
      ];
    } else if (tier === "tier2") {
      return [
        { company: "세진케미칼", tier: "3차", pcf: "6,194.7 kg CO₂e", dqr: "2.1", date: "2026-02-26", status: "complete" as const },
        { company: "그린에너지솔루션", tier: "3차", pcf: "4,180.6 kg CO₂e", dqr: "1.9", date: "2026-02-25", status: "complete" as const }
      ];
    } else {
      return [];
    }
  };

  const getStatusBadge = (status: "complete" | "partial" | "processing") => {
    switch (status) {
      case "complete":
        return (
          <span 
            className="px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1"
            style={{ backgroundColor: '#E8F5E9', color: '#4CAF50', fontWeight: 600 }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            최종산정 완료
          </span>
        );
      case "partial":
        return (
          <span 
            className="px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1"
            style={{ backgroundColor: '#FFF4E6', color: '#EF6C00', fontWeight: 600 }}
          >
            <Clock className="w-3.5 h-3.5" />
            최종산정 대기
          </span>
        );
      case "processing":
        return (
          <span 
            className="px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1"
            style={{ backgroundColor: '#F5F5F5', color: '#757575', fontWeight: 600 }}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            부분산정 대기
          </span>
        );
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

  const calculatePercentage = (emission: string, totalEmission: string) => {
    const parseEmission = (str: string) => parseFloat(str.replace(/,/g, '').replace(' kg CO₂e', ''));
    const emissionValue = parseEmission(emission);
    const totalValue = parseEmission(totalEmission);
    return ((emissionValue / totalValue) * 100).toFixed(1);
  };

  const renderTreeNode = (node: ComputationTreeNode, level: number = 0, totalEmission?: string) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const total = totalEmission || node.emission;

    const getNodeStyle = () => {
      if (node.type === "product") {
        return {
          backgroundColor: "#E8E0FF",
          borderColor: "#E8E0FF",
          textColor: "#5B3BFA",
          borderWidth: "0"
        };
      } else if (node.type === "own") {
        return {
          backgroundColor: "#F5F5F5",
          borderColor: "#E0E0E0",
          textColor: "#424242",
          borderWidth: "1px"
        };
      } else if (node.type === "supplier") {
        return {
          backgroundColor: "#E0F7FA",
          borderColor: "#00BCD4",
          textColor: "#00838F",
          borderWidth: "2px"
        };
      } else {
        return {
          backgroundColor: level > 1 ? "#FAFAFA" : "#FFFFFF",
          borderColor: "#E0E0E0",
          textColor: "#616161",
          borderWidth: "0"
        };
      }
    };

    const nodeStyle = getNodeStyle();
    const percentage = level > 0 ? calculatePercentage(node.emission, total) : "100.0";

    return (
      <div key={node.id} style={{ marginLeft: level > 1 ? "24px" : "0" }}>
        <div
          className="p-4 rounded-lg mb-2 flex items-center justify-between transition-all"
          style={{
            backgroundColor: nodeStyle.backgroundColor,
            border: `${nodeStyle.borderWidth} solid ${nodeStyle.borderColor}`,
            cursor: hasChildren ? 'pointer' : 'default'
          }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren && (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" style={{ color: nodeStyle.textColor }} />
                ) : (
                  <ChevronUp className="w-4 h-4" style={{ color: nodeStyle.textColor }} />
                )}
              </div>
            )}
            {!hasChildren && level > 1 && (
              <div className="flex-shrink-0 ml-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#9E9E9E' }} />
              </div>
            )}
            <div className="flex items-center gap-2">
              {node.tier && (
                <span 
                  className="px-2 py-0.5 rounded text-xs mr-1"
                  style={{ 
                    backgroundColor: '#E0F7FA',
                    color: '#00838F',
                    fontWeight: 600
                  }}
                >
                  {node.tier}
                </span>
              )}
              <span style={{ 
                fontSize: node.type === "product" ? "15px" : level === 1 ? "14px" : "13px", 
                fontWeight: node.type === "product" || level === 1 ? 600 : 500, 
                color: nodeStyle.textColor 
              }}>
                {node.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ 
              fontSize: node.type === "product" ? "16px" : "14px", 
              fontWeight: 700, 
              color: node.type === "product" ? "#5B3BFA" : nodeStyle.textColor 
            }}>
              {node.emission}
            </span>
            <span style={{ 
              fontSize: "12px", 
              color: node.type === "product" ? "#9575CD" : "#9E9E9E",
              fontWeight: 500,
              minWidth: "45px",
              textAlign: "right"
            }}>
              {percentage}%
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className={level === 0 ? "mt-2" : "mt-1"}>
            {node.children!.map(child => renderTreeNode(child, level + 1, total))}
          </div>
        )}
      </div>
    );
  };

  const canPartialCalculate =
    !!ym &&
    !isMiningSmelter &&
    (!runContext
      ? true
      : !supReadinessLoading && !!supReadiness?.own_pcf_input_ready);
  const canFinalCalculate =
    !!ym &&
    (!runContext
      ? false
      : !supReadinessLoading && !!supReadiness?.can_run_calculation);
  const canTransmit = lastRun === "final" && !isTransmitted;

  const getWarningMessage = () => {
    if (readinessStatusForUi === "incomplete") {
      if (runContext && !supReadinessLoading && !supReadiness) {
        return "PCF 준비도를 불러오지 못했습니다. 로그인·프로젝트 링크(제품·세부제품 쿼리)를 확인해 주세요.";
      }
      return "PCF 산정을 위해 필요한 당사 데이터 입력이 완료되지 않았습니다.";
    }
    if (readinessStatusForUi === "partial" && hasDownstream) {
      return "당사 데이터는 준비되었습니다. 하위 협력사 데이터 전송이 모두 완료되기 전까지는 부분 산정(자사 데이터만)만 실행할 수 있으며, 최종 산정·상위 전송은 하위 완료 후 가능합니다.";
    }
    return null;
  };

  const hasWarning =
    readinessStatusForUi === "incomplete" ||
    (readinessStatusForUi === "partial" && hasDownstream);

  const handlePartialCalculate = async () => {
    if (!ym || !canPartialCalculate) {
      toast.error("부분산정 조건이 충족되지 않았습니다.");
      return;
    }
    try {
      if (runContext) {
        await postSupPcfRunExecute({
          ...runContext,
          calculation_mode: "partial",
        });
      }
      toast.success(runContext ? "부분산정을 실행했습니다." : "부분산정을 실행합니다 (데모 모드)");
      await loadPcfRuns();
      if (runContext) {
        const tr = await getSupPcfTransferReadiness(runContext);
        setSupTransferReadiness(tr);
        setIsTransmitted(Boolean(tr.already_transferred));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "부분산정 실행에 실패했습니다.");
    }
  };

  const handleFinalCalculate = async () => {
    if (!ym || !canFinalCalculate) {
      toast.error("최종산정 조건이 충족되지 않았습니다.");
      return;
    }
    try {
      if (runContext) {
        await postSupPcfRunExecute({
          ...runContext,
          calculation_mode: "final",
        });
      }
      toast.success(runContext ? "최종 PCF 산정을 실행했습니다." : "최종 PCF 산정을 실행합니다 (데모 모드)");
      await loadPcfRuns();
      if (runContext) {
        const tr = await getSupPcfTransferReadiness(runContext);
        setSupTransferReadiness(tr);
        setIsTransmitted(Boolean(tr.already_transferred));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "최종 PCF 산정 실행에 실패했습니다.");
    }
  };

  const handleTransmit = async () => {
    if (!ym || !canTransmit) {
      toast.error("최종 산정 완료 후에만 상위로 전송할 수 있습니다.");
      return;
    }
    try {
      if (runContext) {
        await postSupPcfTransferShare(runContext);
      }
      if (runContext) {
        const tr = await getSupPcfTransferReadiness(runContext);
        setSupTransferReadiness(tr);
        setIsTransmitted(Boolean(tr.already_transferred));
      } else {
        setIsTransmitted(true);
      }
      toast.success(runContext ? `${upperCompanyName}로 PCF 결과를 전송했습니다.` : `${upperCompanyName}로 PCF 결과를 전송했습니다 (데모 모드)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PCF 결과 전송에 실패했습니다.");
    }
  };

  if (selectedHistoryItem) {
    const row = selectedHistoryItem;
    const baseTree = getComputationTree();
    const computationTree = { ...baseTree, emission: row.totalEmission };
    const detailSubtitle =
      row.status === "complete"
        ? "선택한 이력의 산정 결과입니다 (BOM·공급망 버전 기준)."
        : row.status === "partial"
          ? "부분 산정 결과입니다. 하위 데이터 반영 후 재산정할 수 있습니다."
          : "산정이 진행 중입니다.";

    // PCF 결과 상세 페이지 (원청사 디자인 기준)
    return (
      <div className="pt-8">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setSelectedHistoryItem(null)}
            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--aifix-primary)', fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            ← 목록으로 돌아가기
          </button>
          <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            PCF 계산 결과 상세
            {row.status === "complete" ? " (완료)" : row.status === "partial" ? " (부분)" : " (진행중)"}
          </h2>
          <p style={{ color: 'var(--aifix-gray)', fontSize: '14px' }}>
            {detailSubtitle}
          </p>
        </div>

        {/* 계산 정보 */}
        <div 
          className="rounded-lg p-6 mb-6"
          style={{ backgroundColor: '#F8F9FA', border: '1px solid #E0E0E0' }}
        >
          <h3 className="text-base mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            계산 정보
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="w-32 flex-shrink-0" style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                계산 ID
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-primary)' }}>
                {row.id}
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-32 flex-shrink-0" style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                제품
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                {row.product}
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-32 flex-shrink-0" style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                산정 유형
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                {(() => {
                  const picked = pcfRuns.find((r) => (r.display_id?.trim() || `run-${r.id}`) === row.id);
                  return picked ? mapApiRunKindToSupplyVersion(picked.run_kind) : "—";
                })()}
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-32 flex-shrink-0" style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                M-BOM 버전
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                {row.bomVersion}
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-32 flex-shrink-0" style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                산정 기간
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                {row.period}
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-32 flex-shrink-0" style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                DQR
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                {row.dqr}
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-32 flex-shrink-0" style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                산정 상태
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                {getStatusBadge(row.status)}
              </div>
            </div>
          </div>
        </div>

        {/* 총 PCF */}
        <div 
          className="rounded-lg p-8 mb-6 text-center"
          style={{ 
            background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)',
            boxShadow: "0px 8px 24px rgba(91, 59, 250, 0.2)"
          }}
        >
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginBottom: '8px', fontWeight: 500 }}>
            총 배출량
          </div>
          <div className="text-5xl" style={{ fontWeight: 700, color: 'white' }}>
            {computationTree.emission}
          </div>
        </div>

        {/* 계산 트리 (Computation Tree) */}
        <div 
          className="bg-white rounded-lg p-6 mb-6"
          style={{ border: '1px solid #E0E0E0' }}
        >
          <div className="mb-4">
            <h3 className="text-base" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              계산 트리 (Computation Tree)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--aifix-gray)', marginTop: '4px' }}>
              ※ 제품 단위별 배출 기여도를 트리 구조로 표현합니다 (하위 구성은 티어 데모 구조입니다).
            </p>
          </div>

          {renderTreeNode(computationTree)}
        </div>

        {/* 데이터 품질 지표 */}
        <div 
          className="bg-white rounded-lg p-6 mb-6"
          style={{ border: '1px solid #E0E0E0' }}
        >
          <h3 className="text-base mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            데이터 품질 지표
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className="p-5 rounded-lg text-center"
              style={{ backgroundColor: '#E3F2FD' }}
            >
              <div style={{ fontSize: '12px', color: '#1976D2', marginBottom: '8px', fontWeight: 600 }}>
                kg 기준 PCF
              </div>
              <div className="text-3xl mb-1" style={{ fontWeight: 700, color: '#1565C0' }}>
                {row.kgBasedPcf}
              </div>
            </div>

            <div 
              className="p-5 rounded-lg text-center"
              style={{ backgroundColor: '#FFF4E6' }}
            >
              <div style={{ fontSize: '12px', color: '#F57C00', marginBottom: '8px', fontWeight: 600 }}>
                평균 DQR
              </div>
              <div className="text-3xl mb-1" style={{ fontWeight: 700, color: '#EF6C00' }}>
                {row.dqr}
              </div>
            </div>

            <div 
              className="p-5 rounded-lg text-center"
              style={{ backgroundColor: '#E8F5E9' }}
            >
              <div style={{ fontSize: '12px', color: '#388E3C', marginBottom: '8px', fontWeight: 600 }}>
                실측 데이터 비율
              </div>
              <div className="text-3xl mb-1" style={{ fontWeight: 700, color: '#2E7D32' }}>
                78.3%
              </div>
            </div>
          </div>
        </div>

        {/* 계산 로그 이력 */}
        <div 
          className="bg-white rounded-lg p-6 mb-6"
          style={{ border: '1px solid #E0E0E0' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5" style={{ color: 'var(--aifix-primary)' }} />
            <h3 className="text-base" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              계산 로그 이력
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '2px solid #E0E0E0', backgroundColor: '#F5F7FA' }}>
                  <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                    계산 실행 일시
                  </th>
                  <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                    실행자
                  </th>
                  <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                    중량단위
                  </th>
                  <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                    배출 여부
                  </th>
                  <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                    메모
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <td className="py-3 px-4" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--aifix-navy)' }}>
                    {row.date} 09:00:00
                  </td>
                  <td className="py-3 px-4" style={{ fontSize: '14px', color: 'var(--aifix-navy)' }}>
                    시스템
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--aifix-primary-light)', color: 'var(--aifix-primary)', fontWeight: 600 }}>
                      {row.bomVersion}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(row.status)}
                  </td>
                  <td className="py-3 px-4" style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                    이력 기준 산정
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <td className="py-3 px-4" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--aifix-navy)' }}>
                    2024-03-03 14:12:05
                  </td>
                  <td className="py-3 px-4" style={{ fontSize: '14px', color: 'var(--aifix-navy)' }}>
                    박영희
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--aifix-primary-light)', color: 'var(--aifix-primary)', fontWeight: 600 }}>
                      v1.2
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span 
                      className="px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1"
                      style={{ backgroundColor: '#FFF9C4', color: '#F57F17', fontWeight: 600 }}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      계산중
                    </span>
                  </td>
                  <td className="py-3 px-4" style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                    하위 데이터 반영
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 이력 / 설명 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            className="rounded-lg p-5"
            style={{ backgroundColor: '#F3E5F5', border: '1px solid #CE93D8' }}
          >
            <div style={{ fontSize: '12px', color: '#7B1FA2', marginBottom: '4px', fontWeight: 600 }}>
              산정 방법론
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#4A148C' }}>
              ISO 14067
            </div>
          </div>

          <div 
            className="rounded-lg p-5"
            style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}
          >
            <div style={{ fontSize: '12px', color: '#388E3C', marginBottom: '4px', fontWeight: 600 }}>
              배출 경계
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1B5E20' }}>
              Cradle to Gate
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8">
      <div style={{ minHeight: '600px' }}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          PCF 산정
        </h2>
        <p style={{ color: 'var(--aifix-gray)' }}>
          자사 및 하위 협력사 데이터를 기반으로 PCF를 계산합니다
        </p>
        <div className="mt-6 border-b" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPcfTab("calculation")}
              className="px-4 py-3 transition-all inline-flex items-center gap-2 border-b-2"
              style={{
                borderBottomColor: pcfTab === "calculation" ? "#00B4FF" : "transparent",
                color: pcfTab === "calculation" ? "#00B4FF" : "var(--aifix-gray)",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              <FileText className="w-4 h-4" />
              계산
            </button>
            <button
              type="button"
              onClick={() => setPcfTab("history")}
              className="px-4 py-3 transition-all inline-flex items-center gap-2 border-b-2"
              style={{
                borderBottomColor: pcfTab === "history" ? "#00B4FF" : "transparent",
                color: pcfTab === "history" ? "#00B4FF" : "var(--aifix-gray)",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              <Clock className="w-4 h-4" />
              히스토리
            </button>
          </div>
        </div>
      </div>

      {pcfTab === "calculation" && (
      <>
      {/* 1. PCF 산정 대상 선택 */}
      <div 
        className="bg-white rounded-[20px] p-6 mb-6"
        style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
      >
        <div className="flex items-start gap-3 mb-4">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--aifix-primary)' }} />
          <div>
            <h3 className="text-base mb-1" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              PCF 산정 대상 선택
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--aifix-gray)', lineHeight: 1.5 }}>
              제품 기준은 공급망 버전, M-BOM 버전, 산정기간을 선택하여 PCF를 산정합니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
              기간
            </label>
            <MonthPicker 
              value={selectedPeriod}
              onChange={setSelectedPeriod}
            />
          </div>
        </div>
      </div>

      {/* 2. PCF 산정 준비 상태 */}
      <div 
        className="rounded-[20px] p-6 mb-6"
        style={{ backgroundColor: '#E0F7FA', border: '1px solid #B2EBF2' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#00838F' }} />
          <h3 className="text-base" style={{ fontWeight: 700, color: '#00838F' }}>
            PCF 산정 준비 상태
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {readinessCards.map((card) => {
            const IconComponent = card.icon;
            
            return (
              <div 
                key={card.id}
                className="bg-white rounded-lg p-4 text-center"
                style={{ border: '1px solid #B2EBF2' }}
              >
                <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '8px' }}>
                  {card.label}
                </div>
                <div className="flex items-center justify-center mb-2">
                  <IconComponent className="w-5 h-5 mr-2" style={{ color: card.iconColor }} />
                  <span className="text-2xl" style={{ fontWeight: 700, color: card.statusColor }}>
                    {card.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: '12px', color: 'var(--aifix-gray)', marginBottom: '12px', lineHeight: 1.5 }}>
          원청 PCF와 동일한 API(`/pcf/readiness/supplier`)로 표시합니다. URL에 제품·세부제품 쿼리가 없어도 현재 프로젝트(`/projects/real-…`)의 계약 정보(`getMyProjectDetail`)로 조회합니다. 하위 협력사가 없으면 0/0으로 보입니다.
        </p>

        {hasWarning && getWarningMessage() && (
          <div 
            className="p-4 rounded-lg flex items-start gap-3"
            style={{ backgroundColor: '#FFF9C4', border: '1px solid #FBC02D' }}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F57F17' }} />
            <p style={{ fontSize: '13px', color: '#F57F17', lineHeight: 1.5 }}>
              {getWarningMessage()}
            </p>
          </div>
        )}

        {/* 부분 산정 / 최종 산정 / 상위 전송 (원청사 PCF와 동일 규칙) */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            onClick={handlePartialCalculate}
            disabled={!canPartialCalculate}
            className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all"
            style={{
              backgroundColor: canPartialCalculate ? '#5B3BFA' : '#E0E0E0',
              color: canPartialCalculate ? 'white' : '#9E9E9E',
              fontWeight: 600,
              cursor: canPartialCalculate ? 'pointer' : 'not-allowed',
              border: 'none',
              opacity: canPartialCalculate ? 1 : 0.6
            }}
          >
            <Play className="w-5 h-5" />
            부분 PCF 산정
          </button>

          <button
            type="button"
            onClick={handleFinalCalculate}
            disabled={!canFinalCalculate}
            className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all"
            style={{
              backgroundColor: canFinalCalculate ? '#00897B' : '#E0E0E0',
              color: canFinalCalculate ? 'white' : '#9E9E9E',
              fontWeight: 600,
              cursor: canFinalCalculate ? 'pointer' : 'not-allowed',
              border: 'none',
              opacity: canFinalCalculate ? 1 : 0.6
            }}
          >
            <CheckCircle className="w-5 h-5" />
            최종 PCF 산정
          </button>

          <button
            type="button"
            className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all"
            style={{
              backgroundColor: 'white',
              border: '2px solid #BDBDBD',
              color: '#616161',
              fontWeight: 600
            }}
          >
            <BarChart3 className="w-5 h-5" />
            결과 비교
          </button>
        </div>

        <div className="mt-3 space-y-1" style={{ fontSize: '12px', color: 'var(--aifix-gray)' }}>
          {!hasDownstream && (
            <p>3차 협력사는 하위가 없으므로 자사 데이터만으로 부분·최종 산정을 모두 실행할 수 있으며, 최종 산정 후 상위로 전송할 수 있습니다.</p>
          )}
          {lastRun === 'partial' && hasDownstream && !isTransmitted && (
            <p style={{ color: '#E65100', fontWeight: 600 }}>
              이번 달 부분 산정을 실행했습니다. 하위 데이터가 모두 도착하면 최종 산정 후 &quot;PCF 결과 전송&quot;을 진행하세요.
            </p>
          )}
          {lastRun === 'final' && isTransmitted && (
            <p style={{ color: '#2E7D32', fontWeight: 600 }}>
              최종 산정 후 {upperCompanyName}로 전송을 완료했습니다 (이번 조회월 기준).
            </p>
          )}
        </div>
      </div>
      </>
      )}

      {/* 3. PCF 계산 결과 이력 */}
      <div 
        className="bg-white rounded-[20px] p-6 mb-6"
        style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" style={{ color: 'var(--aifix-primary)' }} />
            <h3 className="text-base" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              PCF 계산 결과 이력
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
              ※ 최근에 수정된 PCF 결과 (제출일 기준)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select 
              className="px-3 py-2 rounded-lg border"
              style={{ fontSize: '13px', borderColor: '#E0E0E0' }}
            >
              <option>전체</option>
              <option>완료</option>
              <option>진행중</option>
            </select>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{
                backgroundColor: 'white',
                border: '1px solid #E0E0E0',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--aifix-navy)'
              }}
            >
              <FileText className="w-4 h-4" />
              결과 내보내기
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '2px solid #E0E0E0' }}>
                <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                  PCF 계산 ID
                </th>
                <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                  제품
                </th>
                <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                  BOM 버전
                </th>
                <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                  산정 기간
                </th>
                <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                  총 배출량
                </th>
                <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                  kg 기준 PCF
                </th>
                <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                  산정 상태
                </th>
                <th className="text-left py-3 px-4" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {pcfRunsLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center" style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                    PCF 산정 이력을 불러오는 중입니다…
                  </td>
                </tr>
              ) : !runContext ? (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center" style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                    프로젝트·제품·세부제품·산정 기간이 모두 맞으면 서버에 저장된 산정 이력이 여기에 표시됩니다. URL에 제품/세부제품 파라미터를 확인해 주세요.
                  </td>
                </tr>
              ) : calculationHistoryRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center" style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                    {pcfTab === "history"
                      ? "등록된 PCF 산정 이력이 없습니다. 부분·최종 산정을 실행하면 목록에 추가됩니다."
                      : "선택한 기간에 등록된 PCF 산정 이력이 없습니다. 부분·최종 산정을 실행하면 목록에 추가됩니다."}
                  </td>
                </tr>
              ) : (
                calculationHistoryRows.map((item, idx) => (
                  <tr key={`${item.id}-${item.date}-${idx}`} style={{ borderBottom: '1px solid #F0F0F0' }}>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-primary)' }}>
                        {item.id}
                      </span>
                    </td>
                    <td className="py-3 px-4" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--aifix-navy)' }}>
                      {item.product}
                    </td>
                    <td className="py-3 px-4" style={{ fontSize: '13px', color: 'var(--aifix-navy)' }}>
                      {item.bomVersion}
                    </td>
                    <td className="py-3 px-4" style={{ fontSize: '13px', color: 'var(--aifix-navy)' }}>
                      {item.period}
                    </td>
                    <td className="py-3 px-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {item.totalEmission}
                    </td>
                    <td className="py-3 px-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {item.kgBasedPcf}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedHistoryItem(item)}
                          className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                          style={{
                            border: '1px solid var(--aifix-primary)',
                            color: 'var(--aifix-primary)',
                            fontWeight: 600,
                            backgroundColor: 'white'
                          }}
                        >
                          상세보기
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                          style={{
                            border: '1px solid #BDBDBD',
                            color: '#616161',
                            fontWeight: 600,
                            backgroundColor: 'white'
                          }}
                        >
                          재산정
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

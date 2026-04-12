'use client';

import { useEffect, useMemo, useState } from "react";
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Send,
  FileText,
  Users,
  Calculator,
  Package,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MonthPicker } from "../MonthPicker";
import { usePathname, useSearchParams } from "next/navigation";
import { restoreSupSessionFromCookie } from "@/lib/api/client";
import { getMyProjectDetail, type SupplierProject } from "@/lib/api/supply-chain";
import {
  getSupPcfRuns,
  getSupPcfTransferReadiness,
  postSupPcfTransferShare,
  type PcfRunListItemDto,
  type SupPcfTransferReadinessResponse,
} from "@/lib/api/pcf";

function periodToYm(period: string): string | null {
  const m = period.match(/(\d{4})\s*년\s*(\d{1,2})\s*월/);
  if (!m) return null;
  return `${m[1]}-${String(parseInt(m[2], 10)).padStart(2, '0')}`;
}

function isRunCompleted(r: PcfRunListItemDto): boolean {
  const s = (r.status ?? "").toLowerCase();
  return s === "completed" || s === "success";
}

function isPartialRun(r: PcfRunListItemDto): boolean {
  return (r.run_kind ?? "").toLowerCase() === "batch";
}

function isFinalRun(r: PcfRunListItemDto): boolean {
  return (r.run_kind ?? "").toLowerCase() === "node_rollup";
}

/** `/projects/1` · `/projects/real-1` 모두 (PCF 산정·전송 공통) */
function projectIdFromPathname(pathname: string | null): number | null {
  const m = /\/projects\/(?:real-)?(\d+)/i.exec(pathname ?? "");
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function Tier1Transmission() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchQueryKey = searchParams.toString();
  const [selectedPeriod, setSelectedPeriod] = useState("2026년 1월");
  const [showTransmitModal, setShowTransmitModal] = useState(false);
  const [hasDirectRequest, setHasDirectRequest] = useState(false);
  const [partialPcfCalculated, setPartialPcfCalculated] = useState(false);
  const [finalPcfCalculated, setFinalPcfCalculated] = useState(false);
  const [isTransmitted, setIsTransmitted] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readiness, setReadiness] = useState<SupPcfTransferReadinessResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedResultKind, setSelectedResultKind] = useState<"partial" | "final" | null>(null);
  const [resolvedProject, setResolvedProject] = useState<SupplierProject | null>(null);
  const ownDataStatus: "complete" | "incomplete" | "pending" =
    readinessLoading ? "pending" : readiness?.own_pcf_input_ready ? "complete" : "incomplete";
  const supplierDataStatus: "complete" | "incomplete" | "partial" =
    readinessLoading
      ? "partial"
      : readiness?.all_children_transferred
        ? "complete"
        : "incomplete";
  const pcfStatus: "complete" | "incomplete" | "pending" = finalPcfCalculated ? "complete" : "pending";
  const totalChildren = readiness?.child_total ?? 0;
  const completedChildren = readiness?.child_transferred_count ?? 0;
  const pendingChildren = Math.max(totalChildren - completedChildren, 0);

  // 전송 가능 여부 판단
  const canOpenTransmitModal = ownDataStatus === "complete" && supplierDataStatus === "complete";
  const canSelectPartial = hasDirectRequest && partialPcfCalculated;
  const canSelectFinal = finalPcfCalculated;
  const ym = periodToYm(selectedPeriod);

  const projectPkFromPath = useMemo(() => projectIdFromPathname(pathname), [pathname]);

  const runContext = useMemo(() => {
    const pickInt = (keys: string[]): number | null => {
      for (const key of keys) {
        const raw = searchParams.get(key);
        if (!raw) continue;
        const n = parseInt(raw, 10);
        if (Number.isFinite(n) && n > 0) return n;
      }
      return null;
    };
    const projectId =
      pickInt(["projectId", "project_id", "dmProjectId"]) ??
      resolvedProject?.project_id ??
      projectPkFromPath;
    const productId =
      pickInt(["productId", "product_id", "dmProductId"]) ??
      (resolvedProject?.product_id ?? null);
    const productVariantId =
      pickInt(["productVariantId", "product_variant_id", "dmProductVariantId", "dmVariantId"]) ??
      (resolvedProject?.product_variant_id ?? null);
    const supplyChainNodeId =
      pickInt(["supply_chain_node_id", "supplyChainNodeId", "my_supply_chain_node_id"]) ??
      (resolvedProject?.my_supply_chain_node_id != null && resolvedProject.my_supply_chain_node_id >= 1
        ? resolvedProject.my_supply_chain_node_id
        : null);

    if (!projectId || !ym) return null;
    const [ys, ms] = ym.split("-");
    const reportingYear = parseInt(ys, 10);
    const reportingMonth = parseInt(ms, 10);
    if (!Number.isFinite(reportingYear) || !Number.isFinite(reportingMonth)) return null;

    if (supplyChainNodeId != null && supplyChainNodeId >= 1) {
      return {
        project_id: projectId,
        reporting_year: reportingYear,
        reporting_month: reportingMonth,
        supply_chain_node_id: supplyChainNodeId,
        ...(productId != null && productId >= 1 ? { product_id: productId } : {}),
        ...(productVariantId != null && productVariantId >= 1
          ? { product_variant_id: productVariantId }
          : {}),
      };
    }

    if (!productId || !productVariantId) return null;
    return {
      project_id: projectId,
      product_id: productId,
      product_variant_id: productVariantId,
      reporting_year: reportingYear,
      reporting_month: reportingMonth,
    };
  }, [
    pathname,
    searchQueryKey,
    resolvedProject?.project_id,
    resolvedProject?.product_id,
    resolvedProject?.product_variant_id,
    resolvedProject?.my_supply_chain_node_id,
    ym,
    projectPkFromPath,
  ]);

  useEffect(() => {
    const pickInt = (keys: string[]): number | null => {
      for (const key of keys) {
        const raw = searchParams.get(key);
        if (!raw) continue;
        const n = parseInt(raw, 10);
        if (Number.isFinite(n) && n > 0) return n;
      }
      return null;
    };
    const productFromUrl = pickInt(["productId", "product_id", "dmProductId"]);
    const variantFromUrl = pickInt(["productVariantId", "product_variant_id", "dmProductVariantId", "dmVariantId"]);
    const nodeFromUrl = pickInt(["supply_chain_node_id", "supplyChainNodeId", "my_supply_chain_node_id"]);
    const fullFromUrl = productFromUrl != null && variantFromUrl != null;

    if (!projectPkFromPath) {
      setResolvedProject(null);
      return;
    }
    if (fullFromUrl || nodeFromUrl != null) {
      setResolvedProject(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await restoreSupSessionFromCookie();
        const d = await getMyProjectDetail(projectPkFromPath);
        if (!cancelled) setResolvedProject(d);
      } catch {
        if (!cancelled) setResolvedProject(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, searchQueryKey, projectPkFromPath]);

  useEffect(() => {
    if (!runContext) {
      setPartialPcfCalculated(false);
      setFinalPcfCalculated(false);
      setIsTransmitted(false);
      setHasDirectRequest(false);
      setReadiness(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        setReadinessLoading(true);
        setLoadError(null);
        await restoreSupSessionFromCookie();
        const [runRows, transferReadiness] = await Promise.all([
          getSupPcfRuns({
            project_id: runContext.project_id,
            product_id: runContext.product_id,
            product_variant_id: runContext.product_variant_id,
            reporting_year: runContext.reporting_year,
            reporting_month: runContext.reporting_month,
            supply_chain_node_id:
              "supply_chain_node_id" in runContext ? runContext.supply_chain_node_id : undefined,
            limit: 100,
            offset: 0,
          }),
          getSupPcfTransferReadiness(runContext),
        ]);
        if (cancelled) return;
        const partialDone = runRows.some((r) => isRunCompleted(r) && isPartialRun(r));
        const finalDone = runRows.some((r) => isRunCompleted(r) && isFinalRun(r));
        setPartialPcfCalculated(partialDone);
        setFinalPcfCalculated(finalDone);
        setIsTransmitted(Boolean(transferReadiness.already_transferred));
        setHasDirectRequest(Boolean(transferReadiness.has_direct_request_pending));
        setReadiness(transferReadiness);
      } catch (e) {
        if (cancelled) return;
        setPartialPcfCalculated(false);
        setFinalPcfCalculated(false);
        setIsTransmitted(false);
        setHasDirectRequest(false);
        setReadiness(null);
        setLoadError(e instanceof Error ? e.message : "전송 준비 상태를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setReadinessLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    runContext?.project_id,
    runContext?.reporting_year,
    runContext?.reporting_month,
    runContext != null && 'supply_chain_node_id' in runContext ? runContext.supply_chain_node_id : undefined,
    runContext?.product_id,
    runContext?.product_variant_id,
  ]);

  const openTransmitModal = () => {
    if (!canOpenTransmitModal) return;
    if (!hasDirectRequest) {
      void submitTransmitDirectFinal();
      return;
    }
    setSelectedResultKind(canSelectPartial ? "partial" : (canSelectFinal ? "final" : null));
    setShowTransmitModal(true);
  };

  const submitTransmitDirectFinal = async () => {
    if (!runContext) {
      toast.error("전송에 필요한 프로젝트/제품/기간 정보가 없습니다.");
      return;
    }
    if (!canSelectFinal) {
      toast.error("최종 PCF 산정 완료 후 전송할 수 있습니다.");
      return;
    }
    try {
      setTransmitting(true);
      await restoreSupSessionFromCookie();
      await postSupPcfTransferShare({ ...runContext, result_kind: "final" });
      setIsTransmitted(true);
      toast.success("전송되었습니다");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "전송에 실패했습니다.");
    } finally {
      setTransmitting(false);
    }
  };

  const submitTransmit = () => {
    void (async () => {
      if (!runContext) {
        toast.error("전송에 필요한 프로젝트/제품/기간 정보가 없습니다.");
        return;
      }
    if (!selectedResultKind) {
      toast.error("전송할 결과 유형을 선택해주세요.");
      return;
    }
    if (selectedResultKind === "final" && !canSelectFinal) {
      toast.error("최종 PCF 산정 완료 후에만 최종산정 결과를 전송할 수 있습니다.");
      return;
    }
    if (selectedResultKind === "partial" && !canSelectPartial) {
      toast.error("부분 PCF 산정 완료 후에만 부분산정 결과를 전송할 수 있습니다.");
      return;
    }
      try {
        setTransmitting(true);
        await restoreSupSessionFromCookie();
        await postSupPcfTransferShare({ ...runContext, result_kind: selectedResultKind });
        setIsTransmitted(true);
        toast.success("전송되었습니다");
        setShowTransmitModal(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "전송에 실패했습니다.");
      } finally {
        setTransmitting(false);
      }
    })();
  };

  // 상태별 UI 설정
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "complete":
        return {
          icon: CheckCircle,
          color: "var(--aifix-success)",
          bg: "#E6F7ED",
          label: "완료"
        };
      case "partial":
        return {
          icon: AlertCircle,
          color: "#F59E0B",
          bg: "#FEF3C7",
          label: "일부 완료"
        };
      case "pending":
        return {
          icon: AlertCircle,
          color: "#F59E0B",
          bg: "#FEF3C7",
          label: "대기중"
        };
      case "incomplete":
        return {
          icon: XCircle,
          color: "#EF4444",
          bg: "#FEE2E2",
          label: "미완료"
        };
      default:
        return {
          icon: AlertCircle,
          color: "#F59E0B",
          bg: "#FEF3C7",
          label: "확인 필요"
        };
    }
  };

  const ownDataConfig = getStatusConfig(ownDataStatus);
  const supplierDataConfig = getStatusConfig(supplierDataStatus);
  const pcfConfig = getStatusConfig(pcfStatus);

  return (
    <div className="pt-8">
      <div style={{ minHeight: '600px' }}>
      {/* 헤더 */}
      <div className="mb-8">
        <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          전송
        </h2>
        <p style={{ color: 'var(--aifix-gray)', fontSize: '15px' }}>
          상위차사로 PCF 데이터 패키지를 전송합니다
        </p>
      </div>

      {/* 기간 필터 */}
      <div className="mb-8">
        <MonthPicker
          value={selectedPeriod}
          onChange={setSelectedPeriod}
        />
      </div>

      {/* 전송 준비 상태 */}
      <div className="mb-8">
        <h3 className="text-xl mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          전송 준비 상태
        </h3>
        
        <div className="grid grid-cols-3 gap-6">
          {/* 자사 데이터 상태 */}
          <div 
            className="bg-white p-6 rounded-2xl border border-gray-200"
            style={{ boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: ownDataConfig.bg }}
              >
                <FileText className="w-6 h-6" style={{ color: ownDataConfig.color }} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                  자사 데이터
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <ownDataConfig.icon className="w-5 h-5" style={{ color: ownDataConfig.color }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: ownDataConfig.color }}>
                {ownDataConfig.label}
              </span>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--aifix-gray)', lineHeight: 1.6 }}>
              {ownDataStatus === "complete" ? (
                <>해당 기간의 자사 데이터 입력 및 검토가 완료되었습니다. 데이터 관리 탭에서 입력된 데이터가 전송 준비 상태입니다.</>
              ) : (
                <>해당 기간의 자사 데이터가 아직 입력되지 않았습니다. 데이터 관리 탭에서 데이터를 입력하세요.</>
              )}
            </p>
          </div>

          {/* 하위 협력사 데이터 상태 */}
          <div 
            className="bg-white p-6 rounded-2xl border border-gray-200"
            style={{ boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: supplierDataConfig.bg }}
              >
                <Users className="w-6 h-6" style={{ color: supplierDataConfig.color }} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                  하위 협력사 데이터
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <supplierDataConfig.icon className="w-5 h-5" style={{ color: supplierDataConfig.color }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: supplierDataConfig.color }}>
                {supplierDataStatus === "complete" ? "모든 협력사 검토 완료" : 
                 supplierDataStatus === "partial" ? "일부 협력사 검토 필요" : "검토 필요"}
              </span>
            </div>

            <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#F8F9FB' }}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: 'var(--aifix-gray)' }}>전체 협력사</span>
                <span style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>{totalChildren}개</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: 'var(--aifix-gray)' }}>검토 완료</span>
                <span style={{ fontWeight: 600, color: 'var(--aifix-success)' }}>{completedChildren}개</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--aifix-gray)' }}>검토 필요</span>
                <span style={{ fontWeight: 600, color: 'var(--aifix-gray)' }}>{pendingChildren}개</span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--aifix-gray)', lineHeight: 1.6 }}>
              {supplierDataStatus === "complete" ? (
                <>하위 협력사 데이터 검토 및 수정이 완료되었습니다. 전송 준비 상태입니다.</>
              ) : (
                <>일부 하위 협력사의 데이터 검토가 필요합니다. 데이터 관리 탭에서 확인하세요.</>
              )}
            </p>
          </div>

          {/* PCF 산정 상태 */}
          <div 
            className="bg-white p-6 rounded-2xl border border-gray-200"
            style={{ boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: pcfConfig.bg }}
              >
                <Calculator className="w-6 h-6" style={{ color: pcfConfig.color }} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                  PCF 산정
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <pcfConfig.icon className="w-5 h-5" style={{ color: pcfConfig.color }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: pcfConfig.color }}>
                {pcfConfig.label}
              </span>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--aifix-gray)', lineHeight: 1.6 }}>
              {pcfStatus === "complete" ? (
                <>하위 협력사 데이터와 자사 데이터를 기반으로 PCF 산정이 완료되었습니다.</>
              ) : (
                <>PCF 산정이 아직 실행되지 않았습니다. PCF 산정 탭에서 계산을 실행하세요.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 전송 데이터 구성 안내 */}
      <div className="mb-8">
        <div 
          className="bg-white p-6 rounded-2xl border border-gray-200"
          style={{ boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)' }}
        >
          <div className="flex items-start gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)' }}
            >
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="mb-2" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                전송 데이터 구성
              </h4>
              <p className="mb-4" style={{ fontSize: '14px', color: 'var(--aifix-gray)', lineHeight: 1.6 }}>
                상위차사에게 다음 데이터가 함께 전송됩니다.
              </p>
              <ul className="space-y-2">
                {[
                  "자사 입력 데이터",
                  "하위 협력사 데이터",
                  "PCF 산정 결과"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--aifix-primary)' }} />
                    <span style={{ fontSize: '14px', color: 'var(--aifix-navy)' }}>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4" style={{ fontSize: '13px', color: 'var(--aifix-gray)', lineHeight: 1.6 }}>
                전송 시 해당 기간의 공급망 데이터와 PCF 산정 결과가 상위차사에게 패키지 형태로 전달됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 전송 실행 영역 */}
      <div 
        className="bg-white p-8 rounded-2xl border border-gray-200"
        style={{ boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)' }}
      >
        <div className="text-center">
          <button
            disabled={!canOpenTransmitModal || transmitting}
            onClick={openTransmitModal}
            className="px-8 py-4 rounded-xl transition-all flex items-center gap-3 mx-auto"
            style={{
              background: canOpenTransmitModal 
                ? 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)'
                : '#E5E7EB',
              color: canOpenTransmitModal ? 'white' : '#9CA3AF',
              fontWeight: 600,
              fontSize: '16px',
              cursor: canOpenTransmitModal ? 'pointer' : 'not-allowed',
              boxShadow: canOpenTransmitModal ? '0px 4px 12px rgba(91, 59, 250, 0.2)' : 'none'
            }}
          >
            <Send className="w-5 h-5" />
            {transmitting ? "전송 중..." : "상위차사에게 데이터 전송"}
          </button>
          
          {!canOpenTransmitModal && (
            <p className="mt-4" style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              자사/하위 협력사 데이터 준비 완료 후 전송 항목을 선택할 수 있습니다.
            </p>
          )}
          {loadError && (
            <p className="mt-2" style={{ fontSize: "13px", color: "#EF4444" }}>
              {loadError}
            </p>
          )}
        </div>
      </div>

      {showTransmitModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowTransmitModal(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">상위차사 데이터 전송</h3>
                <p className="text-sm text-gray-500 mt-1">
                  전송할 결과 유형을 선택하세요.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                onClick={() => setShowTransmitModal(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              {hasDirectRequest && (
                <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="transfer-result-kind"
                    className="mt-0.5"
                    disabled={!canSelectPartial}
                    checked={selectedResultKind === "partial"}
                    onChange={() => setSelectedResultKind("partial")}
                  />
                  <div>
                    <p className={`text-sm font-semibold ${canSelectPartial ? "text-gray-900" : "text-gray-400"}`}>
                      PCF 부분산정 결과 및 데이터
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      직접요청을 받은 경우 부분산정 결과만으로 상위차사 전송이 가능합니다.
                    </p>
                    {!canSelectPartial && (
                      <p className="text-xs text-amber-600 mt-1">부분 PCF 산정 완료 후 선택 가능합니다.</p>
                    )}
                  </div>
                </label>
              )}

              <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 hover:bg-gray-50">
                <input
                  type="radio"
                  name="transfer-result-kind"
                  className="mt-0.5"
                  disabled={!canSelectFinal}
                  checked={selectedResultKind === "final"}
                  onChange={() => setSelectedResultKind("final")}
                />
                <div>
                  <p className={`text-sm font-semibold ${canSelectFinal ? "text-gray-900" : "text-gray-400"}`}>
                    PCF 최종산정 결과 및 데이터
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    기본 전송 규칙입니다. 최종 산정 완료 후 전송할 수 있습니다.
                  </p>
                  {!canSelectFinal && (
                    <p className="text-xs text-amber-600 mt-1">최종 PCF 산정 완료 후 선택 가능합니다.</p>
                  )}
                </div>
              </label>

              {!hasDirectRequest && (
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  직접요청 미수신 상태에서는 최종산정 결과 전송만 가능합니다.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => setShowTransmitModal(false)}
              >
                취소
              </button>
              <button
                type="button"
                disabled={transmitting}
                className="rounded-lg bg-[#5B3BFA] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                onClick={submitTransmit}
              >
                {transmitting ? "전송 중..." : "선택 항목 전송"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

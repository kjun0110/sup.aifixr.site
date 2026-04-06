'use client';

import { useEffect, useState } from "react";
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

const SUP_PCF_MONTH_RUN_KEY = 'aifix_sup_pcf_month_run_state_v1';

function periodToYm(period: string): string | null {
  const m = period.match(/(\d{4})\s*년\s*(\d{1,2})\s*월/);
  if (!m) return null;
  return `${m[1]}-${String(parseInt(m[2], 10)).padStart(2, '0')}`;
}

function readSupMonthRunState(tier: "tier1", ym: string): { partial?: boolean; final?: boolean } {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SUP_PCF_MONTH_RUN_KEY);
    const o = raw ? (JSON.parse(raw) as Record<string, { partial?: boolean; final?: boolean }>) : {};
    return o[`${tier}|${ym}`] ?? {};
  } catch {
    return {};
  }
}

export function Tier1Transmission() {
  const [selectedPeriod, setSelectedPeriod] = useState("2026년 1월");
  const [showTransmitModal, setShowTransmitModal] = useState(false);
  /** TODO: API 연동 후 "직접요청 수신 여부"로 교체 */
  const [hasDirectRequest] = useState(false);
  const [partialPcfCalculated, setPartialPcfCalculated] = useState(false);
  const [finalPcfCalculated, setFinalPcfCalculated] = useState(false);
  const [selectedTransmitItems, setSelectedTransmitItems] = useState<Set<"partial" | "final">>(new Set());

  // Mock 데이터 준비 상태
  const [ownDataStatus] = useState<"complete" | "incomplete" | "pending">("complete");
  const [supplierDataStatus] = useState<"complete" | "incomplete" | "partial">("complete");
  const pcfStatus: "complete" | "incomplete" | "pending" = finalPcfCalculated ? "complete" : "pending";

  // 전송 가능 여부 판단
  const canTransmit = ownDataStatus === "complete" && 
                       supplierDataStatus === "complete" && 
                       pcfStatus === "complete";
  const canOpenTransmitModal = ownDataStatus === "complete" && supplierDataStatus === "complete";
  const canSelectPartial = hasDirectRequest && partialPcfCalculated;
  const canSelectFinal = finalPcfCalculated;

  useEffect(() => {
    const ym = periodToYm(selectedPeriod);
    if (!ym) {
      setPartialPcfCalculated(false);
      setFinalPcfCalculated(false);
      return;
    }
    const s = readSupMonthRunState("tier1", ym);
    setPartialPcfCalculated(Boolean(s.partial || s.final));
    setFinalPcfCalculated(Boolean(s.final));
  }, [selectedPeriod]);

  const openTransmitModal = () => {
    if (!canOpenTransmitModal) return;
    setSelectedTransmitItems(new Set(hasDirectRequest ? (["partial"] as const) : (["final"] as const)));
    setShowTransmitModal(true);
  };

  const toggleTransmitItem = (item: "partial" | "final", checked: boolean) => {
    setSelectedTransmitItems((prev) => {
      const next = new Set(prev);
      if (checked) next.add(item);
      else next.delete(item);
      return next;
    });
  };

  const submitTransmit = () => {
    if (selectedTransmitItems.has("final") && !canSelectFinal) {
      toast.error("최종 PCF 산정 완료 후에만 최종산정 결과를 전송할 수 있습니다.");
      return;
    }
    if (selectedTransmitItems.has("partial") && !canSelectPartial) {
      toast.error("부분 PCF 산정 완료 후에만 부분산정 결과를 전송할 수 있습니다.");
      return;
    }
    if (selectedTransmitItems.size === 0) {
      toast.error("전송할 항목을 1개 이상 선택해주세요.");
      return;
    }
    const labels = [
      selectedTransmitItems.has("partial") ? "부분 PCF 산정 결과 및 데이터" : null,
      selectedTransmitItems.has("final") ? "최종 PCF 산정 결과 및 데이터" : null,
    ].filter(Boolean);
    toast.success(`${labels.join(", ")} 전송을 시작합니다. (추후 API 연동)`);
    setShowTransmitModal(false);
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

            {supplierDataStatus === "complete" && (
              <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#F8F9FB' }}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'var(--aifix-gray)' }}>전체 협력사</span>
                  <span style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>8개</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'var(--aifix-gray)' }}>검토 완료</span>
                  <span style={{ fontWeight: 600, color: 'var(--aifix-success)' }}>8개</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--aifix-gray)' }}>검토 필요</span>
                  <span style={{ fontWeight: 600, color: 'var(--aifix-gray)' }}>0개</span>
                </div>
              </div>
            )}

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
            disabled={!canOpenTransmitModal}
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
            상위차사에게 데이터 전송
          </button>
          
          {!canOpenTransmitModal && (
            <p className="mt-4" style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              자사/하위 협력사 데이터 준비 완료 후 전송 항목을 선택할 수 있습니다.
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
                    type="checkbox"
                    className="mt-0.5"
                    disabled={!canSelectPartial}
                    checked={selectedTransmitItems.has("partial")}
                    onChange={(e) => toggleTransmitItem("partial", e.target.checked)}
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
                  type="checkbox"
                  className="mt-0.5"
                  disabled={!canSelectFinal}
                  checked={selectedTransmitItems.has("final")}
                  onChange={(e) => toggleTransmitItem("final", e.target.checked)}
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
                className="rounded-lg bg-[#5B3BFA] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                onClick={submitTransmit}
              >
                선택 항목 전송
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

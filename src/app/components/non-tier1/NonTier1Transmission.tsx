'use client';

import { useState } from "react";
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Send,
  FileText,
  Users,
  Calculator,
  Package
} from "lucide-react";
import { MonthPicker } from "../MonthPicker";

type NonTier1TransmissionProps = {
  tier: "tier2" | "tier3";
};

export function NonTier1Transmission({ tier }: NonTier1TransmissionProps) {
  const tierName = tier === "tier2" ? "2차" : "3차";
  const [selectedPeriod, setSelectedPeriod] = useState("2026년 1월");

  // Mock 데이터 준비 상태 (2차/3차는 다른 상태 예시)
  const [ownDataStatus] = useState<"complete" | "incomplete" | "pending">(
    tier === "tier2" ? "complete" : "pending"
  );
  const [supplierDataStatus] = useState<"complete" | "incomplete" | "partial">(
    tier === "tier2" ? "partial" : "incomplete"
  );
  const [pcfStatus] = useState<"complete" | "incomplete" | "pending">(
    tier === "tier2" ? "complete" : "incomplete"
  );

  // 전송 가능 여부 판단
  const canTransmit = ownDataStatus === "complete" && 
                       supplierDataStatus === "complete" && 
                       pcfStatus === "complete";

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
          상위차사로 PCF 데이터 패키지를 전송합니다 ({tierName} 협력사)
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

            {supplierDataStatus === "partial" && (
              <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#F8F9FB' }}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'var(--aifix-gray)' }}>전체 협력사</span>
                  <span style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>5개</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'var(--aifix-gray)' }}>검토 완료</span>
                  <span style={{ fontWeight: 600, color: 'var(--aifix-success)' }}>3개</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--aifix-gray)' }}>검토 필요</span>
                  <span style={{ fontWeight: 600, color: '#EF4444' }}>2개</span>
                </div>
              </div>
            )}

            {supplierDataStatus === "incomplete" && (
              <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#F8F9FB' }}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'var(--aifix-gray)' }}>전체 협력사</span>
                  <span style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>3개</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'var(--aifix-gray)' }}>검토 완료</span>
                  <span style={{ fontWeight: 600, color: 'var(--aifix-success)' }}>0개</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--aifix-gray)' }}>검토 필요</span>
                  <span style={{ fontWeight: 600, color: '#EF4444' }}>3개</span>
                </div>
              </div>
            )}

            <p style={{ fontSize: '14px', color: 'var(--aifix-gray)', lineHeight: 1.6 }}>
              {supplierDataStatus === "complete" ? (
                <>하위 협력사 데이터 검토 및 수정이 완료되었습니다. 전송 준비 상태입니다.</>
              ) : supplierDataStatus === "partial" ? (
                <>일부 하위 협력사의 데이터 검토가 필요합니다. 데이터 관리 탭에서 확인하세요.</>
              ) : (
                <>하위 협력사 데이터 검토가 필요합니다. 데이터 관리 탭에서 확인하세요.</>
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
            disabled={!canTransmit}
            className="px-8 py-4 rounded-xl transition-all flex items-center gap-3 mx-auto"
            style={{
              background: canTransmit 
                ? 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)'
                : '#E5E7EB',
              color: canTransmit ? 'white' : '#9CA3AF',
              fontWeight: 600,
              fontSize: '16px',
              cursor: canTransmit ? 'pointer' : 'not-allowed',
              boxShadow: canTransmit ? '0px 4px 12px rgba(91, 59, 250, 0.2)' : 'none'
            }}
          >
            <Send className="w-5 h-5" />
            상위차사에게 데이터 전송
          </button>
          
          {!canTransmit && (
            <p className="mt-4" style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              모든 데이터 준비가 완료되면 전송이 가능합니다.
            </p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

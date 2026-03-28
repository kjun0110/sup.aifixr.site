'use client';

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ProjectNav } from "../components/ProjectNav";
import { SupplyChainManagement } from "../components/SupplyChainManagement";
import { DataManagementNew } from "../components/DataManagementNew";
import { Tier1Dashboard } from "../components/tier1/Tier1Dashboard";
import { Tier1DataLookup } from "../components/tier1/Tier1DataLookup";
import { Tier1PCFSubmit } from "../components/tier1/Tier1PCFSubmit";
import { Tier1Transmission } from "../components/tier1/Tier1Transmission";
import { Tier1History } from "../components/tier1/Tier1History";
import { NonTier1Dashboard } from "../components/non-tier1/NonTier1Dashboard";
import { NonTier1DataView } from "../components/non-tier1/NonTier1DataView";
import { NonTier1PCFSubmit } from "../components/non-tier1/NonTier1PCFSubmit";
import { NonTier1Transmission } from "../components/non-tier1/NonTier1Transmission";
import { NonTier1History } from "../components/non-tier1/NonTier1History";
import { getMyProjectDetail, SupplierProject } from "../../lib/api/supply-chain";
import { setSupAccessToken } from "../../lib/api/sessionAccessToken";
import { actorStorageKey } from "../../lib/api/client";
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  ArrowDownRight 
} from "lucide-react";

// Mock project data (목 데이터 유지)
const mockProjectData: Record<string, { name: string; clientName: string; contractNumber: string; tier: "tier1" | "tier2" | "tier3" }> = {
  p1: { 
    name: "[삼성SDI] 양극재 납품", 
    clientName: "삼성SDI", 
    contractNumber: "CT-2026-003",
    tier: "tier1"
  },
  p2: { 
    name: "[동우전자부품] 전극제 납품", 
    clientName: "동우전자부품", 
    contractNumber: "CT-2026-002",
    tier: "tier2"
  },
  p3: { 
    name: "[세진케미칼] 리튬 납품", 
    clientName: "세진케미칼", 
    contractNumber: "CT-2026-001",
    tier: "tier3"
  },
};

export function ProjectView() {
  const params = useParams();
  const router = useRouter();
  const projectIdParam = typeof params.projectId === 'string' ? params.projectId : params.projectId?.[0];
  const [activeTab, setActiveTab] = useState("dashboard");
  const searchParams = useSearchParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const currentTier = project?.tier || "tier1";

  // 프로젝트 상세 정보 로드
  useEffect(() => {
    if (!projectIdParam) return;
    
    // 목 데이터 프로젝트인 경우 (p1, p2, p3)
    if (mockProjectData[projectIdParam]) {
      setProject(mockProjectData[projectIdParam]);
      setLoading(false);
      return;
    }
    
    // 실제 프로젝트인 경우 (real-로 시작하는 경우)
    if (projectIdParam.startsWith('real-')) {
      const numericId = projectIdParam.replace(/^real-/, '');
      const projectId = parseInt(numericId, 10);
      
      if (isNaN(projectId)) {
        console.error("Invalid project ID:", projectIdParam);
        setLoading(false);
        return;
      }
      
      getMyProjectDetail(projectId)
        .then((data) => {
          setProject(data);
        })
        .catch((error) => {
          console.error("프로젝트 상세 조회 실패:", error);
          if (error instanceof Error && error.message.includes("401")) {
            setSupAccessToken(null);
            try {
              localStorage.removeItem(actorStorageKey());
            } catch {
              /* ignore */
            }
            router.push("/");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // 알 수 없는 프로젝트 ID
      console.error("Unknown project ID format:", projectIdParam);
      setLoading(false);
    }
  }, [projectIdParam, router]);

  // URL 파라미터에서 탭 읽기
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  if (loading) {
    return <div className="p-8 text-center">프로젝트 정보를 불러오는 중...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">프로젝트를 찾을 수 없습니다</div>;
  }

  // Render tab content based on tier and active tab
  const renderTabContent = () => {
    // Common tabs across all tiers
    switch (activeTab) {
      case "dashboard":
        return currentTier === "tier1" 
          ? <Tier1Dashboard /> 
          : <NonTier1Dashboard tier={currentTier} />;
      
      case "supply-chain":
        // 공급망 관리 화면 - 모든 차수 공통 (실제 프로젝트는 API에서 온 노드 ID로 하위 초대 연동)
        return (
          <SupplyChainManagement
            tier={currentTier}
            inviteContext={
              project?.project_id != null
                ? {
                    projectId: project.project_id,
                    parentNodeId: project.my_supply_chain_node_id ?? null,
                  }
                : null
            }
          />
        );
      
      case "data-mgmt":
        // 통합된 데이터 관리 화면 - 모든 차수 공통
        return <DataManagementNew tier={currentTier} />;
      
      case "data-view":
        return currentTier === "tier1"
          ? <Tier1DataLookup />
          : <NonTier1DataView tier={currentTier} />;
      
      case "pcf-submit":
        return currentTier === "tier1"
          ? <Tier1PCFSubmit />
          : <NonTier1PCFSubmit tier={currentTier} />;
      
      case "transmission":
        return currentTier === "tier1"
          ? <Tier1Transmission />
          : <NonTier1Transmission tier={currentTier} />;
      
      case "history":
        return currentTier === "tier1"
          ? <Tier1History />
          : <NonTier1History tier={currentTier} />;
      
      default:
        return <PlaceholderContent tier={currentTier} tabId={activeTab} />;
    }
  };

  return (
    <div className="min-w-0">
      <ProjectNav 
        tier={currentTier}
        projectName={project.name}
        clientName={project.clientName}
        contractNumber={project.contractNumber}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {renderTabContent()}
    </div>
  );
}

// Placeholder component for tabs that haven't been designed yet
function PlaceholderContent({ tier, tabId }: { tier: string; tabId: string }) {
  const getTabName = (id: string) => {
    const tabNames: Record<string, string> = {
      "dashboard": "대시보드",
      "supply-chain": "공급망 관리",
      "data-mgmt": "데이터 관리",
      "data-view": "데이터 조회",
      "pcf-submit": "PCF 산정",
      "transmission": "전송",
      "history": "이력",
    };
    return tabNames[id] || id;
  };

  return (
    <div className="pt-8">
      <div style={{ minHeight: '600px' }}>
      <div className="mb-8">
        <h2 className="text-3xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          {getTabName(tabId)}
        </h2>
        <p style={{ color: 'var(--aifix-gray)' }}>
          협력사 데이터를 관리하고 요청 기업에 제출합니다
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>총 데이터 제출률</span>
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--aifix-together)' }} />
          </div>
          <div className="text-4xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            87%
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: '14px', color: 'var(--aifix-together)' }}>
            <ArrowUpRight className="w-4 h-4" />
            <span>+12% 지난주 대비</span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>대기 중인 작업</span>
            <Clock className="w-5 h-5" style={{ color: 'var(--aifix-secondary)' }} />
          </div>
          <div className="text-4xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            5건
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
            <span>확인 필요</span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>완료된 작업</span>
            <CheckCircle className="w-5 h-5" style={{ color: '#4CAF50' }} />
          </div>
          <div className="text-4xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            28건
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: '14px', color: '#4CAF50' }}>
            <ArrowUpRight className="w-4 h-4" />
            <span>+8건 이번 주</span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>검토 요청</span>
            <AlertCircle className="w-5 h-5" style={{ color: '#FF9800' }} />
          </div>
          <div className="text-4xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            3건
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: '14px', color: '#FF9800' }}>
            <span>조치 필요</span>
          </div>
        </div>
      </div>

      {/* Role-specific Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Information Panel */}
        <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
          <h3 className="text-xl mb-6" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            권한 및 역할
          </h3>
          <div className="space-y-4">
            {tier === "tier1" ? (
              <>
                <div className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
                  >
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--aifix-primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>하위 공급망 관리</div>
                    <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                      하위 협력사의 구조와 데이터를 요청 기반으로 관리할 수 있습니다
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
                  >
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--aifix-primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>데이터 수정 요청</div>
                    <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                      하위 협력사의 데이터를 수정요청/보완요청을 통해 지원할 수 있습니다
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
                  >
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--aifix-primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>최종 취합 및 제출</div>
                    <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                      전체 공급망 데이터를 취합하여 요청 기업에 제출할 책임이 있습니다
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
                  >
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--aifix-primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>하위 공급망 조회</div>
                    <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                      자사의 하위 공급망 구조와 데이터를 조회할 수 있습니다
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--aifix-courage-light)', opacity: 0.3 }}
                  >
                    <AlertCircle className="w-4 h-4" style={{ color: 'var(--aifix-courage)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>데이터 수정 요청만 가능</div>
                    <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                      하위 협력사 데이터는 즉시 편집할 수 없으며, 수정 요청만 가능합니다
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
                  >
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--aifix-primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>요청 기업 제출</div>
                    <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                      자사 구간의 데이터를 취합하여 요청 기업에 제출합니다
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
          <h3 className="text-xl mb-6" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            빠른 작업
          </h3>
          <div className="space-y-3">
            <button 
              className="w-full text-left px-6 py-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
                boxShadow: '0px 4px 12px rgba(91, 59, 250, 0.2)',
                color: 'white',
                fontWeight: 600,
              }}
            >
              공급망 관리
            </button>
            <button 
              className="w-full text-left px-6 py-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                backgroundColor: 'white',
                border: '2px solid var(--aifix-primary)',
                color: 'var(--aifix-primary)',
                fontWeight: 600,
              }}
            >
              데이터 관리
            </button>
            <button 
              className="w-full text-left px-6 py-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                backgroundColor: 'white',
                border: '2px solid var(--aifix-primary)',
                color: 'var(--aifix-primary)',
                fontWeight: 600,
              }}
            >
              PCF 산정
            </button>
          </div>
        </div>
      </div>

      {/* Note about Content */}
      <div 
        className="mt-12 p-8 rounded-[20px] border-2 border-dashed"
        style={{ borderColor: 'var(--aifix-primary)', backgroundColor: 'var(--aifix-secondary-light)' }}
      >
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--aifix-primary)' }} />
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--aifix-navy)', marginBottom: '8px' }}>
              구조 설계 단계 안내
            </h4>
            <p style={{ color: 'var(--aifix-gray)', lineHeight: 1.6 }}>
              현재 화면은 정보구조(IA)와 네비게이션 설계 단계입니다. 
              각 탭(공급망 관리, 데이터 관리, 데이터 조회, PCF 산정, 이력)을 클릭했을 때 
              보이는 상세 콘텐츠(표, 폼, 차트 등)는 다음 단계에서 설계됩니다.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
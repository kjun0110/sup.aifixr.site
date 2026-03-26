"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "../components/ProjectCard";
import { Search } from "lucide-react";
import { getMyProjects, SupplierProject } from "../../lib/api/supply-chain";
import { getSupAccessToken } from "../../lib/api/sessionAccessToken";
import { AIFIXR_SESSION_UPDATED_EVENT } from "../../lib/api/client";

// Mock data for demonstration
const mockProjects = [
  {
    id: "p1",
    name: "[삼성SDI] 양극재 납품",
    clientName: "삼성SDI",
    productName: "양극재",
    productItemNumber: "AUDI_PROD_A_001",
    contractPeriod: "2026.01 ~ 2026.12",
    contractNumber: "CT-2026-003",
    lastSubmission: "2026-03-03",
    status: "진행중",
  },
  {
    id: "p2",
    name: "[동우전자부품] 전극제 납품",
    clientName: "동우전자부품",
    productName: "전극제",
    productItemNumber: "AUDI_PROD_A_002",
    contractPeriod: "2026.04 ~ 2027.03",
    contractNumber: "CT-2026-002",
    lastSubmission: "2026-02-28",
    status: "검토중",
  },
  {
    id: "p3",
    name: "[세진케미칼] 리튬 납품",
    clientName: "세진케미칼",
    productName: "리튬",
    productItemNumber: "AUDI_PROD_A_003",
    contractPeriod: "2026.06 ~ 2027.12",
    contractNumber: "CT-2026-001",
    lastSubmission: "2026-03-01",
    status: "진행중",
  },
];

export function ProjectSelection() {
  const router = useRouter();
  const [realProjects, setRealProjects] = useState<SupplierProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let loadAttempted = false;
    
    const load = async () => {
      if (loadAttempted) return;
      loadAttempted = true;
      
      // 로그인 체크 (메모리 토큰)
      const token = getSupAccessToken();
      if (!token) {
        console.log("로그인 토큰이 없습니다. 로그인 페이지로 이동합니다.");
        router.push("/");
        return;
      }

      try {
        const projects = await getMyProjects();
        if (mounted) {
          setRealProjects(projects);
        }
      } catch (error) {
        console.error("프로젝트 목록 조회 실패:", error);
        // 401 에러면 로그인 페이지로 리다이렉트
        if (error instanceof Error && error.message?.includes("401")) {
          localStorage.clear();
          router.push("/");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    // 세션 복원 대기 후 로드
    const timer = setTimeout(() => {
      void load();
    }, 500);
    
    // 세션 업데이트 이벤트 리스너
    const handleSessionUpdate = () => {
      clearTimeout(timer);
      void load();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener(AIFIXR_SESSION_UPDATED_EVENT, handleSessionUpdate);
    }
    
    return () => {
      mounted = false;
      clearTimeout(timer);
      if (typeof window !== 'undefined') {
        window.removeEventListener(AIFIXR_SESSION_UPDATED_EVENT, handleSessionUpdate);
      }
    };
  }, [router]);

  // Mock 데이터와 실제 데이터 합치기
  const allProjects = [...mockProjects, ...realProjects];
  return (
    <div>
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-5xl mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          프로젝트 선택
        </h1>
        <p className="text-lg" style={{ color: 'var(--aifix-gray)' }}>
          참여 중인 프로젝트를 선택하여 업무를 진행하세요
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" 
              style={{ color: 'var(--aifix-gray)' }} 
            />
            <input
              type="text"
              placeholder="프로젝트명, 계약번호, 납품 품목, 요청 기업 검색"
              className="w-full pl-12 pr-4 py-4 rounded-xl border-none outline-none"
              style={{
                backgroundColor: 'white',
                boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
              }}
            />
          </div>

          <select 
            className="px-6 py-4 rounded-xl border-none outline-none cursor-pointer"
            style={{
              backgroundColor: 'white',
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
              fontWeight: 500,
            }}
          >
            <option>전체 상태</option>
            <option>진행중</option>
            <option>검토중</option>
            <option>완료</option>
          </select>
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            프로젝트 목록을 불러오는 중...
          </div>
        ) : (
          <>
            {mockProjects.map((project) => (
              <ProjectCard key={`mock-${project.id}`} {...project} />
            ))}
            {realProjects.map((project) => (
              <ProjectCard key={`real-${project.id}`} {...project} />
            ))}
          </>
        )}
      </div>

      {/* Empty State (hidden when there are projects) */}
      {!loading && allProjects.length === 0 && (
        <div className="text-center py-24">
          <div 
            className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
          >
            <Search className="w-12 h-12" style={{ color: 'var(--aifix-secondary)' }} />
          </div>
          <h3 className="text-2xl mb-2" style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
            참여 중인 프로젝트가 없습니다
          </h3>
          <p style={{ color: 'var(--aifix-gray)' }}>
            요청 기업으로부터 프로젝트 초대를 받으면 여기에 표시됩니다
          </p>
        </div>
      )}
    </div>
  );
}
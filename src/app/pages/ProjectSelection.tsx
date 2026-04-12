"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "../components/ProjectCard";
import { Search } from "lucide-react";
import { getMyProjects, SupplierProject } from "../../lib/api/supply-chain";
import { getSupAccessToken } from "../../lib/api/sessionAccessToken";
import { AIFIXR_SESSION_UPDATED_EVENT } from "../../lib/api/client";

function buildDisplayName(project: SupplierProject): string {
  const rawName = String(project.name ?? "").trim();
  const item = String(project.productName ?? "").trim();
  if (!item) return rawName || "[알 수 없음] 납품";
  if (!rawName) return `[${project.clientName || "알 수 없음"}] ${item} 납품`;
  // API 제목이 "[회사] 납품" 형태면 품목명을 삽입
  if (/^\[[^\]]+\]\s*납품$/.test(rawName)) {
    // catalog 코드(prodA 등)로 보이는 값은 제목에 끼워 넣지 않음
    if (!/[가-힣]/.test(item)) return rawName;
    return rawName.replace(/납품$/, `${item} 납품`);
  }
  // 이미 품목이 들어있거나 다른 포맷이면 원문 유지
  return rawName;
}

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

      try {
        // 로그인 체크 (메모리 토큰) — finally에서 로딩 해제
        const token = getSupAccessToken();
        if (!token) {
          console.log("로그인 토큰이 없습니다. 로그인 페이지로 이동합니다.");
          router.push("/");
          return;
        }

        const projects = await getMyProjects();
        if (mounted) {
          setRealProjects(projects);
        }
      } catch (error) {
        console.error("프로젝트 목록 조회 실패:", error);
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

  const displayRealProjects: SupplierProject[] = realProjects.map((project) => ({
    ...project,
    name: buildDisplayName(project),
  }));
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
            {displayRealProjects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </>
        )}
      </div>

      {/* Empty State (hidden when there are projects) */}
      {!loading && displayRealProjects.length === 0 && (
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
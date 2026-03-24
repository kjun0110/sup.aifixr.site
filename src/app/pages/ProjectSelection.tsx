import { ProjectCard } from "../components/ProjectCard";
import { Search } from "lucide-react";

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
        {mockProjects.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>

      {/* Empty State (hidden when there are projects) */}
      {mockProjects.length === 0 && (
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
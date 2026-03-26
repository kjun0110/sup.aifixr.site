import { apiFetch } from "./client";
import { API_PREFIX } from "./paths";

/** 공급망·프로젝트 (원청/협력사 라우트는 경로 뒤에서 분기) */
export const SUPPLY_CHAIN_BASE = API_PREFIX.SUPPLY_CHAIN;

export interface SupplierProject {
  id: string;
  project_id: number;
  name: string;
  clientName: string;
  productName: string;
  productItemNumber: string;
  contractPeriod: string;
  contractNumber: string;
  lastSubmission: string | null;
  status: string;
  company_name: string;
  supplier_id: number;
  tier?: string;
}

/** 협력사 사용자가 참여 중인 프로젝트 목록 조회 */
export async function getMyProjects(): Promise<SupplierProject[]> {
  return apiFetch<SupplierProject[]>(`${SUPPLY_CHAIN_BASE}/supplier-projects/my-projects`);
}

/** 협력사 프로젝트 상세 조회 */
export async function getMyProjectDetail(projectId: number): Promise<SupplierProject> {
  return apiFetch<SupplierProject>(`${SUPPLY_CHAIN_BASE}/supplier-projects/my-projects/${projectId}`);
}

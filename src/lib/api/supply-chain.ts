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
  /** 공급망 승인 노드 기준 UI 차수 (프로젝트마다 다를 수 있음) */
  tier?: string;
  product_variant_id?: number | null;
  /** 하위 초대 시 parent_supply_chain_node_id 로 사용 */
  my_supply_chain_node_id?: number | null;
}

/** 협력사 사용자가 참여 중인 프로젝트 목록 조회 */
export async function getMyProjects(): Promise<SupplierProject[]> {
  return apiFetch<SupplierProject[]>(`${SUPPLY_CHAIN_BASE}/supplier-projects/my-projects`);
}

/** 협력사 프로젝트 상세 조회 */
export async function getMyProjectDetail(projectId: number): Promise<SupplierProject> {
  return apiFetch<SupplierProject>(`${SUPPLY_CHAIN_BASE}/supplier-projects/my-projects/${projectId}`);
}

/** 내 노드 직하위로 등록한 공급망 노드(모든 상태) — 초대 시 선택·추가 담당자 초대 */
export type RegisteredDirectChild = {
  id: number;
  supplier_id: number;
  company_name: string;
  status: string;
  node_code: string | null;
};

export async function getRegisteredDirectChildren(
  projectId: number,
): Promise<RegisteredDirectChild[]> {
  return apiFetch<RegisteredDirectChild[]>(
    `${SUPPLY_CHAIN_BASE}/supplier-projects/my-projects/${projectId}/registered-direct-children`,
  );
}

export async function postRegisterDirectChild(
  projectId: number,
  body: { company_name: string; business_registration_number: string },
): Promise<RegisteredDirectChild> {
  return apiFetch<RegisteredDirectChild>(
    `${SUPPLY_CHAIN_BASE}/supplier-projects/my-projects/${projectId}/registered-direct-children`,
    {
      method: "POST",
      json: body,
    },
  );
}

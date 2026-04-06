import { apiFetch } from "./client";
import { API_PREFIX } from "./paths";

export const DATA_MGMT_BASE = API_PREFIX.DATA_MGMT;

export type SupSupplyChainTreeNodeDto = {
  node_id: number | null;
  supplier_id: number;
  supplier_name: string;
  country?: string | null;
  company_type?: string | null;
  delivery_qty?: string | null;
  data_status: string;
  last_updated?: string | null;
  dqr?: string | null;
  pcf_status: string;
  /** 산정 완료 시 kg CO2e, 없으면 null */
  pcf_total_co2e_kg?: number | null;
  upstream_ready?: string | null;
  children: SupSupplyChainTreeNodeDto[];
  is_me?: boolean;
};

export type SupSupplyChainTreeRequestBody = {
  reporting_year: number;
  reporting_month: number;
  product_variant_id?: number | null;
};

export type SupDataRequestCreateBody = {
  project_id: number;
  product_id: number;
  product_variant_id: number;
  reporting_year: number;
  reporting_month: number;
  requester_supply_chain_node_id?: number | null;
  request_mode?: "chain" | "direct";
  message?: string | null;
  due_date?: string | null;
  target_supply_chain_node_ids: number[];
};

export type SupDataRequestCreateResponse = {
  request_id: number;
  status: string;
  target_count: number;
  message: string;
};

/** 협력사 기준 공급망 트리 — 루트가 로그인 협력사(내 노드) */
export async function postSupSupplyChainTree(
  projectId: number,
  productId: number,
  supplierId: number,
  body: SupSupplyChainTreeRequestBody,
): Promise<SupSupplyChainTreeNodeDto> {
  return apiFetch<SupSupplyChainTreeNodeDto>(
    `${DATA_MGMT_BASE}/sup/projects/${projectId}/products/${productId}/suppliers/${supplierId}/supply-chain/tree`,
    { method: "POST", json: body },
  );
}

export async function postSupDataRequest(
  body: SupDataRequestCreateBody,
): Promise<SupDataRequestCreateResponse> {
  return apiFetch<SupDataRequestCreateResponse>(
    `${DATA_MGMT_BASE}/sup/data-requests`,
    { method: "POST", json: body },
  );
}

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
  upstream_ready?: string | null;
  children: SupSupplyChainTreeNodeDto[];
  is_me?: boolean;
};

export type SupSupplyChainTreeRequestBody = {
  reporting_year: number;
  reporting_month: number;
  product_variant_id?: number | null;
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

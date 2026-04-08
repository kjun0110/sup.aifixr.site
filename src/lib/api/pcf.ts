import { API_PREFIX } from "./paths";
import { apiFetch } from "./client";

export const PCF_BASE = API_PREFIX.PCF;

export type PcfRunExecuteBody = {
  project_id: number;
  product_id: number;
  product_variant_id: number;
  reporting_year: number;
  reporting_month: number;
  calculation_mode: "partial" | "final";
};

export type PcfScopeItem = { scope: string; co2e_kg: number | null };

export type PcfRunExecuteResponse = {
  calculation_run_id: number;
  display_id: string;
  status: string;
  total_co2e_kg: number | null;
  product_result_id: number | null;
  scopes: PcfScopeItem[];
  message?: string | null;
};

export type TransferShareBody = {
  project_id: number;
  product_id: number;
  product_variant_id: number;
  reporting_year: number;
  reporting_month: number;
  result_kind?: "partial" | "final";
};

export async function postSupPcfRunExecute(
  body: PcfRunExecuteBody,
): Promise<PcfRunExecuteResponse> {
  return apiFetch<PcfRunExecuteResponse>(`${PCF_BASE}/runs/execute/supplier`, {
    method: "POST",
    json: body,
  });
}

export async function postSupPcfTransferShare(
  body: TransferShareBody,
): Promise<{
  upstream_share_id: number;
  status: string;
  shared_at?: string | null;
  shared_result_kind?: string | null;
}> {
  return apiFetch(`${PCF_BASE}/transfer/share`, {
    method: "POST",
    json: body,
  });
}

export type SupPcfTransferReadinessResponse = {
  project_id: number;
  product_id: number;
  product_variant_id: number;
  supply_chain_node_id: number;
  reporting_year: number;
  reporting_month: number;
  own_pcf_input_ready: boolean;
  all_children_transferred: boolean;
  child_total: number;
  child_transferred_count: number;
  pcf_calculation_done: boolean;
  can_transfer: boolean;
  has_direct_request_pending: boolean;
  direct_request_pending_count: number;
  already_transferred: boolean;
  package_summary: string[];
};

export async function getSupPcfTransferReadiness(q: {
  project_id: number;
  product_id: number;
  product_variant_id: number;
  reporting_year: number;
  reporting_month: number;
}): Promise<SupPcfTransferReadinessResponse> {
  const params = new URLSearchParams({
    project_id: String(q.project_id),
    product_id: String(q.product_id),
    product_variant_id: String(q.product_variant_id),
    reporting_year: String(q.reporting_year),
    reporting_month: String(q.reporting_month),
  });
  return apiFetch<SupPcfTransferReadinessResponse>(
    `${PCF_BASE}/transfer/readiness?${params.toString()}`,
  );
}

/** `GET /readiness/supplier` — 협력사 노드 기준 자사 입력·하위 전송·커버리지·DQR (원청 readiness/opr와 대응) */
export type PcfReadinessSupplierChild = {
  child_supply_chain_node_id: number;
  supplier_id: number;
  supplier_name?: string | null;
  share_status: string;
  ready: boolean;
};

export type PcfReadinessSupplierResponse = {
  scope: string;
  project_id: number;
  product_id: number;
  product_variant_id: number;
  supply_chain_node_id: number;
  reporting_year: number;
  reporting_month: number;
  sup_submission_status?: string | null;
  own_pcf_input_ready: boolean;
  child_total: number;
  child_shared_count: number;
  all_children_shared: boolean;
  has_pcf_result: boolean;
  can_run_calculation: boolean;
  data_coverage_pct: number;
  avg_dqr: number;
  children: PcfReadinessSupplierChild[];
};

export async function getSupPcfReadiness(q: {
  project_id: number;
  product_id: number;
  product_variant_id: number;
  reporting_year: number;
  reporting_month: number;
}): Promise<PcfReadinessSupplierResponse> {
  const params = new URLSearchParams({
    project_id: String(q.project_id),
    product_id: String(q.product_id),
    product_variant_id: String(q.product_variant_id),
    reporting_year: String(q.reporting_year),
    reporting_month: String(q.reporting_month),
  });
  return apiFetch<PcfReadinessSupplierResponse>(
    `${PCF_BASE}/readiness/supplier?${params.toString()}`,
  );
}

/** `GET /runs` — 협력사는 `product_variant_id` 필수 */
export type PcfRunListItemDto = {
  id: number;
  display_id: string;
  project_id: number;
  product_id: number;
  product_name?: string | null;
  product_variant_id?: number | null;
  bom_label?: string | null;
  reporting_year: number;
  reporting_month: number;
  run_kind: string;
  status: string;
  subject_supply_chain_node_id?: number | null;
  data_coverage_pct?: number | null;
  total_co2e_kg?: number | null;
  pcf_per_declared_unit_kg?: number | null;
  pcf_per_product_mass_kg?: number | null;
  executed_by_name?: string | null;
  created_at?: string | null;
  finished_at?: string | null;
};

export async function getSupPcfRuns(q: {
  project_id: number;
  product_id?: number;
  product_variant_id: number;
  reporting_year?: number;
  reporting_month?: number;
  limit?: number;
  offset?: number;
}): Promise<PcfRunListItemDto[]> {
  const params = new URLSearchParams();
  params.set("project_id", String(q.project_id));
  if (q.product_id != null) params.set("product_id", String(q.product_id));
  params.set("product_variant_id", String(q.product_variant_id));
  if (q.reporting_year != null) params.set("reporting_year", String(q.reporting_year));
  if (q.reporting_month != null) params.set("reporting_month", String(q.reporting_month));
  params.set("limit", String(q.limit ?? 50));
  params.set("offset", String(q.offset ?? 0));
  return apiFetch<PcfRunListItemDto[]>(`${PCF_BASE}/runs?${params.toString()}`);
}


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
): Promise<{ upstream_share_id: number; status: string; shared_at?: string | null }> {
  return apiFetch(`${PCF_BASE}/transfer/share`, {
    method: "POST",
    json: body,
  });
}


import { apiFetch, apiFetchBlob } from "./client";
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

/** 알림 `data_request_target` → 데이터 관리 탭 이동용 */
export type DataRequestTargetNavigationResponse = {
  project_id: number;
  product_id: number;
  product_variant_id: number;
  reporting_year: number;
  reporting_month: number;
  target_supply_chain_node_id: number;
};

export async function getDataRequestTargetNavigation(
  targetId: number,
  supplierId: number,
): Promise<DataRequestTargetNavigationResponse> {
  const q = new URLSearchParams({ supplier_id: String(supplierId) });
  return apiFetch<DataRequestTargetNavigationResponse>(
    `${DATA_MGMT_BASE}/sup/data-requests/targets/${targetId}/navigation?${q.toString()}`,
  );
}

/** UI 세부탭 id → Tier0 시트 id (원청 export.xlsx 와 동일) */
export const SUP_DETAIL_TAB_TO_SHEET_ID: Record<string, number> = {
  "company-info": 8,
  contacts: 2,
  facilities: 1,
  products: 7,
  materials: 5,
  energy: 6,
  transport: 9,
};

export type SupMonthlyExportXlsxParams = {
  projectId: number;
  productId: number;
  supplierId: number;
  reportingYear: number;
  reportingMonth: number;
  productVariantId?: number | null;
  /** 쉼표 구분 시트 ID (예 "8,1,7") */
  sheets: string;
  /** 납품 행이 비었을 때 파일명용 — 데이터 관리 헤더 프로젝트명 등 */
  filenameHint?: string | null;
};

/** 협력사 월별 데이터 — Tier0 포맷 XLSX */
export async function getSupDataMgmtMonthlyExportXlsx(
  p: SupMonthlyExportXlsxParams,
): Promise<{ blob: Blob; filename: string | null }> {
  const q = new URLSearchParams();
  q.set("sheets", p.sheets);
  if (p.productVariantId != null && p.productVariantId >= 1) {
    q.set("product_variant_id", String(p.productVariantId));
  }
  const hint = (p.filenameHint ?? "").trim();
  if (hint) {
    q.set("filename_hint", hint);
  }
  const path = `${DATA_MGMT_BASE}/sup/projects/${p.projectId}/products/${p.productId}/suppliers/${p.supplierId}/months/${p.reportingYear}/${p.reportingMonth}/export.xlsx?${q.toString()}`;
  return apiFetchBlob(path, { method: "GET" });
}

/** `PUT .../save` — SupSaveDeliveredAndActivitiesRequest */
export type SupSaveDeliveredAndActivitiesBody = {
  product_variant_id: number;
  delivered?: {
    delivered_product_name?: string | null;
    mineral_origin?: string | null;
    /** YYYY-MM-DD */
    delivery_date?: string | null;
    delivery_qty?: string | null;
    base_unit?: string | null;
    product_unit_capacity_kg?: string | null;
    defective_qty?: string | null;
    waste_qty?: string | null;
    waste_qty_unit?: string | null;
    waste_emission_factor?: string | null;
    waste_emission_factor_unit?: string | null;
    sup_workplace_id?: number | null;
    sup_contact_id?: number | null;
  } | null;
  material_rows: Record<string, unknown>[];
  energy_rows: Record<string, unknown>[];
  transport_rows: Record<string, unknown>[];
  confirm_outlier_ack?: boolean;
};

export type SupSaveDeliveredAndActivitiesResponse = {
  saved: boolean;
  red_flags: { message?: string; code?: string; field?: string }[];
  yellow_warnings: unknown[];
  outlier_review_phase: string;
  message: string;
};

export async function putSupDataMgmtMonthlySave(p: {
  projectId: number;
  productId: number;
  supplierId: number;
  reportingYear: number;
  reportingMonth: number;
  body: SupSaveDeliveredAndActivitiesBody;
}): Promise<SupSaveDeliveredAndActivitiesResponse> {
  const path = `${DATA_MGMT_BASE}/sup/projects/${p.projectId}/products/${p.productId}/suppliers/${p.supplierId}/months/${p.reportingYear}/${p.reportingMonth}/save`;
  return apiFetch<SupSaveDeliveredAndActivitiesResponse>(path, {
    method: "PUT",
    json: p.body,
  });
}

/** GET .../detail — 월별 저장된 납품·자재·에너지·운송 (product_variant_id 필수) */
export type SupMonthlyDetailResponse = {
  project_id: number;
  product_id: number;
  supplier_id: number;
  reporting_year: number;
  reporting_month: number;
  readonly_identity: {
    company_name?: string | null;
    business_reg_no?: string | null;
    country?: string | null;
    note?: string;
  };
  editable_hint?: unknown | null;
  delivered_row: Record<string, unknown> | null;
  material_rows: Record<string, unknown>[];
  energy_rows: Record<string, unknown>[];
  transport_rows: Record<string, unknown>[];
};

export async function getSupDataMgmtMonthlyDetail(p: {
  projectId: number;
  productId: number;
  supplierId: number;
  reportingYear: number;
  reportingMonth: number;
  productVariantId: number;
}): Promise<SupMonthlyDetailResponse> {
  const q = new URLSearchParams();
  q.set("product_variant_id", String(p.productVariantId));
  const path = `${DATA_MGMT_BASE}/sup/projects/${p.projectId}/products/${p.productId}/suppliers/${p.supplierId}/months/${p.reportingYear}/${p.reportingMonth}/detail?${q.toString()}`;
  return apiFetch<SupMonthlyDetailResponse>(path, { method: "GET" });
}

/** Tier0/협력사 export.xlsx — `import-preview` 응답 (snake_case) */
export type SupImportPreviewWorkplaceContact = {
  site_name?: string;
  department?: string;
  position?: string;
  job_title?: string;
  name?: string;
  email?: string;
  phone?: string;
};

export type SupImportPreviewMaterial = {
  detail_product_name?: string;
  process_name?: string;
  input_material_name?: string;
  input_amount?: string;
  input_amount_unit?: string;
  material_emission_factor?: string;
  material_emission_factor_unit?: string;
  mineral_type?: string;
  mineral_amount?: string;
  mineral_amount_unit?: string;
  mineral_origin?: string;
  mineral_emission_factor?: string;
  mineral_emission_factor_unit?: string;
};

export type SupImportPreviewEnergy = {
  detail_product_name?: string;
  process_name?: string;
  energy_type?: string;
  energy_usage?: string;
  energy_unit?: string;
  energy_emission_factor?: string;
  energy_emission_factor_unit?: string;
};

export type SupImportPreviewProduction = {
  detail_product_name?: string;
  site_name?: string;
  /** 협력사 생산 시트 납품일: 조회 월의 일(1~31) */
  delivery_day?: string;
  production_qty?: string;
  production_qty_unit?: string;
  product_unit_capacity_kg?: string;
  defective_qty?: string;
  waste_qty?: string;
  waste_qty_unit?: string;
  waste_emission_factor?: string;
  waste_emission_factor_unit?: string;
};

export type SupImportPreviewTransport = {
  detail_product_name?: string;
  origin_country?: string;
  origin_address_detail?: string;
  destination_country?: string;
  destination_address_detail?: string;
  transport_mode?: string;
  transport_fuel_type?: string;
  transport_fuel_qty?: string;
  transport_fuel_qty_unit?: string;
  transport_qty?: string;
  transport_qty_unit?: string;
  transport_emission_factor?: string;
  transport_emission_factor_unit?: string;
};

export type SupImportPreviewResponse = {
  warnings?: string[];
  workplace_contacts: SupImportPreviewWorkplaceContact[];
  materials: SupImportPreviewMaterial[];
  energy_rows: SupImportPreviewEnergy[];
  production_rows: SupImportPreviewProduction[];
  transport_rows?: SupImportPreviewTransport[];
};

/** 월별 엑셀 미리보기 — DB 미반영(화면만). 원청 tier0/import-preview 와 동일 파서. */
export async function postSupDataMgmtImportPreview(p: {
  projectId: number;
  productId: number;
  supplierId: number;
  reportingYear: number;
  reportingMonth: number;
  file: File;
}): Promise<SupImportPreviewResponse> {
  const fd = new FormData();
  fd.append("file", p.file);
  const path = `${DATA_MGMT_BASE}/sup/projects/${p.projectId}/products/${p.productId}/suppliers/${p.supplierId}/months/${p.reportingYear}/${p.reportingMonth}/import-preview`;
  return apiFetch<SupImportPreviewResponse>(path, { method: "POST", body: fd });
}

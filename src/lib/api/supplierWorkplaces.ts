import { apiFetch } from "./client";
import { API_PREFIX } from "./paths";

const BASE = `${API_PREFIX.IAM}/supplier/me/workplaces`;

export type SupplierOrgWorkplaceRow = {
  id: number;
  workplace_name: string;
  business_reg_no: string | null;
  branch_workplace_no: string | null;
  country: string | null;
  address: string | null;
  rep_name: string | null;
  rep_email: string | null;
  rep_contact: string | null;
  rmi_smelter: string | null;
  feoc_status: string | null;
};

export type SupplierOrgWorkplaceCreateBody = {
  workplace_name: string;
  business_reg_no?: string | null;
  branch_workplace_no?: string | null;
  country?: string | null;
  address?: string | null;
  rep_name?: string | null;
  rep_email?: string | null;
  rep_contact?: string | null;
  rmi_smelter?: string | null;
  feoc_status?: string | null;
};

export type SupplierOrgWorkplacePatchBody = Partial<SupplierOrgWorkplaceCreateBody>;

export async function listMySupplierWorkplaces(): Promise<SupplierOrgWorkplaceRow[]> {
  return apiFetch<SupplierOrgWorkplaceRow[]>(BASE);
}

export async function createMySupplierWorkplace(
  body: SupplierOrgWorkplaceCreateBody,
): Promise<SupplierOrgWorkplaceRow> {
  return apiFetch<SupplierOrgWorkplaceRow>(BASE, {
    method: "POST",
    json: body,
  });
}

export async function patchMySupplierWorkplace(
  workplaceId: number,
  body: SupplierOrgWorkplacePatchBody,
): Promise<SupplierOrgWorkplaceRow> {
  return apiFetch<SupplierOrgWorkplaceRow>(`${BASE}/${workplaceId}`, {
    method: "PATCH",
    json: body,
  });
}

export async function deleteMySupplierWorkplace(workplaceId: number): Promise<void> {
  await apiFetch<void>(`${BASE}/${workplaceId}`, { method: "DELETE" });
}

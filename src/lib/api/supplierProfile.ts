import { apiFetch } from "./client";
import { API_PREFIX } from "./paths";

const BASE = API_PREFIX.IAM;

export type SupplierProfileContactRow = {
  department: string;
  position: string;
  name: string;
  email: string;
  phone: string;
  project_id: number | null;
};

export type SupplierProfileMe = {
  has_profile: boolean;
  company_name: string;
  business_reg_no: string;
  rep_name: string | null;
  address: string | null;
  department_name: string | null;
  position: string | null;
  contact_name: string;
  email: string | null;
  contact: string | null;
  contacts: SupplierProfileContactRow[];
  country_location: string;
  duns_number: string;
  tax_id: string;
  website_url: string;
  rep_email: string;
  rep_phone: string;
  supplier_type: string;
  rmi_certified: string;
  feoc_status: string;
};

/** PATCH 시 보낼 수 있는 필드(전부 선택). */
export type SupplierProfileMePatch = Partial<{
  company_name: string;
  business_reg_no: string;
  rep_name: string | null;
  address: string | null;
  department_name: string | null;
  position: string | null;
  contact_name: string;
  email: string | null;
  contact: string | null;
  country_location: string;
  duns_number: string;
  tax_id: string;
  website_url: string;
  rep_email: string;
  rep_phone: string;
  supplier_type: string;
  rmi_certified: string;
  feoc_status: string;
}>;

export async function getMySupplierProfile(): Promise<SupplierProfileMe> {
  return apiFetch<SupplierProfileMe>(`${BASE}/supplier/me/profile`);
}

export async function patchMySupplierProfile(
  body: SupplierProfileMePatch,
): Promise<SupplierProfileMe> {
  return apiFetch<SupplierProfileMe>(`${BASE}/supplier/me/profile`, {
    method: "PATCH",
    json: body,
  });
}

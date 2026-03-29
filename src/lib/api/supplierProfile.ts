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
};

export async function getMySupplierProfile(): Promise<SupplierProfileMe> {
  return apiFetch<SupplierProfileMe>(`${BASE}/supplier/me/profile`);
}

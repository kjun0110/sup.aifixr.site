import { apiFetch } from "./client";
import { API_PREFIX } from "./paths";

/** IAM 베이스 경로 — 가입·승인·로그인 등 */
export const IAM_BASE = API_PREFIX.IAM;

/** 협력사 회원가입 제출 (이메일/비밀번호) */
export async function submitSignup(
  inviteToken: string,
  data: {
    company_name: string;
    rep_name: string;
    business_reg_no: string;
    address: string;
    name: string;
    contact: string;
    email: string;
    password: string;
    password_confirm: string;
    terms_agreed: boolean;
  }
): Promise<{
  success: boolean;
  signup_request_id: number | null;
  message: string;
  redirect_to_login: boolean;
}> {
  return apiFetch(`${IAM_BASE}/signup/${inviteToken}/submit`, {
    method: "POST",
    json: data,
  });
}

/** 협력사 회원가입 제출 (Google OAuth) */
export async function submitGoogleSignup(
  inviteToken: string,
  data: {
    google_user_id: string;
    google_email: string;
    google_name: string | null;
    google_refresh_token: string;
    google_scope: string | null;
    company_name: string;
    rep_name: string;
    business_reg_no: string;
    address: string;
    name: string;
    contact: string;
    department_name: string | null;
    position: string | null;
    terms_agreed: boolean;
  }
): Promise<{
  success: boolean;
  signup_request_id: number | null;
  message: string;
  redirect_to_login: boolean;
}> {
  return apiFetch(`${IAM_BASE}/signup/${inviteToken}/submit-google`, {
    method: "POST",
    json: data,
  });
}

/**
 * 협력사 로그인 (이메일/비밀번호) - Gateway를 통한 로그인
 */
export async function login(
  email: string,
  password: string
): Promise<{
  accessToken: string;
  user: {
    id: string;
    email: string;
    userType: string;
    companyName?: string;
    provider: string;
  };
}> {
  return apiFetch(`/api/auth/sup/login`, {
    method: "POST",
    json: { email, password },
  });
}

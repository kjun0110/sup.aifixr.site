import { apiFetch, apiUrl, AIFIXR_SESSION_UPDATED_EVENT } from "./client";
import { setSupAccessToken } from "./sessionAccessToken";
import { API_PREFIX, PATH_AUTH_SUP_LOGIN } from "./paths";

/** IAM 베이스 경로 — 가입·승인·로그인 등 */
export const IAM_BASE = API_PREFIX.IAM;

/** 협력사 회원가입 제출 (이메일/비밀번호) */
export async function submitSignup(
  inviteToken: string,
  data: {
    company_name: string;
    rep_name: string;
    business_reg_no: string;
    country_location?: string | null;
    address: string;
    name: string;
    contact: string;
    email: string;
    department_name?: string | null;
    position?: string | null;
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
    country_location?: string | null;
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

export type SupLoginUser = {
  id: string;
  email: string;
  userType: string;
  companyName?: string;
  provider: string;
};

export type SupLoginResponse = {
  accessToken: string;
  user: SupLoginUser;
};

export class SupLoginFailedError extends Error {
  constructor(message = "이메일 또는 비밀번호가 올바르지 않습니다.") {
    super(message);
    this.name = "SupLoginFailedError";
    Object.setPrototypeOf(this, SupLoginFailedError.prototype);
  }
}

/**
 * 협력사 로그인 (이메일/비밀번호) - Gateway를 통한 로그인
 */
export async function login(
  email: string,
  password: string
): Promise<SupLoginResponse> {
  const res = await fetch(apiUrl(PATH_AUTH_SUP_LOGIN), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email: email.trim(), password }),
  });

  if (res.status === 401) {
    throw new SupLoginFailedError();
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `로그인 실패 (${res.status})`);
  }

  const data = (await res.json()) as SupLoginResponse;
  if (typeof window !== "undefined") {
    setSupAccessToken(data.accessToken);
    localStorage.setItem("user_id", data.user.id);
    localStorage.setItem("user_type", data.user.userType);
    localStorage.setItem("sup_user_email", data.user.email);
    if (data.user.companyName) {
      localStorage.setItem("company_name", data.user.companyName);
    }
    window.dispatchEvent(new Event(AIFIXR_SESSION_UPDATED_EVENT));
  }
  return data;
}

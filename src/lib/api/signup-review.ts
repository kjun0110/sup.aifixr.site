import { apiFetch } from "./client";
import { API_PREFIX } from "./paths";

const IAM_BASE = API_PREFIX.IAM;

/** 직상위 담당자(원청·협력사) — 하위 가입 신청 승인 */
export async function approveSignupRequest(signupRequestId: number): Promise<void> {
  await apiFetch(`${IAM_BASE}/signup-requests/${signupRequestId}/approve`, {
    method: "POST",
  });
}

export async function rejectSignupRequest(
  signupRequestId: number,
  reason?: string,
): Promise<void> {
  await apiFetch(`${IAM_BASE}/signup-requests/${signupRequestId}/reject`, {
    method: "POST",
    json: { reason },
  });
}

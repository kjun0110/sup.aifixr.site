import { apiFetch } from "./client";
import { API_PREFIX } from "./paths";

const BASE = API_PREFIX.INVITATION;

/** 초대 모듈 살아 있는지 확인 (문서: GET .../public/health) */
export async function getInvitationHealth(): Promise<{
  module?: string;
  status?: string;
}> {
  return apiFetch(`${BASE}/public/health`);
}

/** 초대 정보 조회 (문서: GET .../public/accept?token=xxx) */
export async function getInvitationPreview(publicToken: string): Promise<{
  invitee_email: string | null;
  invitee_name: string | null;
  invitee_company_hint: string | null;
  contract_agreed_at: string | null;
  status: string;
}> {
  return apiFetch(`${BASE}/public/accept?token=${encodeURIComponent(publicToken)}`);
}

/** 데이터 계약 동의 (문서: POST .../public/accept-agreement) */
export async function acceptAgreement(publicToken: string): Promise<{
  invitation_id: number;
  contract_agreed_at: string;
  existing_supplier: boolean;
}> {
  return apiFetch(`${BASE}/public/accept-agreement`, {
    method: "POST",
    json: { public_token: publicToken },
  });
}

// TODO: POST /sup/invitations, POST /opr/invitations, 공개 수락 등


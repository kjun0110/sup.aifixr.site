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
  /** 직하위 등록 시 입력한 사업자번호(숫자), 복원 가능할 때만 */
  invitee_business_registration_hint?: string | null;
  /** DB에 동의 시각이 있으면 동의서 화면 생략 */
  contract_agreed_at?: string | null;
  status: string;
}> {
  return apiFetch(`${BASE}/public/accept?token=${encodeURIComponent(publicToken)}`);
}

/** 데이터 계약 동의 (문서: POST .../public/accept-agreement) */
export async function acceptAgreement(publicToken: string): Promise<{
  status: string;
  invitation_id: number;
  contract_agreed_at: string;
  existing_user_skip_signup: boolean;
}> {
  return apiFetch(`${BASE}/public/accept-agreement`, {
    method: "POST",
    json: { public_token: publicToken },
  });
}

/** 협력사 → 직하위 초대 (POST /sup/invitations) */
export type SupInvitePayload = {
  parent_supply_chain_node_id: number;
  /** 직하위 등록 API로 만든 added 노드 — 지정 시 백엔드에서 회사명 일치 검증 */
  child_supply_chain_node_id?: number;
  invitee: {
    company_name: string;
    contact_name: string;
    email: string;
  };
  expire_days?: number;
  email_subject?: string;
  email_body?: string;
};

export type InvitationCreatedItem = {
  id: number;
  invitee_email?: string | null;
  invitee_company_hint?: string | null;
  invitee_name?: string | null;
  status: string;
  sent_at?: string | null;
  expires_at?: string | null;
  public_token: string;
};

export type InvitationHistoryItem = {
  id: number;
  project_id: number;
  product_id: number;
  product_variant_id: number;
  parent_supply_chain_node_id?: number | null;
  invitee_company_hint?: string | null;
  invitee_name?: string | null;
  invitee_email?: string | null;
  status: string;
  sent_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  last_signup_request_id?: number | null;
  /** 승인 대기(pending_approval) 신청 id — 있으면 직상위 승인/반려 UI */
  pending_signup_request_id?: number | null;
};

/** 초대 메일에 실제 첨부되는 DATA CONTRACT (서버 is_current·active) */
export type InvitationAttachmentContractRevision = {
  id: number;
  version_code: string;
  title: string;
  summary?: string | null;
  effective_from: string;
  status: string;
  is_current: boolean;
};

export async function postSupInvitation(
  payload: SupInvitePayload,
): Promise<InvitationCreatedItem> {
  return apiFetch<InvitationCreatedItem>(`${BASE}/sup/invitations`, {
    method: "POST",
    json: payload,
  });
}

export async function getInvitationAttachmentDataContractRevision(): Promise<InvitationAttachmentContractRevision> {
  return apiFetch<InvitationAttachmentContractRevision>(
    `${BASE}/invitations/attachment-data-contract-revision`,
  );
}

export async function getInvitationHistory(params?: {
  project_id?: number;
  limit?: number;
  offset?: number;
}): Promise<InvitationHistoryItem[]> {
  const q = new URLSearchParams();
  if (params?.project_id != null) q.set("project_id", String(params.project_id));
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch<InvitationHistoryItem[]>(`${BASE}/invitations/history${suffix}`);
}

/** 발송 취소: 초대 status -> revoked, 공개 링크 무효화 */
export async function postRevokeInvitation(
  invitationId: number,
): Promise<{ id: number; status: string }> {
  return apiFetch<{ id: number; status: string }>(`${BASE}/invitations/${invitationId}/revoke`, {
    method: "POST",
  });
}

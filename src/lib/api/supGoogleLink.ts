import { apiFetch } from "./client";

/** 게이트웨이: 로그인된 협력사 JWT로 Google(Gmail 발송) 연동 URL 발급 */
const GOOGLE_LINK_START = "/api/auth/sup/google/link/start";

export const SUP_GOOGLE_LINK_RETURN_STORAGE_KEY = "aifix_sup_google_link_return";

/** 초대 발송(428)으로 연동 플로우를 탄 경우, 복귀 후 초대 모달을 다시 연다 */
export const SUP_GOOGLE_LINK_REOPEN_INVITE_MODAL_KEY = "aifix_sup_google_link_reopen_invite";

/** Gmail 미연동(428) 직전 — 연동 후 자동 재발송할 협력사 초대 페이로드 배열 (JSON) */
export const SUP_PENDING_INVITE_SEND_STORAGE_KEY = "aifix_pending_sup_invite_send";
export const SUP_GOOGLE_LINK_REDIRECT_AT_STORAGE_KEY = "aifix_sup_google_link_redirect_at";

const SUP_GOOGLE_LINK_REDIRECT_DEDUP_MS = 15_000;

export function markReopenSupplierInviteModalAfterGoogleLink(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SUP_GOOGLE_LINK_REOPEN_INVITE_MODAL_KEY, "1");
}

export async function fetchSupGoogleLinkAuthUrl(): Promise<string> {
  const data = await apiFetch<{ authUrl?: string; error?: string }>(GOOGLE_LINK_START, {
    method: "GET",
  });
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(data.error);
  }
  if (!data || typeof data !== "object" || !data.authUrl) {
    throw new Error("Google 연동 주소를 받지 못했습니다.");
  }
  return data.authUrl;
}

/** OAuth 완료 후 돌아올 경로 (현재 화면) */
export function rememberReturnPathForSupGoogleLink(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    SUP_GOOGLE_LINK_RETURN_STORAGE_KEY,
    `${window.location.pathname}${window.location.search}`,
  );
}

export type StartSupGoogleLinkFlowOptions = {
  /** true면 연동 완료 후 저장된 경로로 돌아갈 때 초대 모달 자동 오픈 */
  reopenInviteModal?: boolean;
};

/**
 * Gmail 초대 발송용 Google 연동 시작 (전체 페이지 이동).
 * 성공 시 Google 동의 화면으로 이동하고, 완료 후 게이트웨이 설정의 frontend-after-link 로 복귀합니다.
 */
export async function startSupGoogleLinkFlow(
  opts?: StartSupGoogleLinkFlowOptions,
): Promise<void> {
  if (typeof window !== "undefined") {
    const now = Date.now();
    const lastRaw = sessionStorage.getItem(SUP_GOOGLE_LINK_REDIRECT_AT_STORAGE_KEY);
    const last = Number(lastRaw);
    if (Number.isFinite(last) && now - last < SUP_GOOGLE_LINK_REDIRECT_DEDUP_MS) {
      // 동일 세션에서 짧은 시간 내 중복 호출 방지 (초대 시 2회 연동 진입 이슈 방어)
      return;
    }
    sessionStorage.setItem(SUP_GOOGLE_LINK_REDIRECT_AT_STORAGE_KEY, String(now));
  }

  rememberReturnPathForSupGoogleLink();
  if (opts?.reopenInviteModal) {
    markReopenSupplierInviteModalAfterGoogleLink();
  }
  try {
    const authUrl = await fetchSupGoogleLinkAuthUrl();
    window.location.assign(authUrl);
  } catch (e) {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SUP_GOOGLE_LINK_REDIRECT_AT_STORAGE_KEY);
    }
    throw e;
  }
}

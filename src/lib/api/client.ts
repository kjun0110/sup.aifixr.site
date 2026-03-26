import {
  PATH_API_TEST,
  PATH_AUTH_SUP_LOGOUT,
  PATH_AUTH_SUP_REFRESH,
  PATH_HEALTH,
} from "./paths";
import { setSupAccessToken, getSupAccessToken } from "./sessionAccessToken";

const DEFAULT_ACTOR_STORAGE_KEY = "x-actor-user-id";

export function actorStorageKey(): string {
  return (
    process.env.NEXT_PUBLIC_ACTOR_STORAGE_KEY?.trim() ||
    DEFAULT_ACTOR_STORAGE_KEY
  );
}

/** trailing slash 제거 */
export function getApiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE || "").trim().replace(/\/$/, "");
}

/** base + path (이중 슬래시 방지) */
export function apiUrl(path: string): string {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}

export type ApiClientOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
  /** true면 401 시 리프레시 1회 후 원 요청 재시도 (기본 true) */
  retryOn401?: boolean;
};

/** @deprecated 토큰은 메모리(sessionAccessToken)만 사용 */
export const ACCESS_TOKEN_STORAGE_KEY = "aifixr-access-token";
/** @deprecated 리프레시는 HttpOnly 쿠키 */
export const REFRESH_TOKEN_STORAGE_KEY = "aifixr-refresh-token";

/** 로그인 직후 세션을 다시 읽도록 알림 */
export const AIFIXR_SESSION_UPDATED_EVENT = "aifixr-session-updated";

let refreshInFlight: Promise<boolean> | null = null;

async function postSupRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(apiUrl(PATH_AUTH_SUP_REFRESH), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setSupAccessToken(null);
        return false;
      }
      const data = (await res.json()) as {
        accessToken: string;
        user?: { id?: string };
      };
      if (!data.accessToken) {
        setSupAccessToken(null);
        return false;
      }
      setSupAccessToken(data.accessToken);
      if (typeof window !== "undefined" && data.user?.id) {
        localStorage.setItem(actorStorageKey(), data.user.id);
      }
      return true;
    } catch {
      setSupAccessToken(null);
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/**
 * 공통 fetch: baseURL, X-Actor-User-Id(로컬스토리지), JSON 처리
 * JWT 도입 시 Authorization 헤더를 여기서 같이 처리하면 됨.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { json, headers: initHeaders, retryOn401 = true, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (typeof window !== "undefined") {
    const actor = localStorage.getItem(actorStorageKey());
    if (actor && !headers.has("X-Actor-User-Id")) {
      headers.set("X-Actor-User-Id", actor);
    }
  }

  const token = getSupAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(apiUrl(path), {
    ...rest,
    credentials: rest.credentials ?? "include",
    headers,
    body: json !== undefined ? JSON.stringify(json) : (rest as RequestInit).body,
  });

  if (res.status === 401 && retryOn401) {
    const refreshed = await postSupRefresh();
    if (refreshed) {
      const h2 = new Headers(initHeaders);
      const newToken = getSupAccessToken();
      if (newToken) {
        h2.set("Authorization", `Bearer ${newToken}`);
      }
      const actor2 = localStorage.getItem(actorStorageKey());
      if (actor2 && !h2.has("X-Actor-User-Id")) {
        h2.set("X-Actor-User-Id", actor2);
      }
      if (json !== undefined) {
        h2.set("Content-Type", "application/json");
      }
      res = await fetch(apiUrl(path), {
        ...rest,
        credentials: rest.credentials ?? "include",
        headers: h2,
        body: json !== undefined ? JSON.stringify(json) : (rest as RequestInit).body,
      });
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const ct = res.headers.get("content-type");
  if (ct?.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as T;
}

/** 앱 로드 시 리프레시 쿠키가 있으면 액세스 토큰·actor 복구 */
export async function restoreSupSessionFromCookie(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return postSupRefresh();
}

export async function postSupLogout(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch(apiUrl(PATH_AUTH_SUP_LOGOUT), {
      method: "POST",
      credentials: "include",
    });
  } catch {
    /* 네트워크 실패해도 클라이언트 세션은 정리 */
  }
}

/** KJ 루트 헬스 */
export async function getHealth(): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(PATH_HEALTH);
}

/** KJ /api/test 스모크 */
export async function getApiTest(): Promise<unknown> {
  return apiFetch(PATH_API_TEST);
}


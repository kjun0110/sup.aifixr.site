import { PATH_API_TEST, PATH_HEALTH } from "./paths";

const DEFAULT_ACTOR_STORAGE_KEY = "x-actor-user-id";

function actorStorageKey(): string {
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
  /** 넣으면 JSON 직렬화 + Content-Type: application/json */
  json?: unknown;
};

/**
 * 공통 fetch: baseURL, X-Actor-User-Id(로컬스토리지), JSON 처리
 * JWT 도입 시 Authorization 헤더를 여기서 같이 처리하면 됨.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { json, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (typeof window !== "undefined") {
    const actor = localStorage.getItem(actorStorageKey());
    if (actor && !headers.has("X-Actor-User-Id")) {
      headers.set("X-Actor-User-Id", actor);
    }
    
    // JWT 토큰 추가
    const token = localStorage.getItem("access_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(apiUrl(path), {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : (rest as RequestInit).body,
  });

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

/** KJ 루트 헬스 */
export async function getHealth(): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(PATH_HEALTH);
}

/** KJ /api/test 스모크 */
export async function getApiTest(): Promise<unknown> {
  return apiFetch(PATH_API_TEST);
}


'use client';

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  SUP_GOOGLE_LINK_RETURN_STORAGE_KEY,
  SUP_GOOGLE_LINK_REOPEN_INVITE_MODAL_KEY,
} from "@/lib/api/supGoogleLink";

/**
 * 게이트웨이 `frontend-after-link`에 `?google_linked=1` 이 붙어 돌아왔을 때,
 * 초대 모달을 연 직전 경로로 되돌립니다.
 */
export function SupGoogleLinkReturnHandler() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || handled.current) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("google_linked") !== "1") return;
    handled.current = true;

    const ret = sessionStorage.getItem(SUP_GOOGLE_LINK_RETURN_STORAGE_KEY);
    sessionStorage.removeItem(SUP_GOOGLE_LINK_RETURN_STORAGE_KEY);
    const reopenInvite =
      sessionStorage.getItem(SUP_GOOGLE_LINK_REOPEN_INVITE_MODAL_KEY) === "1";
    sessionStorage.removeItem(SUP_GOOGLE_LINK_REOPEN_INVITE_MODAL_KEY);

    toast.success("Google 계정 연동이 완료되었습니다. 초대 메일을 다시 발송해 주세요.");

    const withInviteQuery = (path: string): string => {
      if (!reopenInvite) return path;
      try {
        const u = new URL(path, window.location.origin);
        u.searchParams.set("openSupplierInvite", "1");
        return `${u.pathname}${u.search}`;
      } catch {
        const join = path.includes("?") ? "&" : "?";
        return `${path}${join}openSupplierInvite=1`;
      }
    };

    if (ret && ret.startsWith("/")) {
      router.replace(withInviteQuery(ret));
      return;
    }
    router.replace(reopenInvite ? "/projects?openSupplierInvite=1" : "/projects");
  }, [router]);

  return null;
}

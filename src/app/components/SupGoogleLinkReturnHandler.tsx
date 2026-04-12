'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  SUP_GOOGLE_LINK_REDIRECT_AT_STORAGE_KEY,
  SUP_GOOGLE_LINK_RETURN_STORAGE_KEY,
  SUP_GOOGLE_LINK_REOPEN_INVITE_MODAL_KEY,
  SUP_PENDING_INVITE_SEND_STORAGE_KEY,
} from "@/lib/api/supGoogleLink";

/**
 * 게이트웨이 `frontend-after-link`에 `?google_linked=1` 이 붙어 돌아왔을 때,
 * 초대 모달을 연 직전 경로로 되돌립니다.
 */
export function SupGoogleLinkReturnHandler() {
  const router = useRouter();
  const handled = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || handled.current) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("google_linked") !== "1") return;
    handled.current = true;
    setIsProcessing(true);

    // 복귀 시 중복 진입 방지 락 해제
    sessionStorage.removeItem(SUP_GOOGLE_LINK_REDIRECT_AT_STORAGE_KEY);

    const ret = sessionStorage.getItem(SUP_GOOGLE_LINK_RETURN_STORAGE_KEY);
    sessionStorage.removeItem(SUP_GOOGLE_LINK_RETURN_STORAGE_KEY);
    const reopenInvite =
      sessionStorage.getItem(SUP_GOOGLE_LINK_REOPEN_INVITE_MODAL_KEY) === "1";
    sessionStorage.removeItem(SUP_GOOGLE_LINK_REOPEN_INVITE_MODAL_KEY);

    const pendingInvite = sessionStorage.getItem(SUP_PENDING_INVITE_SEND_STORAGE_KEY);
    toast.success(
      pendingInvite?.trim()
        ? "Google 계정 연동이 완료되었습니다. 잠시 후 초대 메일을 자동 발송합니다."
        : "Google 계정 연동이 완료되었습니다.",
    );

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

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" style={{ color: '#5B3BFA' }} role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-900">연동중입니다</p>
          <p className="text-sm text-gray-600 mt-2">잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  return null;
}

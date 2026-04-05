'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { restoreSupSessionFromCookie, AIFIXR_SESSION_UPDATED_EVENT } from '@/lib/api/client';
import { getSupAccessToken } from '@/lib/api/sessionAccessToken';

/**
 * 새로고침 후 HttpOnly 리프레시 쿠키로 액세스 토큰·actor 를 복구합니다.
 * 로그인 전·초대 가입(/signup/...)에서는 쿠키가 없어 refresh 가 401이 되므로 호출하지 않습니다.
 *
 * 이미 메모리에 액세스 토큰이 있으면(방금 이메일 로그인 등) refresh 를 호출하지 않습니다.
 * 그렇지 않으면 refresh 실패 시 postSupRefresh 가 토큰을 지워 로그인 직후에도 목록이 비는 현상이 납니다.
 */
export default function SupSessionRestore() {
  const pathname = usePathname();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (
      pathname === '/' ||
      pathname === '' ||
      pathname.startsWith('/signup')
    ) {
      ran.current = false;
      return;
    }
    if (ran.current) return;
    ran.current = true;

    if (typeof window !== 'undefined' && getSupAccessToken()) {
      window.dispatchEvent(new Event(AIFIXR_SESSION_UPDATED_EVENT));
      return;
    }

    void restoreSupSessionFromCookie().then((ok) => {
      if (ok && typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AIFIXR_SESSION_UPDATED_EVENT));
      } else if (!ok) {
        // 이 effect는 이미 `/`, `/signup` 에서는 위에서 return 했으므로, 여기 도달한 경로는 모두 보호 구역
        router.replace('/');
      }
    });
  }, [pathname, router]);

  return null;
}

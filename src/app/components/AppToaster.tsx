'use client';

import { Toaster } from "sonner";

/** 원청 포털과 유사: 우측 하단 작은 알림 */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      expand={false}
      offset={20}
      gap={10}
      toastOptions={{
        classNames: {
          toast: "text-sm shadow-lg",
          title: "text-sm font-semibold",
          description: "text-xs opacity-90",
        },
        duration: 4000,
      }}
    />
  );
}

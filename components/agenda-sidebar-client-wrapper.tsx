"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AgendaSidebarClientWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isChatPage = pathname.startsWith("/chat/");

  if (!isChatPage) {
    return null;
  }

  return <>{children}</>;
}

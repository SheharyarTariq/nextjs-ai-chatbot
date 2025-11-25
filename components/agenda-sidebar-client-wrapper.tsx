"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AgendaSidebarClientWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isProfilePage = pathname === "/profile";

  if (isProfilePage) {
    return null;
  }

  return <>{children}</>;
}

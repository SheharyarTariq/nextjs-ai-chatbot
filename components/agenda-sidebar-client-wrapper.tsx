"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AgendaSidebarClientWrapperProps {
  children: ReactNode;
  isVisible?: boolean;
}

export function AgendaSidebarClientWrapper({ 
  children, 
  isVisible = true 
}: AgendaSidebarClientWrapperProps) {
  const pathname = usePathname();
  const isValidPage = pathname === "/" || pathname.startsWith("/chat/");

  if (!isValidPage) {
    return null;
  }

  return (
    <div 
      className={cn(
        "transition-all duration-300",
        "max-md:fixed max-md:top-16 max-md:left-0 max-md:right-0 max-md:bottom-16 max-md:z-40 max-md:bg-background max-md:overflow-y-auto",
        !isVisible && "max-md:hidden",
        "md:block md:relative"
      )}
    >
      {children}
    </div>
  );
}

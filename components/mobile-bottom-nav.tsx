"use client";

import { CalendarDays, MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  activeTab: "chat" | "agenda";
  onTabChange: (tab: "chat" | "agenda") => void;
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const pathname = usePathname();
  const isValidPage = pathname === "/" || pathname.startsWith("/chat/");

  if (!isValidPage) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="grid grid-cols-2 h-16">
        <button
          onClick={() => onTabChange("agenda")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-colors",
            activeTab === "agenda"
              ? "text-primary-green bg-primary-green/10"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarDays className="h-5 w-5" />
          <span className="text-xs font-medium">Agenda</span>
        </button>
        
        <button
          onClick={() => onTabChange("chat")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-colors",
            activeTab === "chat"
              ? "text-primary-green bg-primary-green/10"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs font-medium">Chat</span>
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AgendaSidebarClientWrapper } from "@/components/agenda-sidebar-client-wrapper";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SidebarInset } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChatHeader } from "@/components/chat-header";

interface ChatLayoutClientProps {
  agendaSidebar: ReactNode;
  children: ReactNode;
  user: any;
}

export function ChatLayoutClient({ agendaSidebar, children, user }: ChatLayoutClientProps) {
  const [mobileActiveTab, setMobileActiveTab] = useState<"chat" | "agenda">("chat");
  const pathname = usePathname();
  const isChatPage = pathname === "/" || pathname.startsWith("/chat/");

  return (
    <div className="flex flex-col w-full h-screen">
      {user?.gender && (
        <div className="sticky top-0 z-50">
          <ChatHeader user={user} />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <AgendaSidebarClientWrapper isVisible={mobileActiveTab === "agenda"}>
          {agendaSidebar}
        </AgendaSidebarClientWrapper>

        <SidebarInset 
          className={cn(
            "flex-1 overflow-y-auto",
            isChatPage && mobileActiveTab === "agenda" && "max-md:hidden"
          )}
        >
          {children}
        </SidebarInset>
      </div>

      <MobileBottomNav 
        activeTab={mobileActiveTab} 
        onTabChange={setMobileActiveTab} 
      />
    </div>
  );
}

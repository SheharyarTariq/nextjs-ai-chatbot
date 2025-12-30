"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AgendaSidebarClientWrapper } from "@/components/agenda-sidebar-client-wrapper";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SidebarInset } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChatHeader } from "@/components/chat-header";
import { TodayAgendaFloatingWrapper } from "@/components/today-agenda-floating-wrapper";

interface ChatLayoutClientProps {
  agendaSidebar: ReactNode;
  children: ReactNode;
  user: any;
  agenda?: any;
}

export function ChatLayoutClient({ agendaSidebar, children, user, agenda }: ChatLayoutClientProps) {
  const [mobileActiveTab, setMobileActiveTab] = useState<"chat" | "agenda">("chat");
  const [isAgendaMinimized, setIsAgendaMinimized] = useState(false);
  const pathname = usePathname();
  const isChatPage = pathname === "/" || pathname.startsWith("/chat/");
  const isAdminPage = pathname.startsWith("/admin");

  const handleTabChange = (tab: "chat" | "agenda") => {
    setMobileActiveTab(tab);
    if (tab === "agenda" && isAgendaMinimized) {
      setIsAgendaMinimized(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen max-md:h-dvh overflow-hidden">
      {/* {user && !(pathname === "/profile" && !user?.gender) && ( */}
        <div className="sticky top-0 z-50 w-full bg-[#F5F5F5]">
          <ChatHeader user={user} />
        </div>
      {/* )} */}

      <div className="flex flex-1 overflow-hidden">
        <AgendaSidebarClientWrapper isVisible={mobileActiveTab === "agenda"}>
          {agendaSidebar}
        </AgendaSidebarClientWrapper>

        <SidebarInset
          className={cn(
            "flex-1",
            isAdminPage ? "overflow-y-auto" : "overflow-hidden",
            isChatPage && mobileActiveTab === "agenda" && "max-md:hidden"
          )}
        >
          {children}
        </SidebarInset>
      </div>

      {isChatPage && (
        <TodayAgendaFloatingWrapper
          initialAgenda={agenda}
          isVisible={mobileActiveTab === "chat"}
          isMinimized={isAgendaMinimized}
          onMinimize={setIsAgendaMinimized}
        />
      )}

      <MobileBottomNav
        activeTab={mobileActiveTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}

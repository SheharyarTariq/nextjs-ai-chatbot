"use client";

import { useState, type ReactNode } from "react";
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

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Header - always visible at the top */}
      {user?.gender && (
        <div className="sticky top-0 z-50">
          <ChatHeader user={user} />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Agenda Sidebar - hidden on mobile unless agenda tab is active */}
        <AgendaSidebarClientWrapper isVisible={mobileActiveTab === "agenda"}>
          {agendaSidebar}
        </AgendaSidebarClientWrapper>

        {/* Chat Area - hidden on mobile when agenda tab is active */}
        <SidebarInset 
          className={cn(
            "flex-1 overflow-y-auto",
            // Hide on mobile when agenda is active
            mobileActiveTab === "agenda" && "max-md:hidden"
          )}
        >
          {children}
        </SidebarInset>
      </div>

      {/* Mobile Bottom Navigation - always visible on mobile */}
      <MobileBottomNav 
        activeTab={mobileActiveTab} 
        onTabChange={setMobileActiveTab} 
      />
    </div>
  );
}

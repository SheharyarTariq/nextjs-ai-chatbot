"use client";

import { memo } from "react";
import { SidebarUserNav } from "./sidebar-user-nav";
import { Session } from "next-auth";

function PureChatHeader({
  user,
}: {
  user: Session["user"];
}) {
  return (
    <header className="sticky top-0 w-full bg-[#F5F5F5]! flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      <h1 className="text-primary-green font-bold text-[22px]">For Daily Use.</h1>
      <div className="ml-auto">
        <SidebarUserNav user={user} />
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);

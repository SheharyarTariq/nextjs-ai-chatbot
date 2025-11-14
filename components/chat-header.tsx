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
    <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      <SidebarUserNav user={user} />
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);

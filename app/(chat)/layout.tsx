import { cookies } from "next/headers";
import Script from "next/script";
import { AgendaSidebar } from "@/components/agenda-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "../(auth)/auth";
import { getAgendaByUserId, getUserById } from "@/lib/db/queries";
import { ChatLayoutClient } from "../../components/chat-layout-client";

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";
  const user = await getUserById(session!.user.id);
  const userWithSessionFields = {
    ...user!,
    type: session!.user.type,
    role: session!.user.role as "admin" | "user",
  };

  const agenda = await getAgendaByUserId({ userId: session!.user.id });

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>

        <SidebarProvider defaultOpen={!isCollapsed}>
          <ChatLayoutClient
            user={userWithSessionFields}
            agendaSidebar={<AgendaSidebar />}
            agenda={agenda}
          >
            {children}
          </ChatLayoutClient>

        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}


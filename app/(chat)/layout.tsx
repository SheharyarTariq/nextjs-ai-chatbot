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

  const userId = session?.user?.id;
  const user = userId ? await getUserById(userId) : null;

  const userWithSessionFields = user ? {
    ...user,
    type: session?.user?.type,
    role: session?.user?.role as "admin" | "user",
  } : null;

  const agenda = userId ? await getAgendaByUserId({ userId }) : null;

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


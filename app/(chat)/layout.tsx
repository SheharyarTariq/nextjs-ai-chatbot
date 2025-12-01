import { cookies } from "next/headers";
import Script from "next/script";
import { AgendaSidebar } from "@/components/agenda-sidebar";
import { AgendaSidebarClientWrapper } from "@/components/agenda-sidebar-client-wrapper";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "../(auth)/auth";
import { getUserById } from "@/lib/db/queries";
import { ChatHeader } from "@/components/chat-header";

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
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>

        <SidebarProvider defaultOpen={!isCollapsed}>
          {/* <AppSidebar user={session?.user} /> */}
          <div className="flex flex-col w-full h-screen">

            {user?.gender && (
              <div className="sticky top-0 z-50">
                <ChatHeader user={userWithSessionFields} />
              </div>
            )}

            <div className="flex flex-1 overflow-hidden">
              <AgendaSidebarClientWrapper>
                <AgendaSidebar />
              </AgendaSidebarClientWrapper>

              <SidebarInset className="flex-1 overflow-y-auto">
                {children}
              </SidebarInset>
            </div>

          </div>

        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}

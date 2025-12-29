import { auth } from "@/app/(auth)/auth";
import { getAgendaByUserId } from "@/lib/db/queries";
import { AgendaSidebarClient } from "@/components/agenda-sidebar-client";
import { EmptyAgendaState } from "@/components/empty-agenda-state";

export async function AgendaSidebar() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const agenda = await getAgendaByUserId({ userId: session.user.id });

  return <AgendaSidebarClient initialAgenda={agenda} userRole={session.user.role} />;
}

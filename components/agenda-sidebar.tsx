import { auth } from "@/app/(auth)/auth";
import { getAgendaByUserId } from "@/lib/db/queries";
import { AgendaSidebarClient } from "@/components/agenda-sidebar-client";

export async function AgendaSidebar() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const agenda = await getAgendaByUserId({ userId: session.user.id });

  if (!agenda || !agenda.weeklyData || agenda.weeklyData.length === 0) {
    return null;
  }

  return <AgendaSidebarClient agenda={agenda} />;
}

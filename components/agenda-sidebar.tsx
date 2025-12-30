import { auth } from "@/app/(auth)/auth";
import { getAgendaByUserId, getUserById } from "@/lib/db/queries";
import { AgendaSidebarClient } from "@/components/agenda-sidebar-client";

export async function AgendaSidebar() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [agenda, user] = await Promise.all([
    getAgendaByUserId({ userId: session.user.id }),
    getUserById(session.user.id),
  ]);

  return <AgendaSidebarClient initialAgenda={agenda} user={user} />;
}

import { auth } from "@/app/(auth)/auth";
import { getAgendaByUserId } from "@/lib/db/queries";
import { AgendaCard } from "@/components/agenda-card";
import { ScrollArea } from "@/components/ui/scroll-area";

export async function AgendaSidebar() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const agenda = await getAgendaByUserId({ userId: session.user.id });

  if (!agenda || !agenda.weeklyData || agenda.weeklyData.length === 0) {
    return null;
  }

  // Get the current week's sessions
  const currentWeekData = agenda.weeklyData.find(
    (week: any) => week.weekNumber === agenda.currentWeek
  );

  if (!currentWeekData || !currentWeekData.sessions) {
    return null;
  }

  return (
    <div className="w-80 border-r bg-background h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Week {agenda.currentWeek} Schedule</h2>
        <p className="text-sm text-muted-foreground mt-1">{agenda.goal}</p>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {currentWeekData.sessions.map((session: any, index: number) => (
            <AgendaCard
              key={`${session.day}-${index}`}
              day={session.day}
              completed={session.completed || false}
              exerciseDetails={session.exerciseDetails || "No exercise details"}
              mealDetails={session.mealDetails || "No meal details"}
              sleepDetails={session.sleepDetails || "No sleep details"}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

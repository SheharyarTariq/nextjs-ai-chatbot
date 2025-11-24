"use client";

import { useState } from "react";
import { AgendaCard } from "@/components/agenda-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResetAgendaButton } from "@/components/reset-agenda-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgendaSidebarClientProps {
  agenda: any;
}

export function AgendaSidebarClient({ agenda }: AgendaSidebarClientProps) {
  const [activeTab, setActiveTab] = useState("today");

  // Get current date info
  const today = new Date();
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const todayName = daysOfWeek[today.getDay()];

  // Get current week data
  const currentWeekData = agenda.weeklyData.find(
    (week: any) => week.weekNumber === agenda.currentWeek
  );

  // Find today's session
  const todaySession = currentWeekData?.sessions?.find(
    (session: any) => session.day === todayName
  );

  if (!currentWeekData || !currentWeekData.sessions) {
    return null;
  }

  return (
    <div className="w-80 border-r bg-background h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-xl font-bold">Week {agenda.currentWeek} Schedule</h2>
            <p className="text-sm text-muted-foreground mt-1">{agenda.userData?.goal || agenda.goal}</p>
          </div>
          <ResetAgendaButton />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">Today's Agenda</TabsTrigger>
            <TabsTrigger value="week">My Agenda</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={activeTab} className="flex-1 overflow-hidden">
        {/* Today's Agenda Tab */}
        <TabsContent value="today" className="h-full mt-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {todaySession ? (
                <div>
                  <div className="mb-3 text-sm text-muted-foreground">
                    {today.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <AgendaCard
                    key={todaySession.day}
                    day={todaySession.day}
                    completed={todaySession.completed || false}
                    exerciseDetails={todaySession.exerciseDetails || "No exercise details"}
                    mealDetails={todaySession.mealDetails}
                    sleepDetails={todaySession.sleepDetails}
                    weekNumber={agenda.currentWeek}
                    isToday={true}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No session scheduled for today.</p>
                  <p className="text-sm mt-2">Enjoy your rest day!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* My Agenda (Full Week) Tab */}
        <TabsContent value="week" className="h-full mt-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {currentWeekData.sessions.map((session: any, index: number) => (
                <AgendaCard
                  key={`${session.day}-${index}`}
                  day={session.day}
                  completed={session.completed || false}
                  exerciseDetails={session.exerciseDetails || "No exercise details"}
                  mealDetails={session.mealDetails}
                  sleepDetails={session.sleepDetails}
                  weekNumber={agenda.currentWeek}
                  isToday={session.day === todayName}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState("week");

  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const todayName = daysOfWeek[today.getDay()];

  const currentWeekData = agenda.weeklyData.find(
    (week: any) => week.weekNumber === agenda.currentWeek
  );

  // Sort sessions by date to ensure proper chronological order
  const sortedSessions = currentWeekData?.sessions
    ? [...currentWeekData.sessions].sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      })
    : [];

  const todaySession = sortedSessions.find(
    (session: any) => session.date === todayDateString
  );

  if (!currentWeekData || !currentWeekData.sessions) {
    return null;
  }


  return (
    <div className="p-5 h-full">
      <div className="w-full md:w-88 border rounded-lg bg-background h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-xl font-bold">Week {agenda.currentWeek} Schedule</h2>
              <p className="text-sm text-muted-foreground mt-1">{agenda.userData?.goal || agenda.goal}</p>
            </div>
            <ResetAgendaButton />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full ">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="week" className="data-[state=active]:bg-primary-green data-[state=active]:text-white hover:cursor-pointer">My Agenda</TabsTrigger>
              <TabsTrigger value="today" className="data-[state=active]:bg-primary-green data-[state=active]:text-white hover:cursor-pointer">Today's Agenda</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={activeTab} className="flex-1 overflow-hidden">
          <TabsContent value="today" className="h-full mt-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {todaySession ? (
                  <div>
                    <AgendaCard
                      key={todaySession.day}
                      day={todaySession.day}
                      date={todaySession.date}
                      completed={todaySession.completed || false}
                      exerciseDetails={todaySession.exerciseDetails || "No exercise details"}
                      mealDetails={todaySession.mealDetails}
                      sleepDetails={todaySession.sleepDetails}
                      weekNumber={agenda.currentWeek}
                      isToday={true}
                      rating={todaySession.rating}
                      energy={todaySession.energy}
                      meals={todaySession.meals}
                      sleep={todaySession.sleep}
                      notes={todaySession.notes}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No session pending/scheduled for today.</p>
                    <p className="text-sm mt-2">Enjoy your rest day!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="week" className="h-full mt-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {sortedSessions.map((session: any, index: number) => (
                  <AgendaCard
                    key={`${session.day}-${index}`}
                    day={session.day}
                    date={session.date}
                    completed={session.completed || false}
                    exerciseDetails={session.exerciseDetails || "No exercise details"}
                    mealDetails={session.mealDetails}
                    sleepDetails={session.sleepDetails}
                    weekNumber={agenda.currentWeek}
                    isToday={session.date === todayDateString}
                    rating={session.rating}
                    energy={session.energy}
                    meals={session.meals}
                    sleep={session.sleep}
                    notes={session.notes}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

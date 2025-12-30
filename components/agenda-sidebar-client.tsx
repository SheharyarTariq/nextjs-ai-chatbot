"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AgendaCard } from "@/components/agenda-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResetAgendaButton } from "@/components/reset-agenda-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/event-card";
import { CreateEventModal } from "@/components/create-event-modal";

interface AgendaSidebarClientProps {
  initialAgenda?: any;
  userRole?: string;
}

export function AgendaSidebarClient({ initialAgenda, userRole }: AgendaSidebarClientProps) {
  const [agenda, setAgenda] = useState(initialAgenda);
  const [activeTab, setActiveTab] = useState("week");
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const todaySessionRef = useRef<HTMLDivElement>(null);

  const fetchAgenda = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/agenda");
      if (!response.ok) {
        if (response.status === 404) {
          setAgenda(null);
          return;
        }
        throw new Error("Failed to fetch agenda");
      }
      const data = await response.json();
      if (data.success && data.agenda) {
        setAgenda(data.agenda);
      } else {
        setAgenda(null);
      }
    } catch (error) {
      console.error("Error fetching agenda:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Listen for agenda refresh events from the window
    const handleAgendaRefresh = () => {
      fetchAgenda();
    };

    window.addEventListener("agenda-refresh", handleAgendaRefresh);
    return () => {
      window.removeEventListener("agenda-refresh", handleAgendaRefresh);
    };
  }, [fetchAgenda]);

  const handleAgendaUpdate = useCallback(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  const fetchEvents = useCallback(async () => {
    setIsEventsLoading(true);
    try {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      if (data.success && data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventCreated = () => {
    fetchEvents();
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setIsCreateEventModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsCreateEventModalOpen(open);
    if (!open) {
      setEditingEvent(null);
    }
  };

  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const todayName = daysOfWeek[today.getDay()];

  useEffect(() => {
    if (activeTab === "week" && todaySessionRef.current) {
      const timeoutId = setTimeout(() => {
        todaySessionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab]);

  // Show loading state only on initial load when there's no agenda data at all
  if (!agenda && isLoading) {
    return (
      <div className="p-5 h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const allWeeksData = agenda?.weeklyData
    ?.filter((week: any) => week.weekNumber <= agenda.currentWeek)
    ?.sort((a: any, b: any) => a.weekNumber - b.weekNumber) || [];

  const currentWeekData = agenda?.weeklyData?.find(
    (week: any) => week.weekNumber === agenda?.currentWeek
  );

  const currentWeekSortedSessions = currentWeekData?.sessions
    ? [...currentWeekData.sessions].sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    })
    : [];

  const todaySession = currentWeekSortedSessions.find(
    (session: any) => session.date === todayDateString
  );


  return (
    <div className="p-5 h-full">
      <div className={`w-full md:w-88 border rounded-lg bg-background h-full flex flex-col ${isLoading ? "opacity-60 pointer-events-none" : ""}`}>
        <div className="p-4 border-b">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-md font-semibold text-foreground">{agenda?.userData?.goal || agenda?.goal || "My Agenda"}</h2>
            </div>
            <ResetAgendaButton />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="week" className="data-[state=active]:bg-primary-green data-[state=active]:text-white hover:cursor-pointer">My Agenda</TabsTrigger>
              <TabsTrigger value="today" className="data-[state=active]:bg-primary-green data-[state=active]:text-white hover:cursor-pointer">Event</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={activeTab} className="flex-1 overflow-hidden">
          <TabsContent value="today" className="h-full mt-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {userRole === "admin" && (
                  <Button
                    className="w-full bg-primary-green hover:bg-primary-green/90 text-white"
                    onClick={() => {
                      setEditingEvent(null);
                      setIsCreateEventModalOpen(true);
                    }}
                  >
                    + Create Event
                  </Button>
                )}

                <div className="space-y-3">
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No events yet</p>
                    </div>
                  ) : (
                    events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        userRole={userRole}
                        onDelete={fetchEvents}
                        onEdit={handleEditEvent}
                      />
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="week" className="h-full mt-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-6">
                {allWeeksData.length === 0 || allWeeksData.every((week: any) => !week.sessions || week.sessions.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No agenda created yet</p>
                  </div>
                ) : (
                  allWeeksData.map((weekData: any) => {
                    const sortedSessions = weekData.sessions
                      ? [...weekData.sessions].sort((a: any, b: any) => {
                        const dateA = new Date(a.date).getTime();
                        const dateB = new Date(b.date).getTime();
                        return dateA - dateB;
                      })
                      : [];

                    const isCurrentWeek = weekData.weekNumber === agenda.currentWeek;

                    return (
                      <div key={weekData.weekNumber} className="space-y-3">
                        <div className="space-y-3">
                          {sortedSessions.map((session: any, index: number) => {
                            const isToday = session.date === todayDateString;
                            return (
                              <div
                                key={`week-${weekData.weekNumber}-${session.day}-${index}`}
                                ref={isToday ? todaySessionRef : null}
                              >
                                <AgendaCard
                                  day={session.day}
                                  date={session.date}
                                  completed={session.completed || false}
                                  exerciseDetails={session.exerciseDetails || "No exercise details"}
                                  mealDetails={session.mealDetails}
                                  sleepDetails={session.sleepDetails}
                                  weekNumber={weekData.weekNumber}
                                  isToday={isToday}
                                  rating={session.rating}
                                  energy={session.energy}
                                  meals={session.meals}
                                  sleep={session.sleep}
                                  notes={session.notes}
                                  onUpdate={handleAgendaUpdate}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {userRole === "admin" && (
        <CreateEventModal
          open={isCreateEventModalOpen}
          onOpenChange={handleModalOpenChange}
          onEventCreated={handleEventCreated}
          initialData={editingEvent}
        />
      )}
    </div>
  );
}


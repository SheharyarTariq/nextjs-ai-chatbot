"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { AgendaCard } from "@/components/agenda-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResetAgendaButton } from "@/components/reset-agenda-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/event-card";
import { CreateEventModal } from "@/components/create-event-modal";
import { SearchIcon, ChevronDownIcon, CheckIcon, FilterIcon, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Country, City } from "country-state-city";

interface AgendaSidebarClientProps {
  initialAgenda?: any;
  user: any;
}
import { EVENT_TYPE_NAMES as EVENT_TYPES } from "@/components/page/constants";

export function AgendaSidebarClient({ initialAgenda, user }: AgendaSidebarClientProps) {
  const userRole = user?.role;
  const [agenda, setAgenda] = useState(initialAgenda);
  const [activeTab, setActiveTab] = useState("week");
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<any[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // Filter states
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const cities = useMemo(() => {
    if (!user?.country) return [];
    const country = Country.getAllCountries().find(c => c.name === user.country);
    if (!country) return [];
    return City.getCitiesOfCountry(country.isoCode)?.map(c => c.name) || [];
  }, [user?.country]);

  const uniqueCities = useMemo(() => Array.from(new Set(cities)), [cities]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const cityMatch = selectedCities.length === 0 || selectedCities.includes(event.city);
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(event.type);
      return cityMatch && typeMatch;
    });
  }, [events, selectedCities, selectedTypes]);
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

  const fetchJoinedEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/events/my-events");
      if (!response.ok) {
        throw new Error("Failed to fetch joined events");
      }
      const data = await response.json();
      if (data.success && data.events) {
        setJoinedEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching joined events:", error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchJoinedEvents();
  }, [fetchEvents, fetchJoinedEvents]);

  const handleEventCreated = () => {
    fetchEvents();
    fetchJoinedEvents();
  };

  const handleJoinChange = () => {
    fetchEvents();
    fetchJoinedEvents();
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
              <h2 className="text-md font-semibold text-foreground">{agenda?.userData?.goal || agenda?.goal || "Agenda & Events"}</h2>
            </div>
            <ResetAgendaButton />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="week" className="data-[state=active]:bg-primary-green data-[state=active]:text-white hover:cursor-pointer">My Agenda</TabsTrigger>
              <TabsTrigger value="today" className="data-[state=active]:bg-primary-green data-[state=active]:text-white hover:cursor-pointer">All Events</TabsTrigger>
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

                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-between h-9 text-xs">
                        <span className="truncate">
                          {selectedCities.length === 0 ? "City" : `${selectedCities.length} Cities`}
                        </span>
                        <ChevronDownIcon className="h-3 w-3 opacity-50 ml-1 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search city..." className="h-9" />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty>No city found.</CommandEmpty>
                          <CommandGroup>
                            {uniqueCities.length === 0 ? (
                              <div className="p-2 text-xs text-muted-foreground text-center">
                                {user?.country ? "No cities found" : "Select country in profile"}
                              </div>
                            ) : (
                              uniqueCities.map(city => (
                                <CommandItem
                                  key={city}
                                  value={city}
                                  onSelect={() => {
                                    setSelectedCities(prev =>
                                      prev.includes(city)
                                        ? prev.filter(c => c !== city)
                                        : [...prev, city]
                                    );
                                  }}
                                >
                                  <div className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    selectedCities.includes(city)
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible"
                                  )}>
                                    <CheckIcon className="h-3 w-3" />
                                  </div>
                                  {city}
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-between h-9 text-xs">
                        <span className="truncate">
                          {selectedTypes.length === 0 ? "Type" : `${selectedTypes.length} Types`}
                        </span>
                        <ChevronDownIcon className="h-3 w-3 opacity-50 ml-1 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {EVENT_TYPES.map(type => (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            setSelectedTypes(prev =>
                              checked ? [...prev, type] : prev.filter(t => t !== type)
                            );
                          }}
                        >
                          {type}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Selected Filters */}
                {(selectedCities.length > 0 || selectedTypes.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedCities.map((city) => (
                      <Badge
                        key={city}
                        variant="secondary"
                        className="bg-primary-green/10 text-primary-green hover:bg-primary-green/20 border-none px-2 py-1 text-[10px] flex items-center gap-1.5"
                      >
                        {city}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-primary-green/70 transition-colors"
                          onClick={() => setSelectedCities(prev => prev.filter(c => c !== city))}
                        />
                      </Badge>
                    ))}
                    {selectedTypes.map((type) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className="bg-primary-mustard/10 text-primary-mustard-foreground hover:bg-primary-mustard/20 border-none px-2 py-1 text-[10px] flex items-center gap-1.5"
                      >
                        {type}
                        <X
                          className="h-3 w-3 cursor-pointer hover:opacity-70 transition-opacity"
                          onClick={() => setSelectedTypes(prev => prev.filter(t => t !== type))}
                        />
                      </Badge>
                    ))}
                    <Button
                      variant="ghost"
                      className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary-green hover:bg-transparent"
                      onClick={() => {
                        setSelectedCities([]);
                        setSelectedTypes([]);
                      }}
                    >
                      Clear all
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No events found matching filters</p>
                      {(selectedCities.length > 0 || selectedTypes.length > 0) && (
                        <Button
                          variant="link"
                          className="text-xs mt-2 h-auto p-0 text-primary-green"
                          onClick={() => {
                            setSelectedCities([]);
                            setSelectedTypes([]);
                          }}
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        userRole={userRole}
                        onDelete={fetchEvents}
                        onEdit={handleEditEvent}
                        onJoinChange={handleJoinChange}
                      />
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="week" className="h-full mt-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-3">
                {(() => {
                  // Combine agenda sessions and joined events
                  const items: Array<{
                    type: 'session' | 'event';
                    date: string;
                    data: any;
                  }> = [];

                  if (allWeeksData && allWeeksData.length > 0) {  // Add agenda sessions to items
                    allWeeksData.forEach((weekData: any) => {
                      if (weekData.sessions && weekData.sessions.length > 0) {
                        weekData.sessions.forEach((session: any) => {
                          items.push({
                            type: 'session',
                            date: session.date,
                            data: { ...session, weekNumber: weekData.weekNumber }
                          });
                        });
                      }
                    });
                  }

                  if (joinedEvents && joinedEvents.length > 0) {  // Add joined events to items 
                    joinedEvents.forEach((event: any) => {
                      items.push({
                        type: 'event',
                        date: event.date,
                        data: event
                      });
                    });
                  }

                  items.sort((a, b) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    return dateA - dateB;
                  });

                  if (items.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No agenda or events yet</p>
                      </div>
                    );
                  }

                  return items.map((item, index) => {
                    if (item.type === 'session') {
                      const session = item.data;
                      const isToday = session.date === todayDateString;
                      return (
                        <div
                          key={`session-${session.weekNumber}-${session.day}-${index}`}
                          ref={isToday ? todaySessionRef : null}
                        >
                          <AgendaCard
                            day={session.day}
                            date={session.date}
                            completed={session.completed || false}
                            exerciseDetails={session.exerciseDetails || "No exercise details"}
                            mealDetails={session.mealDetails}
                            sleepDetails={session.sleepDetails}
                            weekNumber={session.weekNumber}
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
                    } else {
                      const event = item.data;
                      return (
                        <EventCard
                          key={`event-${event.id}-${index}`}
                          event={{ ...event, hasJoined: true }}
                          userRole={userRole}
                          showAdminActions={false}
                          onJoinChange={handleJoinChange}
                        />
                      );
                    }
                  });
                })()}
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


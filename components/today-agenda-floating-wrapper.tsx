"use client";

import { useState, useEffect, useCallback } from "react";
import { AgendaCard } from "@/components/agenda-card";
import { X, CalendarDays } from "lucide-react";

interface TodayAgendaFloatingWrapperProps {
    initialAgenda?: any;
    isVisible?: boolean;
    isMinimized?: boolean;
    onMinimize?: (minimized: boolean) => void;
}

export function TodayAgendaFloatingWrapper({
    initialAgenda,
    isVisible = true,
    isMinimized = false,
    onMinimize,
}: TodayAgendaFloatingWrapperProps) {
    const [agenda, setAgenda] = useState(initialAgenda);

    const fetchAgenda = useCallback(async () => {
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
        }
    }, []);

    useEffect(() => {
        // Listen for agenda refresh events
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

    if (!agenda || !isVisible) {
        return null;
    }

    const today = new Date();
    const todayDateString = today.toISOString().split("T")[0];

    const currentWeekData = agenda.weeklyData?.find(
        (week: any) => week.weekNumber === agenda.currentWeek
    );

    if (!currentWeekData || !currentWeekData.sessions) {
        return null;
    }

    const todaySession = currentWeekData.sessions.find(
        (session: any) => session.date === todayDateString
    );

    if (!todaySession) {
        return null;
    }

    if (isMinimized) {
        return (
            <div className="fixed top-15 right-3 z-40 md:hidden">
                <button
                    onClick={() => onMinimize?.(false)}
                    className="bg-primary-green/80 backdrop-blur-md border-white/20 rounded-full p-3 shadow-lg hover:bg-primary-green/90 transition-colors"
                    aria-label="Expand today's agenda"
                >
                    <CalendarDays className="h-5 w-5 text-white" />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed top-15 left-3 right-3 z-40 md:hidden">
            <button
                onClick={() => onMinimize?.(true)}
                className="absolute -top-2 -right-1 z-50 bg-background border rounded-full p-1 shadow-md hover:bg-muted transition-colors"
                aria-label="Minimize today's agenda"
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="cursor-pointer">
                <AgendaCard
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
                    variant="floating"
                    onUpdate={handleAgendaUpdate}
                />
            </div>
        </div>
    );
}

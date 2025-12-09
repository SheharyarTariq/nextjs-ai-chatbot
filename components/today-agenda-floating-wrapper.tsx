"use client";

import { useState } from "react";
import { AgendaCard } from "@/components/agenda-card";
import { X } from "lucide-react";

interface TodayAgendaFloatingWrapperProps {
    agenda: any;
    isVisible?: boolean;
}

export function TodayAgendaFloatingWrapper({
    agenda,
    isVisible = true,
}: TodayAgendaFloatingWrapperProps) {
    const [isDismissed, setIsDismissed] = useState(false);

    if (!agenda || !isVisible || isDismissed) {
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

    return (
        <div className="fixed top-15 left-3 right-3 z-40 md:hidden">
            <button
                onClick={() => setIsDismissed(true)}
                className="absolute -top-2 -right-1 z-50 bg-background border rounded-full p-1 shadow-md hover:bg-muted transition-colors"
                aria-label="Dismiss today's agenda"
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
                />
            </div>
        </div>
    );
}

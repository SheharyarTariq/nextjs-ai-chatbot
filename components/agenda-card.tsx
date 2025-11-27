"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AgendaCardProps {
  day: string;
  date?: string;
  completed: boolean;
  exerciseDetails: string;
  mealDetails?: string;
  sleepDetails?: string;
  weekNumber: number;
  isToday?: boolean;
}

export function AgendaCard({
  day,
  date,
  completed,
  exerciseDetails,
  mealDetails,
  sleepDetails,
  weekNumber,
  isToday = false,
}: AgendaCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleIconClick = () => {
    if (!completed) {
      setIsDialogOpen(true);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/agenda/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weekNumber,
          day,
          date,
          completed: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update agenda");
      }

      toast.success(`${day} marked as completed!`);
      setIsDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error updating agenda:", error);
      toast.error(error.message || "Failed to update agenda");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card
        className={`w-full rounded-2xl border hover:shadow-md transition-shadow ${
          isToday ? "bg-primary-green text-white" : "bg-secondary-green"
        }`}
      >
        <CardContent className="p-4">
          <div  className="flex h-full items-center gap-4">
            <div style={{ height: "-webkit-fill-available" }} className="flex flex-col items-center justify-between">
              <p className={`text-2xl font-normal ${isToday ? "text-white" : "text-foreground"}`}>
                {day?.slice(0, 3).toUpperCase()}
              </p>

              {date && (
                <>
                  <p className={`text-2xl font-bold ${isToday ? "text-white" : "text-foreground"}`}>
                    {new Date(date).getDate()}
                  </p>
                  <p className={`text-2xl font-normal ${isToday ? "text-white" : "text-foreground"}`}>
                    {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                  </p>
                </>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-semibold leading-snug ${
                  isToday ? "text-white" : "text-foreground"
                }`}>
                  {exerciseDetails}
                </h3>

                <Badge
                  variant={completed && isToday ? "secondary" : completed ? "default" : "secondary"}
                  className={`whitespace-nowrap ${
                    !completed && !isLoading ? "cursor-pointer hover:opacity-80" : ""
                  } ${completed || isLoading ? "cursor-not-allowed" : ""}`}
                  onClick={handleIconClick}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Updating...
                    </>
                  ) : completed ? (
                    "Completed"
                  ) : (
                    "Pending"
                  )}
                </Badge>
              </div>
              {mealDetails && (
                <p className={`mt-1 text-sm ${
                  isToday ? "text-white/90" : "text-muted-foreground"
                }`}>
                  {mealDetails}
                </p>
              )}
              {sleepDetails && (
                <p className={`text-sm ${
                  isToday ? "text-white/90" : "text-muted-foreground"
                }`}>
                  {sleepDetails}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Completed</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {day} as completed? This will update
              your training progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

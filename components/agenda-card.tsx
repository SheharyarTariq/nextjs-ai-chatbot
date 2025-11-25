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
  completed: boolean;
  exerciseDetails: string;
  mealDetails?: string;
  sleepDetails?: string;
  weekNumber: number;
  isToday?: boolean;
}

export function AgendaCard({
  day,
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
      <Card className={`w-full hover:shadow-md transition-shadow ${isToday ? 'shadow-md bg-primary-green ' : 'bg-secondary-green'}`}>
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className={isToday ? "text-white" : "text-base font-semibold"}>{day}</CardTitle>
            </div>
            <Badge
              variant={completed ? "default" : "secondary"}
              className={`w-fit ${!completed && !isLoading ? 'cursor-pointer hover:opacity-80' : ''} ${completed || isLoading ? 'cursor-not-allowed' : ''}`}
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
        </CardHeader>
        <CardContent className="space-y-1 text-sm pb-3">
          <div className="flex gap-1">
            <p className={`font-semibold mb-0.5 ${isToday ? 'text-white' : 'text-muted-foreground'}`}>Exercise:</p>
            <p className={isToday ? 'text-white' : 'text-foreground'}>{exerciseDetails}</p>
          </div>
          {mealDetails && (
            <div className="flex gap-1">
              <p className={`font-semibold mb-0.5 ${isToday ? 'text-white' : 'text-muted-foreground'}`}>Meals:</p>
              <p className={isToday ? 'text-white' : 'text-foreground'}>{mealDetails}</p>
            </div>
          )}
          {sleepDetails && (
            <div className="flex gap-1">
              <p className={`font-semibold mb-0.5 ${isToday ? 'text-white' : 'text-muted-foreground'}`}>Sleep:</p>
              <p className={isToday ? 'text-white' : 'text-foreground'}>{sleepDetails}</p>
            </div>
          )}
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

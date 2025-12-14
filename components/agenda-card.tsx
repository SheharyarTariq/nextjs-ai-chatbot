"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import * as yup from "yup";
import { toast } from "./toast";

interface AgendaCardProps {
  day: string;
  date?: string;
  completed: boolean;
  exerciseDetails: string;
  mealDetails?: string;
  sleepDetails?: string;
  weekNumber: number;
  isToday?: boolean;
  rating?: number;
  energy?: number;
  meals?: number | boolean;
  sleep?: number | boolean;
  notes?: string;
  variant?: "default" | "floating";
  onUpdate?: () => void;
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
  rating: initialRating,
  energy: initialEnergy,
  meals: initialMeals,
  sleep: initialSleep,
  notes: initialNotes,
  variant = "default",
  onUpdate,
}: AgendaCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [rating, setRating] = useState(initialRating?.toString() || "");
  const [energy, setEnergy] = useState(initialEnergy?.toString() || "");
  // Convert boolean to number for backward compatibility: true -> 3, false -> 1
  const getInitialMealsValue = () => {
    if (initialMeals === undefined) return 1;
    if (typeof initialMeals === "boolean") return initialMeals ? 3 : 1;
    return initialMeals;
  };
  const getInitialSleepValue = () => {
    if (initialSleep === undefined) return 1;
    if (typeof initialSleep === "boolean") return initialSleep ? 3 : 1;
    return initialSleep;
  };
  const [meals, setMeals] = useState<number[]>([getInitialMealsValue()]);
  const [sleep, setSleep] = useState<number[]>([getInitialSleepValue()]);
  const [notes, setNotes] = useState(initialNotes || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validationSchema = yup.object().shape({
    rating: yup.string().required("Required"),
    energy: yup.string().required("Required"),
    meals: yup.number().min(1).max(3).required("Required"),
    sleep: yup.number().min(1).max(3).required("Required"),
    notes: yup.string(),
  });

  const handleIconClick = () => {
    if (isLoading) return;

    if (date) {
      const sessionDate = new Date(date);
      const today = new Date();
      sessionDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (sessionDate > today) {
        toast({
          type: "error",
          description: "You can not complete any future session till the day arrives."
        });
        return;
      }
    }

    setRating(initialRating?.toString() || "");
    setEnergy(initialEnergy?.toString() || "");
    setMeals([getInitialMealsValue()]);
    setSleep([getInitialSleepValue()]);
    setNotes(initialNotes || "");
    setErrors({});

    setIsDialogOpen(true);
  };

  const handleConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (completed) {
      setIsDialogOpen(false);
      return;
    }

    try {
      await validationSchema.validate(
        { rating, energy, meals: meals[0], sleep: sleep[0], notes },
        { abortEarly: false }
      );
      setErrors({});
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const newErrors: Record<string, string> = {};
        err.inner.forEach((error) => {
          if (error.path) {
            newErrors[error.path] = error.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

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
          rating: parseInt(rating),
          energy: parseInt(energy),
          meals: meals[0],
          sleep: sleep[0],
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update agenda");
      }

      toast({
        type: "success",
        description: "Status updated successfully",
      });
      setIsDialogOpen(false);
      // Trigger agenda refresh without page reload
      if (onUpdate) {
        onUpdate();
      } else {
        // Fallback: dispatch custom event for components that listen to it
        window.dispatchEvent(new CustomEvent("agenda-refresh"));
      }
    } catch (error: any) {
      console.error("Error updating agenda:", error);
      toast({
        description: error.message || "Failed to update agenda",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card
        className={`w-full rounded-lg border hover:shadow-md transition-shadow ${variant === "floating" && isToday
          ? "bg-primary-green/80 backdrop-blur-md border-white/20 text-black shadow-lg"
          : isToday
            ? "bg-primary-green text-white"
            : "bg-secondary-green"
          }`}
      >
        <CardContent className="p-3">
          <div className="flex h-full items-center gap-4">
            <div className="flex flex-col items-center justify-center gap-[3px]">
              <p className={`text-xs sm:text-sm font-normal ${variant === "floating" && isToday ? "text-black" : isToday ? "text-white" : "text-foreground"}`}>
                {day?.slice(0, 3).toUpperCase()}
              </p>

              {date && (
                <>
                  <p className={`text-sm sm:text-base font-bold ${variant === "floating" && isToday ? "text-black" : isToday ? "text-white" : "text-foreground"}`}>
                    {new Date(date).getDate()}
                  </p>
                  <p className={`text-xs sm:text-sm font-normal ${variant === "floating" && isToday ? "text-black" : isToday ? "text-white" : "text-foreground"}`}>
                    {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                  </p>
                </>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-[14px] break-all font-semibold leading-snug ${variant === "floating" && isToday ? "text-black" : isToday ? "text-white" : "text-foreground"
                  }`}>
                  {exerciseDetails}
                </h3>

                <Badge
                  variant={completed && isToday ? "secondary" : completed ? "default" : "secondary"}
                  className={`whitespace-nowrap cursor-pointer hover:opacity-80 ${isLoading ? "cursor-not-allowed" : ""
                    }`}
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
                <p className={`mt-1 text-xs sm:text-sm ${variant === "floating" && isToday ? "text-black/80" : isToday ? "text-white/90" : "text-muted-foreground"
                  }`}>
                  {mealDetails}
                </p>
              )}
              {sleepDetails && (
                <p className={`text-xs sm:text-sm ${variant === "floating" && isToday ? "text-black/80" : isToday ? "text-white/90" : "text-muted-foreground"
                  }`}>
                  {sleepDetails}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {completed ? "Session Details" : "Mark Session as Completed"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {completed
                ? "Here are the details you recorded for this session."
                : "Please provide details about your session."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Session Rating</Label>
                <Select value={rating} onValueChange={setRating} disabled={completed}>
                  <SelectTrigger id="rating">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Low</SelectItem>
                    <SelectItem value="2">2 - Average</SelectItem>
                    <SelectItem value="3">3 - Strong</SelectItem>
                  </SelectContent>
                </Select>
                {errors.rating && (
                  <p className="text-sm text-red-500">{errors.rating}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="energy">Energy Level</Label>
                <Select value={energy} onValueChange={setEnergy} disabled={completed}>
                  <SelectTrigger id="energy">
                    <SelectValue placeholder="Select energy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Low</SelectItem>
                    <SelectItem value="2">2 - Stable</SelectItem>
                    <SelectItem value="3">3 - High</SelectItem>
                  </SelectContent>
                </Select>
                {errors.energy && (
                  <p className="text-sm text-red-500">{errors.energy}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
              <div className={`space-y-2 border-0 ${completed ? "opacity-70" : ""}`}>
                <div className="flex items-center justify-between">
                  <Label htmlFor="meals" className={completed ? "cursor-not-allowed" : "cursor-pointer"}>Meals</Label>
                  <span className="text-sm text-muted-foreground">{meals[0]}/3</span>
                </div>
                <Slider
                  id="meals"
                  value={meals}
                  onValueChange={setMeals}
                  min={1}
                  max={3}
                  step={1}
                  disabled={completed}
                />
              </div>

              <div className={`space-y-2 border-0 ${completed ? "opacity-70" : ""}`}>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sleep" className={completed ? "cursor-not-allowed" : "cursor-pointer"}>Sleep</Label>
                  <span className="text-sm text-muted-foreground">{sleep[0]}/3</span>
                </div>
                <Slider
                  id="sleep"
                  value={sleep}
                  onValueChange={setSleep}
                  min={1}
                  max={3}
                  step={1}
                  disabled={completed}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="How did it go?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                readOnly={completed}
                className={completed ? "bg-muted" : ""}
              />
            </div>
          </div>

          <AlertDialogFooter>
            {!completed && (
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            )}
            <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : completed ? (
                "Close"
              ) : (
                "Save & Complete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

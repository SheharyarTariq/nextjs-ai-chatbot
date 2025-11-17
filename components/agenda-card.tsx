import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";

interface AgendaCardProps {
  day: string;
  completed: boolean;
  exerciseDetails: string;
  mealDetails: string;
  sleepDetails: string;
}

export function AgendaCard({
  day,
  completed,
  exerciseDetails,
  mealDetails,
  sleepDetails,
}: AgendaCardProps) {
  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{day}</CardTitle>
          {completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-gray-300" />
          )}
        </div>
        <Badge
          variant={completed ? "default" : "secondary"}
          className="w-fit mt-1"
        >
          {completed ? "Completed" : "Pending"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-semibold text-muted-foreground mb-1">Exercise:</p>
          <p className="text-foreground">{exerciseDetails}</p>
        </div>
        <div>
          <p className="font-semibold text-muted-foreground mb-1">Meals:</p>
          <p className="text-foreground">{mealDetails}</p>
        </div>
        <div>
          <p className="font-semibold text-muted-foreground mb-1">Sleep:</p>
          <p className="text-foreground">{sleepDetails}</p>
        </div>
      </CardContent>
    </Card>
  );
}

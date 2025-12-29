"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Activity, Zap } from "lucide-react";
import { format } from "date-fns";
import type { EventType, EventIntensity } from "@/lib/db/schema";

interface EventCardProps {
	event: {
		id: string;
		title: string;
		location?: string;
		city: string;
		date?: string;
		time?: string;
		duration?: number;
		type: EventType;
		intensity: EventIntensity;
	};
}

const typeColors: Record<EventType, string> = {
	Run: "bg-blue-500/10 text-blue-500 border-blue-500/20",
	Yoga: "bg-purple-500/10 text-purple-500 border-purple-500/20",
	Strength: "bg-red-500/10 text-red-500 border-red-500/20",
	Mobility: "bg-green-500/10 text-green-500 border-green-500/20",
	HIIT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
	Recovery: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
	Others: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const intensityColors: Record<EventIntensity, string> = {
	High: "bg-red-500/10 text-red-500 border-red-500/20",
	Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
	Low: "bg-green-500/10 text-green-500 border-green-500/20",
};

export function EventCard({ event }: EventCardProps) {
	let eventDate: Date | null = null;
	let isUpcoming = false;

	if (event.date) {
		const dateTimeString = event.time
			? `${event.date}T${event.time}`
			: `${event.date}T00:00`;
		eventDate = new Date(dateTimeString);
		isUpcoming = eventDate > new Date();
	}

	return (
		<Card className={`p-4 space-y-3 transition-all hover:shadow-md ${isUpcoming ? 'border-primary-green/50' : 'opacity-75'}`}>
			<div className="flex items-start justify-between">
				<h3 className="font-semibold text-base line-clamp-1">{event.title}</h3>
				{isUpcoming && (
					<Badge variant="outline" className="bg-primary-green/10 text-primary-green border-primary-green/20">
						Upcoming
					</Badge>
				)}
			</div>

			{/* Date & Time */}
			{eventDate && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Calendar className="h-4 w-4" />
					<span>{format(eventDate, "MMM dd, yyyy")}</span>
					{event.time && (
						<>
							<span>•</span>
							<Clock className="h-4 w-4" />
							<span>{format(eventDate, "hh:mm a")}</span>
						</>
					)}
				</div>
			)}

			{/* Location */}
			<div className="flex items-start gap-2 text-sm text-muted-foreground">
				<MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
				<div className="flex-1 min-w-0">
					{event.location ? (
						<p className="line-clamp-1">{event.location}</p>
					) : (
						<p>{event.city}</p>
					)}
				</div>
			</div>

			{/* Duration, Type, and Intensity */}
			<div className="flex flex-wrap items-center gap-2">
				{event.duration && (
					<Badge variant="outline" className="bg-muted">
						{event.duration} min
					</Badge>
				)}
				{event.type && (
					<Badge
						variant="outline"
						className={typeColors[event.type] || typeColors.Others}
					>
						<Activity className="h-3 w-3 mr-1" />
						{event.type}
					</Badge>
				)}
				{event.intensity && (
					<Badge
						variant="outline"
						className={intensityColors[event.intensity] || intensityColors.Medium}
					>
						<Zap className="h-3 w-3 mr-1" />
						{event.intensity}
					</Badge>
				)}
			</div>
		</Card>
	);
}

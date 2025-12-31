import { getEventById, isUserJoinedToEvent } from "@/lib/db/queries";
import { auth } from "@/app/(auth)/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Activity, Zap, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { CopyLinkButton } from "@/components/copy-link-button";
import { JoinEventButton } from "@/components/join-event-button";
import type { EventType, EventIntensity } from "@/lib/db/schema";
import { typeColors, intensityColors } from "@/components/page/constants";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [event, session] = await Promise.all([
		getEventById({ id }),
		auth()
	]);

	if (!event) {
		notFound();
	}

	const isJoined = session?.user?.id
		? await isUserJoinedToEvent({ userId: session.user.id, eventId: id })
		: false;

	const eventDate = parseISO(`${event.date}T${event.time}`);

	return (
		<div className="flex-1 w-full flex flex-col items-center justify-center p-4 md:p-8">
			<div className="w-full max-w-2xl space-y-6">

				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold tracking-tight">Event Details</h1>
					<div className="flex items-center gap-2">
						<CopyLinkButton />
					</div>
				</div>

				<Card className="overflow-hidden border-none shadow-2xl bg-card/50 backdrop-blur-sm">
					<div className="h-48 bg-linear-to-br from-primary/20 via-primary/10 to-background relative overflow-hidden">
						<div className="absolute inset-0 flex items-center justify-center">
							<Activity className="h-24 w-24 text-primary/20 animate-pulse" />
						</div>
					</div>
					<CardHeader className="space-y-4">
						<div className="flex flex-wrap gap-2">
							<Badge variant="outline" className={typeColors[event.type as EventType]}>
								<Activity className="h-3 w-3 mr-1" />
								{event.type}
							</Badge>
							<Badge variant="outline" className={intensityColors[event.intensity as EventIntensity]}>
								<Zap className="h-3 w-3 mr-1" />
								{event.intensity}
							</Badge>
							<Badge variant="secondary" className="bg-muted/50">
								<Users className="h-3 w-3 mr-1" />
								{event.participantCount} joined
							</Badge>
						</div>
						<CardTitle className="text-3xl md:text-4xl font-extrabold tracking-tight">{event.title}</CardTitle>
						<p className="text-lg text-muted-foreground font-medium">Hosted by {event.host}</p>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-1.5">
								<div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									Date
								</div>
								<p className="text-lg font-semibold">{format(eventDate, "EEEE, MMMM do, yyyy")}</p>
							</div>
							<div className="space-y-1.5">
								<div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Clock className="h-4 w-4" />
									Time & Duration
								</div>
								<p className="text-lg font-semibold">
									{format(eventDate, "hh:mm a")} ({event.duration} min)
								</p>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<MapPin className="h-4 w-4" />
								Location
							</div>
							<div className="p-4 rounded-xl bg-muted/30 border border-muted flex flex-col gap-2">
								<p className="text-lg font-semibold">{event.location}</p>
								<p className="text-sm text-muted-foreground">{event.city}</p>
								<a
									href={`https://www.google.com/maps/dir/?api=1&destination=${event.locationLat},${event.locationLng}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
								>
									Get Directions <MapPin className="h-3 w-3" />
								</a>
							</div>
						</div>

						<div className="pt-6 border-t border-muted/20 space-y-4">
							<JoinEventButton
								eventId={id}
								isLoggedIn={!!session?.user}
								initialJoined={isJoined}
								userRole={session?.user?.role}
								eventDate={event.date}
								eventTitle={event.title}
							/>
							<p className="text-sm text-center text-muted-foreground italic">
								Join our community to participate in this and other exciting events!
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/queries";
import { event, userEvent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";

export async function GET(request: NextRequest) {
	try {
		const session = await auth();

		if (!session || !session.user?.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const userId = session.user.id;

		const joinedEvents = await db
			.select({
				id: event.id,
				title: event.title,
				location: event.location,
				locationLat: event.locationLat,
				locationLng: event.locationLng,
				city: event.city,
				date: event.date,
				time: event.time,
				duration: event.duration,
				type: event.type,
				intensity: event.intensity,
				participantCount: event.participantCount,
				createdAt: event.createdAt,
				joinedAt: userEvent.joinedAt,
			})
			.from(userEvent)
			.innerJoin(event, eq(userEvent.eventId, event.id))
			.where(eq(userEvent.userId, userId))
			.orderBy(event.date, event.time);

		return NextResponse.json({
			success: true,
			events: joinedEvents,
		});
	} catch (error) {
		console.error("Error fetching joined events:", error);
		return NextResponse.json(
			{ error: "Failed to fetch joined events" },
			{ status: 500 }
		);
	}
}

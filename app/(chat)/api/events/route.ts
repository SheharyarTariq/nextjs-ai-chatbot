import { auth } from "@/app/(auth)/auth";
import { createEvent, db } from "@/lib/db/queries";
import { NextResponse } from "next/server";
import { event, userEvent } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Unauthorized - Please login to view events" },
				{ status: 401 }
			);
		}

		const userId = session.user.id;

		const allEvents = await db
			.select()
			.from(event)
			.orderBy(desc(event.date));

		// Get all event user join
		const userJoinedEvents = await db
			.select({ eventId: userEvent.eventId })
			.from(userEvent)
			.where(eq(userEvent.userId, userId));

		const joinedEventIds = new Set(
			userJoinedEvents.map((ue: { eventId: string }) => ue.eventId)
		);

		// Add hasJoined flag to each event
		const eventsWithJoinStatus = allEvents.map((evt: any) => ({
			...evt,
			hasJoined: joinedEventIds.has(evt.id),
		}));

		return NextResponse.json({
			success: true,
			events: eventsWithJoinStatus,
		});
	} catch (error: any) {
		console.error("Error fetching events:", error);
		return NextResponse.json(
			{ error: "Internal server error", message: error.message },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		if (session.user.role !== "admin") {
			return NextResponse.json(
				{ error: "Forbidden - Only administrators can create events" },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const {
			title,
			location,
			locationLat,
			locationLng,
			city,
			date,
			time,
			duration,
			type,
			intensity,
		} = body;

		if (!title || title.length > 50) {
			return NextResponse.json(
				{ error: "Title is required and must be 50 characters or less" },
				{ status: 400 }
			);
		}

		if (!location) {
			return NextResponse.json(
				{ error: "Location is required" },
				{ status: 400 }
			);
		}

		// if (!locationLat && locationLat !== 0) {
		// 	return NextResponse.json(
		// 		{ error: "Location latitude is required" },
		// 		{ status: 400 }
		// 	);
		// }

		// if (!locationLng && locationLng !== 0) {
		// 	return NextResponse.json(
		// 		{ error: "Location longitude is required" },
		// 		{ status: 400 }
		// 	);
		// }

		if (!city) {
			return NextResponse.json(
				{ error: "City is required" },
				{ status: 400 }
			);
		}

		if (!date) {
			return NextResponse.json(
				{ error: "Date is required" },
				{ status: 400 }
			);
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const selectedDate = new Date(date);
		if (selectedDate < today) {
			return NextResponse.json(
				{ error: "Event date cannot be in the past" },
				{ status: 400 }
			);
		}

		if (!time) {
			return NextResponse.json(
				{ error: "Time is required" },
				{ status: 400 }
			);
		}

		if (!duration) {
			return NextResponse.json(
				{ error: "Duration is required" },
				{ status: 400 }
			);
		}

		if (!type) {
			return NextResponse.json(
				{ error: "Type is required" },
				{ status: 400 }
			);
		}

		if (!intensity) {
			return NextResponse.json(
				{ error: "Intensity is required" },
				{ status: 400 }
			);
		}

		const [newEvent] = await createEvent({
			userId: session.user.id,
			title,
			location,
			locationLat,
			locationLng,
			city,
			date,
			time,
			duration,
			type,
			intensity,
		});

		return NextResponse.json({
			success: true,
			event: newEvent,
		});
	} catch (error: any) {
		console.error("Error creating event:", error);
		return NextResponse.json(
			{ error: "Internal server error", message: error.message },
			{ status: 500 }
		);
	}
}

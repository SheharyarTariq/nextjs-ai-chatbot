import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { event, agenda } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth();

		if (!session || !session.user?.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { id: eventId } = await params;
		const userId = session.user.id;

		const [eventData] = await db
			.select()
			.from(event)
			.where(eq(event.id, eventId))
			.limit(1);

		if (!eventData) {
			return NextResponse.json(
				{ error: "Event not found" },
				{ status: 404 }
			);
		}

		const [userAgenda] = await db
			.select()
			.from(agenda)
			.where(eq(agenda.userId, userId))
			.limit(1);

		if (!userAgenda || !userAgenda.weeklyData) {
			return NextResponse.json({
				hasConflict: false,
			});
		}

		// Check for conflict
		let conflictingSession = null;
		for (const week of userAgenda.weeklyData as any[]) {
			for (const session of week.sessions) {
				if (session.date === eventData.date) {
					// Check if it's actually a workout (not rest)
					const isWorkout = session.exerciseDetails &&
						!session.exerciseDetails.toLowerCase().includes("rest") &&
						!session.exerciseDetails.toLowerCase().includes("no workout");

					if (isWorkout) {
						conflictingSession = {
							...session,
							weekNumber: week.weekNumber
						};
						break;
					}
				}
			}
			if (conflictingSession) break;
		}

		return NextResponse.json({
			hasConflict: !!conflictingSession,
			conflictingSession,
			eventDate: eventData.date
		});

	} catch (error) {
		console.error("Error checking for conflict:", error);
		return NextResponse.json(
			{ error: "Failed to check conflict" },
			{ status: 500 }
		);
	}
}

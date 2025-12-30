import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/queries";
import { event, userEvent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";

export async function POST(
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

		const existingEvent = await db
			.select()
			.from(event)
			.where(eq(event.id, eventId))
			.limit(1);

		if (existingEvent.length === 0) {
			return NextResponse.json(
				{ error: "Event not found" },
				{ status: 404 }
			);
		}

		const existingUserEvent = await db
			.select()
			.from(userEvent)
			.where(
				and(
					eq(userEvent.userId, userId),
					eq(userEvent.eventId, eventId)
				)
			)
			.limit(1);

		if (existingUserEvent.length > 0) {
			return NextResponse.json(
				{ error: "You have already joined this event" },
				{ status: 400 }
			);
		}

		await db.insert(userEvent).values({
			userId,
			eventId,
		});

		const currentCount = existingEvent[0].participantCount || 0;
		await db
			.update(event)
			.set({
				participantCount: currentCount + 1,
				updatedAt: new Date()
			})
			.where(eq(event.id, eventId));

		return NextResponse.json({
			success: true,
			message: "Successfully joined the event",
		});
	} catch (error) {
		console.error("Error joining event:", error);
		return NextResponse.json(
			{ error: "Failed to join event" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
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

		const existingUserEvent = await db
			.select()
			.from(userEvent)
			.where(
				and(
					eq(userEvent.userId, userId),
					eq(userEvent.eventId, eventId)
				)
			)
			.limit(1);

		if (existingUserEvent.length === 0) {
			return NextResponse.json(
				{ error: "You have not joined this event" },
				{ status: 400 }
			);
		}

		await db
			.delete(userEvent)
			.where(
				and(
					eq(userEvent.userId, userId),
					eq(userEvent.eventId, eventId)
				)
			);

		const existingEvent = await db
			.select()
			.from(event)
			.where(eq(event.id, eventId))
			.limit(1);

		if (existingEvent.length > 0) {
			const currentCount = existingEvent[0].participantCount || 0;
			await db
				.update(event)
				.set({
					participantCount: Math.max(0, currentCount - 1),
					updatedAt: new Date()
				})
				.where(eq(event.id, eventId));
		}

		return NextResponse.json({
			success: true,
			message: "Successfully left the event",
		});
	} catch (error) {
		console.error("Error leaving event:", error);
		return NextResponse.json(
			{ error: "Failed to leave event" },
			{ status: 500 }
		);
	}
}

import { auth } from "@/app/(auth)/auth";
import { updateEvent, deleteEvent, getEventById } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const event = await getEventById({ id });

		if (!event) {
			return NextResponse.json(
				{ error: "Event not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			event,
		});
	} catch (error: any) {
		console.error("Error fetching event:", error);
		return NextResponse.json(
			{ error: "Internal server error", message: error.message },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		if (session.user.role !== "admin") {
			return NextResponse.json(
				{ error: "Forbidden - Only administrators can update events" },
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

		// Validation
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

		const updatedEvent = await updateEvent({
			id,
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
			event: updatedEvent,
		});
	} catch (error: any) {
		console.error("Error updating event:", error);
		return NextResponse.json(
			{ error: "Internal server error", message: error.message },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		if (session.user.role !== "admin") {
			return NextResponse.json(
				{ error: "Forbidden - Only administrators can delete events" },
				{ status: 403 }
			);
		}

		await deleteEvent({ id });

		return NextResponse.json({
			success: true,
			message: "Event deleted successfully",
		});
	} catch (error: any) {
		console.error("Error deleting event:", error);
		return NextResponse.json(
			{ error: "Internal server error", message: error.message },
			{ status: 500 }
		);
	}
}

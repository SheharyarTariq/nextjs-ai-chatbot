import { auth } from "@/app/(auth)/auth";
import { getAgendaByUserId, updateAgenda } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { weekNumber, day, completed } = body;

    if (typeof weekNumber !== "number" || !day || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body. Required: weekNumber (number), day (string), completed (boolean)" },
        { status: 400 }
      );
    }

    // Get current agenda to validate week and day exist
    const agenda = await getAgendaByUserId({ userId: session.user.id });

    if (!agenda) {
      return NextResponse.json(
        { error: "No agenda found" },
        { status: 404 }
      );
    }

    // Validate that the week exists
    const weekData = agenda.weeklyData?.find(
      (week: any) => week.weekNumber === weekNumber
    );

    if (!weekData) {
      return NextResponse.json(
        { error: "Week not found" },
        { status: 404 }
      );
    }

    // Validate that the day exists
    const sessionData = weekData.sessions.find(
      (session: any) => session.day === day
    );

    if (!sessionData) {
      return NextResponse.json(
        { error: "Day not found" },
        { status: 404 }
      );
    }

    // Update the session - the updateAgenda function will handle merging
    const [updatedAgenda] = await updateAgenda({
      userId: session.user.id,
      weeklyData: [
        {
          weekNumber,
          sessions: [
            {
              ...sessionData,
              completed,
            },
          ],
        },
      ],
    });

    if (!updatedAgenda) {
      return NextResponse.json(
        { error: "Failed to update agenda" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Agenda updated successfully",
      agenda: updatedAgenda,
    });
  } catch (error: any) {
    console.error("Error updating agenda:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

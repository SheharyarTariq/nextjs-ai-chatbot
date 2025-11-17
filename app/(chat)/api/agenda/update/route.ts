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

    // Get current agenda
    const agenda = await getAgendaByUserId({ userId: session.user.id });

    if (!agenda) {
      return NextResponse.json(
        { error: "No agenda found" },
        { status: 404 }
      );
    }

    // Clone weeklyData to avoid mutation
    const updatedWeeklyData = JSON.parse(JSON.stringify(agenda.weeklyData || []));

    // Find the week
    const weekIndex = updatedWeeklyData.findIndex(
      (week: any) => week.weekNumber === weekNumber
    );

    if (weekIndex === -1) {
      return NextResponse.json(
        { error: "Week not found" },
        { status: 404 }
      );
    }

    // Find the session/day
    const sessionIndex = updatedWeeklyData[weekIndex].sessions.findIndex(
      (session: any) => session.day === day
    );

    if (sessionIndex === -1) {
      return NextResponse.json(
        { error: "Day not found" },
        { status: 404 }
      );
    }

    // Update the completed status
    updatedWeeklyData[weekIndex].sessions[sessionIndex].completed = completed;

    // Save to database
    const [updatedAgenda] = await updateAgenda({
      userId: session.user.id,
      weeklyData: updatedWeeklyData,
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

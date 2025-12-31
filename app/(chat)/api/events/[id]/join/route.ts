import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/queries";
import { event, userEvent, agenda } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";

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
    const body = await request.json().catch(() => ({}));
    const { resolution } = body;

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

    const eventData = existingEvent[0];

    if (resolution && resolution !== "add") {
      const [userAgenda] = await db
        .select()
        .from(agenda)
        .where(eq(agenda.userId, userId))
        .limit(1);

      if (userAgenda && userAgenda.weeklyData) {
        let updatedWeeklyData = JSON.parse(JSON.stringify(userAgenda.weeklyData));
        let sessionToMove = null;
        let targetWeekIndex = -1;
        let targetSessionIndex = -1;

        // Find conflict with agenda
        for (let w = 0; w < updatedWeeklyData.length; w++) {
          for (let s = 0; s < updatedWeeklyData[w].sessions.length; s++) {
            if (updatedWeeklyData[w].sessions[s].date === eventData.date) {
              sessionToMove = updatedWeeklyData[w].sessions[s];
              targetWeekIndex = w;
              targetSessionIndex = s;
              break;
            }
          }
          if (sessionToMove) break;
        }

        if (sessionToMove) {
          if (resolution === "replace") {
            // Replace-case1 Remove the session for this day
            updatedWeeklyData[targetWeekIndex].sessions = updatedWeeklyData[targetWeekIndex].sessions.filter(
              (s: any) => s.date !== eventData.date
            );
          } else if (resolution === "rebalance") {
            // Rebalance-case4 Ask AI to reduce the load
            try {
              const { text: reducedExerciseDetails } = await generateText({
                model: myProvider.languageModel("chat-model"),
                system: "You are an expert athletic coach for 'Athlete Standards'. Your job is to adjust a training session to reduce its intensity ('rebalance') because the user has a conflicting event on the same day. Keep the workout structure but scale it down significantly. Provide ONLY the new exercise details as a concise string (max 60 characters).",
                prompt: `Original workout: '${sessionToMove.exerciseDetails}'. Conflicting event: '${eventData.title}'. Please provide a reduced-intensity version of the workout.`,
              });

              updatedWeeklyData[targetWeekIndex].sessions[targetSessionIndex].exerciseDetails = reducedExerciseDetails.trim();
              updatedWeeklyData[targetWeekIndex].sessions[targetSessionIndex].notes = `Intensity reduced to accommodate event: ${eventData.title}`;
            } catch (error) {
              console.error("AI rebalance failed, falling back to simple reduction:", error);
              updatedWeeklyData[targetWeekIndex].sessions[targetSessionIndex].exerciseDetails = `[Reduced Load] ${sessionToMove.exerciseDetails}`;
            }
          } else if (resolution === "move") {
            // Move-case2
            const weekSessions = updatedWeeklyData[targetWeekIndex].sessions;
            let lowLoadDayIndex = -1;

            // Look for a Rest day in the same week
            for (let i = 0; i < weekSessions.length; i++) {
              const isRest = !weekSessions[i].exerciseDetails ||
                weekSessions[i].exerciseDetails.toLowerCase().includes("rest") ||
                weekSessions[i].exerciseDetails.toLowerCase().includes("no workout");

              if (isRest && i !== targetSessionIndex) {
                lowLoadDayIndex = i;
                break;
              }
            }

            if (lowLoadDayIndex !== -1) {
              // Swap or Move
              const originalDetails = sessionToMove.exerciseDetails;
              // Mark current day as Replaced
              updatedWeeklyData[targetWeekIndex].sessions[targetSessionIndex].exerciseDetails = `Rest Day (Moved to ${updatedWeeklyData[targetWeekIndex].sessions[lowLoadDayIndex].day})`;
              // Move original workout to low load day
              updatedWeeklyData[targetWeekIndex].sessions[lowLoadDayIndex].exerciseDetails = originalDetails;
              updatedWeeklyData[targetWeekIndex].sessions[lowLoadDayIndex].notes = `Moved from ${sessionToMove.day} because of event: ${eventData.title}`;
            }
          }

          await db.update(agenda)
            .set({ weeklyData: updatedWeeklyData, updatedAt: new Date() })
            .where(eq(agenda.id, userAgenda.id));
        }
      }
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

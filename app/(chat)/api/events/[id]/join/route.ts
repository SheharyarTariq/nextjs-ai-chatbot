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

    // Check if already joined
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

    // --- AUTOMATIC AI CONFLICT RESOLUTION ---
    const [userAgenda] = await db
      .select()
      .from(agenda)
      .where(eq(agenda.userId, userId))
      .limit(1);

    if (userAgenda && userAgenda.weeklyData) {
      let updatedWeeklyData = JSON.parse(JSON.stringify(userAgenda.weeklyData));
      let conflictingSession = null;
      let targetWeekIndex = -1;
      let targetSessionIndex = -1;

      // Find conflict with agenda
      for (let w = 0; w < updatedWeeklyData.length; w++) {
        for (let s = 0; s < updatedWeeklyData[w].sessions.length; s++) {
          if (updatedWeeklyData[w].sessions[s].date === eventData.date) {
            // Check if it's a workout (not rest)
            const isWorkout = updatedWeeklyData[w].sessions[s].exerciseDetails &&
              !updatedWeeklyData[w].sessions[s].exerciseDetails.toLowerCase().includes("rest") &&
              !updatedWeeklyData[w].sessions[s].exerciseDetails.toLowerCase().includes("no workout");

            if (isWorkout) {
              conflictingSession = updatedWeeklyData[w].sessions[s];
              targetWeekIndex = w;
              targetSessionIndex = s;
              break;
            }
          }
        }
        if (conflictingSession) break;
      }

      if (conflictingSession) {
        // Prepare AI prompting for automatic resolution
        try {
          // Rule 1: check if types match
          const eventType = eventData.type.toLowerCase();
          const agendaDetails = conflictingSession.exerciseDetails.toLowerCase();
          const isSameType = agendaDetails.includes(eventType) || (eventType === 'run' && agendaDetails.includes('running'));

          const resolutionMode = isSameType ? "REPLACE" : "REDUCE_LOAD";

          const { text: newWeeklyDataJson } = await generateText({
            model: myProvider.languageModel("chat-model"),
            system: `You are an expert athletic coach for 'Athlete Standards'. 
            The user wants to join an event: "${eventData.title}" (${eventData.type}) on ${eventData.date}.
            This conflicts with their agenda session: "${conflictingSession.exerciseDetails}".
            
            ADJUSTMENT RULES:
            1. Mode is ${resolutionMode}. 
               - If REPLACE: COMPLETELY REMOVE the session for ${eventData.date} from the sessions array because the event replaces it. The user will attend the event instead of this training session.
               - If REDUCE_LOAD: The agenda session for ${eventData.date} should be REDUCED to a lower intensity/volume (e.g. single session instead of double, or reduce duration/intensity).
            2. MAINTAIN MAIN GOAL: The user's goal is "${userAgenda.goal}". You MUST adjust the REMAINING sessions in the current week or the NEXT week to compensate for this change, ensuring the 12-week goal remains achievable.
            3. OUTPUT: Return the ENTIRE updated weeklyData array as a valid JSON string. Do not include any other text.`,
            prompt: `Current Weekly Data: ${JSON.stringify(updatedWeeklyData)}.
            Please provide the updated weeklyData reflecting the ${resolutionMode} and the necessary compensations in future sessions to stay on track for the goal: "${userAgenda.goal}".`,
          });

          // Extract and parse the JSON from AI response
          const jsonMatch = newWeeklyDataJson.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            updatedWeeklyData = parsedData;
          } else {
            // Fallback to manual simple if AI fails
            if (isSameType) {
              // REPLACE: Remove the session entirely from the array
              updatedWeeklyData[targetWeekIndex].sessions = updatedWeeklyData[targetWeekIndex].sessions.filter(
                (s: any, index: number) => index !== targetSessionIndex
              );
            } else {
              // REDUCE_LOAD: Reduce the intensity/volume
              updatedWeeklyData[targetWeekIndex].sessions[targetSessionIndex].exerciseDetails = `[Reduced] ${conflictingSession.exerciseDetails}`;
              updatedWeeklyData[targetWeekIndex].sessions[targetSessionIndex].notes = `Load reduced for event: ${eventData.title}`;
            }
          }

          // Save updated agenda
          await db.update(agenda)
            .set({ weeklyData: updatedWeeklyData, updatedAt: new Date() })
            .where(eq(agenda.id, userAgenda.id));

        } catch (error) {
          console.error("AI conflict resolution failed:", error);
          // Fallback logic could go here if needed
        }
      }
    }

    // Perform the join
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
      message: "Successfully joined the event. Your agenda has been automatically adjusted by AI to stay on track!",
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

    // Get event data before leaving to use in AI prompt
    const existingEvent = await db
      .select()
      .from(event)
      .where(eq(event.id, eventId))
      .limit(1);

    const eventData = existingEvent[0];

    // --- AUTOMATIC AI AGENDA READJUSTMENT (RESTORATION) ---
    const [userAgenda] = await db
      .select()
      .from(agenda)
      .where(eq(agenda.userId, userId))
      .limit(1);

    if (userAgenda && userAgenda.weeklyData && eventData) {
      let updatedWeeklyData = JSON.parse(JSON.stringify(userAgenda.weeklyData));

      try {
        const { text: newWeeklyDataJson } = await generateText({
          model: myProvider.languageModel("chat-model"),
          system: `You are an expert athletic coach for 'Athlete Standards'. 
          The user is LEAVING/CANCELING an event: "${eventData.title}" (${eventData.type}) on ${eventData.date}.
          Previously, their agenda might have been adjusted (sessions removed or reduced) to accommodate this event.
          
          ADJUSTMENT RULES:
          1. RESTORE/RE-OPTIMIZE: You must now restore a proper training session for ${eventData.date} or re-distribute the training load across the remaining days of the week.
          2. MAINTAIN MAIN GOAL: The user's goal is "${userAgenda.goal}". Ensure the training plan is back to its optimal state for achieving this goal.
          3. OUTPUT: Return the ENTIRE updated weeklyData array as a valid JSON string. Do not include any other text.`,
          prompt: `Current Weekly Data: ${JSON.stringify(updatedWeeklyData)}.
          Please provide the updated weeklyData reflecting that the user is no longer attending the event on ${eventData.date}.`,
        });

        const jsonMatch = newWeeklyDataJson.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          updatedWeeklyData = parsedData;

          // Save updated agenda
          await db.update(agenda)
            .set({ weeklyData: updatedWeeklyData, updatedAt: new Date() })
            .where(eq(agenda.id, userAgenda.id));
        }
      } catch (error) {
        console.error("AI agenda restoration failed:", error);
      }
    }

    // Perform the leave
    await db
      .delete(userEvent)
      .where(
        and(
          eq(userEvent.userId, userId),
          eq(userEvent.eventId, eventId)
        )
      );

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
      message: "Successfully left the event. Your agenda has been readjusted to get you back on track!",
    });
  } catch (error) {
    console.error("Error leaving event:", error);
    return NextResponse.json(
      { error: "Failed to leave event" },
      { status: 500 }
    );
  }
}

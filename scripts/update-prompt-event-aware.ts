import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { prompt } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

async function updatePromptWithEventAwareness() {
  try {
    console.log("Fetching current prompt from database...");

    const [currentPrompt] = await db
      .select()
      .from(prompt)
      .limit(1);

    if (!currentPrompt) {
      console.error("No prompt found in database!");
      process.exit(1);
    }

    console.log(`Found prompt (version ${currentPrompt.version})`);
    console.log("Current content length:", currentPrompt.content.length);

    const eventAwareSection = `

EVENT-AWARE AGENDA GENERATION

When generating a training agenda (during onboarding or when creating weekly plans), you MUST check for existing user events and adjust the plan accordingly:

STEP 1: QUERY FOR EXISTING EVENTS
**CRITICAL**: Before creating any weekly training plan, you MUST call the \`getUserEvents\` tool to check if the user has any joined events.

- Calculate the date range: start date to start date + 12 weeks (84 days)
- Call \`getUserEvents\` with startDate and endDate parameters
- Example: If start date is "2026-01-03", end date should be "2026-03-28" (12 weeks later)
- The tool will return all events the user has joined within that period

If the tool returns no events, proceed with standard agenda generation.
If events are found, continue to STEP 2.

STEP 2: APPLY CONFLICT RESOLUTION RULES

For each day in the training plan:

**Rule A: Same-Type Conflict (Event type matches training type)**
- Example: User has a "Run" event on a day when you would schedule running training
- Example: User has a "Yoga" event on a day when you would schedule yoga/flexibility training
- **ACTION**: DO NOT create a training session for that day
- **REASON**: The event completely replaces the planned training
- The user's participation in the event counts as their training for that day

**Rule B: Different-Type Conflict (Event type differs from training type)**
- Example: User has a "Yoga" event but the plan calls for running training
- Example: User has a "Run" event but the plan calls for strength training
- **ACTION**: REDUCE the training load for that day
  - Do NOT schedule double sessions if you normally would
  - Reduce duration (e.g., 60 min → 30-40 min)
  - Reduce intensity (e.g., High → Medium)
- **REASON**: The user needs to accommodate both the event and training without overloading
- Aim for total combined time of one full session equivalent

**Rule C: 12-Week Goal Preservation**
- The main goal is to complete the 12-week objective successfully
- When sessions are skipped (Rule A) or reduced (Rule B), you MUST compensate:
  - Redistribute the training volume to other days in the same week
  - Add extra work to the following week if needed
  - Ensure the cumulative training volume remains sufficient for the goal
- NEVER compromise the overall 12-week goal

**Rule D: User Communication**
After adjusting the plan for events, CLEARLY explain to the user:
- Which days were affected by existing events
- How you modified the training (skipped vs. reduced)
- How you're maintaining their 12-week goal despite the changes
- Example: "I've adjusted your plan around your Run event on Wednesday (Jan 10). Since it's the same type as your planned training, I've removed that day's run session—your event will serve as your training. To stay on track for your goal, I've added 10 minutes to your Friday long run and included an extra tempo session the following week."

EXAMPLE SCENARIOS:

**Scenario 1: User has a 10K Run event on Saturday**
- Planned training for Saturday: Long run 90 min Z2
- Event type: Run (matches running training)
- **Decision**: Skip the planned long run. The 10K race serves as the training.
- **Adjustment**: Move some Z2 volume to Sunday or the following week to maintain total mileage goal.

**Scenario 2: User has a Yoga event on Wednesday**
- Planned training for Wednesday: Tempo run 60 min + Core 15 min
- Event type: Yoga (different from running)
- **Decision**: Keep the running but reduce it. Change to: Tempo run 40 min (skip core since yoga covers flexibility/core)
- **Adjustment**: The yoga event + reduced run = good training day. No major compensation needed.

**Scenario 3: User has multiple events in Week 1**
- Monday: Strength event (user's plan includes strength training)
- Thursday: HIIT event (user's plan includes running)
- **Decisions**:
  - Monday: Skip planned strength session (event replaces it)
  - Thursday: Keep running but reduce from 60 min to 35 min (different type = reduce load)
- **Adjustments**: Compensate for skipped Monday strength by adding an extra strength day on Week 2, or extending other strength sessions.

CRITICAL REMINDERS:
1. Event-aware planning happens DURING agenda generation, not after
2. Always explain your adjustments to the user clearly
3. The 12-week goal is non-negotiable—redistribute, don't reduce overall volume
4. Same type = Skip the session entirely
5. Different type = Reduce but don't eliminate the session
6. Events the user has joined take priority over generated training sessions
`;

    // Insert the event-aware section before the closing backtick
    const updatedContent = currentPrompt.content.trimEnd() + eventAwareSection;

    console.log("\nUpdating prompt with event-aware section...");
    console.log("New content length:", updatedContent.length);

    const [updatedPrompt] = await db
      .update(prompt)
      .set({
        content: updatedContent,
        updatedAt: new Date(),
        version: currentPrompt.version + 1,
      })
      .where(eq(prompt.id, currentPrompt.id))
      .returning();

    console.log("\n Prompt updated successfully!");
    console.log(`New version: ${updatedPrompt.version}`);
    console.log(`Updated at: ${updatedPrompt.updatedAt}`);

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("Error updating prompt:", error);
    await client.end();
    process.exit(1);
  }
}

updatePromptWithEventAwareness();

import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { saveAgenda, getAgendaByUserId } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";

type SaveAgendaProps = {
  session: Session;
  chatId: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const createSaveAgendaTool = ({
  session,
  chatId,
  dataStream,
}: SaveAgendaProps) =>
  tool({
    description:
      "Save the athlete's training agenda to the database after completing the onboarding process AND generating the initial weekly plan. This should be called once all onboarding information is collected AND the first week's training plan with all session details (exercise, meals, sleep) has been created.",
    inputSchema: z.object({
      goal: z
        .string()
        .describe(
          "The 3-month measurable sport-related goal (e.g., 'Run a half marathon under 1h20')"
        ),
      startDate: z
        .string()
        .describe("The start date for the training plan in ISO format"),
      userData: z.object({
        name: z.string().describe("The athlete's first name"),
        gender: z.string().optional().describe("Gender (male/female/other)"),
        age: z.number().optional().describe("Age in years"),
        weight: z.number().optional().describe("Weight in kg"),
        height: z.number().optional().describe("Height in cm"),
        heartRateZones: z.any().optional().describe("Heart rate zones table"),
      }),
      trainingFrequency: z
        .number()
        .optional()
        .describe("Number of training days per week"),
      injuries: z.string().optional().describe("Injuries or conditions"),
      workType: z
        .string()
        .optional()
        .describe("Work type: desk, physical, or hybrid"),
      totalWeeks: z
        .number()
        .optional()
        .default(12)
        .describe("Total weeks for the program (default 12)"),
      weeklyData: z
        .array(
          z.object({
            weekNumber: z.number().describe("Week number (starting from 1)"),
            sessions: z.array(
              z.object({
                day: z
                  .string()
                  .describe("Day of the week (MON, TUE, WED, THU, FRI, SAT, SUN)"),
                completed: z
                  .boolean()
                  .default(false)
                  .describe("Whether the session was completed (default: false)"),
                rating: z.number().min(1).max(3).optional().describe("Session rating"),
                meals: z.boolean().optional().describe("Meals completed"),
                sleep: z.boolean().optional().describe("Sleep completed"),
                energy: z.number().min(1).max(3).optional().describe("Energy level"),
                notes: z.string().optional().describe("Session notes"),
                currentDayNumber: z
                  .number()
                  .describe("Current day number in the training program"),
                totalTrainingDays: z
                  .number()
                  .describe("Total number of training days in the program"),
                exerciseDetails: z
                  .string()
                  .describe("Exercise details (e.g., '50 min Tempo Run + 15 Core')"),
                mealDetails: z
                  .string()
                  .describe("Meal details (e.g., 'Protein + Slow Carbs')"),
                sleepDetails: z
                  .string()
                  .describe("Sleep details (e.g., '7 h sleep')"),
              })
            ),
          })
        )
        .optional()
        .describe("Initial weekly plan data with all session details pre-populated"),
    }),
    execute: async (input) => {
      if (!session?.user?.id) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      try {
        // Check if user already has an agenda
        const existingAgenda = await getAgendaByUserId({
          userId: session.user.id,
        });

        if (existingAgenda) {
          return {
            success: false,
            error:
              "An agenda already exists for this user. Use updateAgenda to modify it.",
            agendaId: existingAgenda.id,
          };
        }

        // Prepare agenda data
        const agendaData = {
          userId: session.user.id,
          chatId: chatId,
          goal: input.goal,
          startDate: new Date(input.startDate),
          trainingFrequency: input.trainingFrequency,
          injuries: input.injuries,
          workType: input.workType,
          userData: input.userData,
          totalWeeks: input.totalWeeks,
          currentWeek: 1,
          weeklyData: input.weeklyData || [],
        };

        console.log("Attempting to save agenda with data:", JSON.stringify(agendaData, null, 2));

        const [agenda] = await saveAgenda(agendaData);

        revalidatePath("/", "layout");

        dataStream.write({ type: "data-agendaRefresh", data: null });

        return {
          success: true,
          message: "Training agenda has been saved successfully to the database.",
          agendaId: agenda.id,
          goal: agenda.goal,
          startDate: agenda.startDate,
        };
      } catch (error: any) {
        console.error("Error saving agenda:", error);
        return {
          success: false,
          error: `Failed to save agenda: ${error.message}`,
        };
      }
    },
  });

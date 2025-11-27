import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { updateAgenda } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";

type UpdateAgendaProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const createUpdateAgendaTool = ({ session, dataStream }: UpdateAgendaProps) =>
  tool({
    description:
      "Update the athlete's training agenda with progress data. Use this after daily check-ins to save session completions, ratings, sleep, energy levels, and weekly progress.",
    inputSchema: z.object({
      currentWeek: z
        .number()
        .optional()
        .describe("The current week number in the program"),
      weeklyData: z
        .array(
          z.object({
            weekNumber: z.number().describe("Week number"),
            sessions: z.array(
              z.object({
                day: z
                  .string()
                  .describe(
                    "Day of the week (MON, TUE, WED, THU, FRI, SAT, SUN)"
                  ),
                date: z
                  .string()
                  .describe("The actual calendar date for this session in ISO format (YYYY-MM-DD)"),
                completed: z
                  .boolean()
                  .describe("Whether the training session was completed"),
                rating: z
                  .number()
                  .min(1)
                  .max(3)
                  .optional()
                  .describe("Session rating (1-3)"),
                meals: z
                  .boolean()
                  .optional()
                  .describe("Proper meals and hydration"),
                sleep: z
                  .boolean()
                  .optional()
                  .describe("Did the athlete rest well"),
                energy: z
                  .number()
                  .min(1)
                  .max(3)
                  .optional()
                  .describe("Energy level (1-3)"),
                notes: z.string().optional().describe("Session notes"),
                currentDayNumber: z
                  .number()
                  .optional()
                  .describe("Current day number in the training program"),
                totalTrainingDays: z
                  .number()
                  .optional()
                  .describe("Total number of training days in the program"),
                exerciseDetails: z
                  .string()
                  .optional()
                  .describe("Exercise details (e.g., '50 min Tempo Run + 15 Core')"),
                mealDetails: z
                  .string()
                  .optional()
                  .describe("Meal details (e.g., 'Protein + Slow Carbs')"),
                sleepDetails: z
                  .string()
                  .optional()
                  .describe("Sleep details (e.g., '7 h sleep')"),
              })
            ),
          })
        )
        .optional()
        .describe("Array of weekly training data"),
      userData: z
        .object({
          name: z.string().optional(),
          gender: z.string().optional(),
          age: z.number().optional(),
          weight: z.number().optional(),
          height: z.number().optional(),
          heartRateZones: z.any().optional(),
        })
        .optional()
        .describe("Updated user data if any changes"),
    }),
    execute: async (input) => {
      if (!session?.user?.id) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      try {
        const [updatedAgenda] = await updateAgenda({
          userId: session.user.id,
          currentWeek: input.currentWeek,
          weeklyData: input.weeklyData,
          userData: input.userData,
        });

        if (!updatedAgenda) {
          return {
            success: false,
            error: "No agenda found to update. Create an agenda first.",
          };
        }

        revalidatePath("/", "layout");

        dataStream.write({ type: "data-agendaRefresh", data: null });

        return {
          success: true,
          message: "Agenda has been updated successfully.",
          agendaId: updatedAgenda.id,
          currentWeek: updatedAgenda.currentWeek,
        };
      } catch (error: any) {
        console.error("Error updating agenda:", error);
        return {
          success: false,
          error: `Failed to update agenda: ${error.message}`,
        };
      }
    },
  });

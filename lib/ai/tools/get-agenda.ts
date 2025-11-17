import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getAgendaByUserId } from "@/lib/db/queries";

export const createGetAgendaTool = ({ session }: { session: Session }) =>
  tool({
    description:
      "Retrieve the athlete's saved training agenda from the database. Use this when the user returns to continue their program or asks about their progress.",
    inputSchema: z.object({}),
    execute: async () => {
      if (!session?.user?.id) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      try {
        const agenda = await getAgendaByUserId({
          userId: session.user.id,
        });

        if (!agenda) {
          return {
            success: false,
            error: "No agenda found. The user needs to complete onboarding first.",
          };
        }

        return {
          success: true,
          agenda: {
            id: agenda.id,
            goal: agenda.goal,
            startDate: agenda.startDate,
            currentWeek: agenda.currentWeek,
            totalWeeks: agenda.totalWeeks,
            trainingFrequency: agenda.trainingFrequency,
            injuries: agenda.injuries,
            workType: agenda.workType,
            userData: agenda.userData,
            weeklyData: agenda.weeklyData,
            createdAt: agenda.createdAt,
            updatedAt: agenda.updatedAt,
          },
        };
      } catch (error: any) {
        console.error("Error retrieving agenda:", error);
        return {
          success: false,
          error: `Failed to retrieve agenda: ${error.message}`,
        };
      }
    },
  });

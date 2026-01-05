import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getUserJoinedEventsByDateRange } from "@/lib/db/queries";

type GetUserEventsProps = {
  session: Session;
};

export const createGetUserEventsTool = ({ session }: GetUserEventsProps) =>
  tool({
    description:
      "Get the user's joined events within a specific date range. Use this BEFORE generating a training agenda to check for existing events that might conflict with planned training sessions. This allows you to adjust the training plan around the user's event commitments.",
    inputSchema: z.object({
      startDate: z
        .string()
        .describe("Start date in ISO format (YYYY-MM-DD) to query events from"),
      endDate: z
        .string()
        .describe("End date in ISO format (YYYY-MM-DD) to query events until"),
    }),
    execute: async ({ startDate, endDate }) => {
      if (!session?.user?.id) {
        return {
          success: false,
          error: "User not authenticated",
          events: [],
        };
      }

      try {
        const events = await getUserJoinedEventsByDateRange({
          userId: session.user.id,
          startDate,
          endDate,
        });

        return {
          success: true,
          events: events.map((event) => ({
            id: event.id,
            title: event.title,
            date: event.date,
            time: event.time,
            duration: event.duration,
            type: event.type,
            intensity: event.intensity,
            location: event.location,
          })),
          message: events.length > 0
            ? `Found ${events.length} event(s) the user has joined between ${startDate} and ${endDate}.`
            : `No events found between ${startDate} and ${endDate}.`,
        };
      } catch (error: any) {
        console.error("Error getting user events:", error);
        return {
          success: false,
          error: `Failed to get user events: ${error.message}`,
          events: [],
        };
      }
    },
  });

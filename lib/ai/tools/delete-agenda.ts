import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { deleteAgendaAndChatByUserId } from "@/lib/db/queries";

export const createDeleteAgendaTool = ({ session }: { session: Session }) =>
  tool({
    description:
      "Delete the athlete's training agenda and the entire conversation from the database. Use this when the user wants to clear/reset/delete their entire plan and conversation to start fresh.",
    inputSchema: z.object({}),
    execute: async () => {
      if (!session?.user?.id) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      try {
        const result = await deleteAgendaAndChatByUserId({
          userId: session.user.id,
        });

        if (!result.success) {
          return {
            success: false,
            error: result.error || "No agenda found to delete.",
          };
        }

        return {
          success: true,
          message: "Your agenda and conversation have been cleared successfully. Redirecting you to start a new conversation...",
          deletedAgendaId: result.deletedAgendaId,
          deletedChatId: result.deletedChatId,
        };
      } catch (error: any) {
        console.error("Error deleting agenda and conversation:", error);
        return {
          success: false,
          error: `Failed to delete agenda and conversation: ${error.message}`,
        };
      }
    },
  });

import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { deleteAgendaByUserId } from "@/lib/db/queries";

export const createDeleteAgendaTool = ({ session }: { session: Session }) =>
  tool({
    description:
      "Delete the athlete's training agenda from the database. Use this when the user wants to clear/reset their entire plan and start over.",
    inputSchema: z.object({}),
    execute: async () => {
      if (!session?.user?.id) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      try {
        const deletedAgenda = await deleteAgendaByUserId({
          userId: session.user.id,
        });

        if (!deletedAgenda) {
          return {
            success: false,
            error: "No agenda found to delete.",
          };
        }

        return {
          success: true,
          message: "Your agenda has been cleared successfully. You can now create a new plan.",
          deletedAgendaId: deletedAgenda.id,
        };
      } catch (error: any) {
        console.error("Error deleting agenda:", error);
        return {
          success: false,
          error: `Failed to delete agenda: ${error.message}`,
        };
      }
    },
  });

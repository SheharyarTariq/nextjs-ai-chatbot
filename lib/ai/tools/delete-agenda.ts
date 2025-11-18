import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { deleteAgendaAndChatByUserId } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";

type DeleteAgendaProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const createDeleteAgendaTool = ({ session, dataStream }: DeleteAgendaProps) =>
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

        revalidatePath("/", "layout");

        dataStream.write({ type: "data-agendaRefresh", data: null });

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

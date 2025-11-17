import { auth } from "@/app/(auth)/auth";
import { deleteAgendaAndChatByUserId } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await deleteAgendaAndChatByUserId({
      userId: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete agenda and conversation" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Agenda and conversation have been reset successfully",
      deletedAgendaId: result.deletedAgendaId,
      deletedChatId: result.deletedChatId,
    });
  } catch (error: any) {
    console.error("Error resetting agenda and conversation:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

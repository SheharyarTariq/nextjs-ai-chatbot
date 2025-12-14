import { auth } from "@/app/(auth)/auth";
import { getAgendaByUserId } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const agenda = await getAgendaByUserId({ userId: session.user.id });

    if (!agenda) {
      return NextResponse.json(
        { error: "No agenda found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agenda,
    });
  } catch (error: any) {
    console.error("Error fetching agenda:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}




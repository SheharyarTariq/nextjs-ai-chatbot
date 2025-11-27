import { auth } from "@/app/(auth)/auth";
import { getUserNotes, updateUserNotes } from "@/lib/db/queries";
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

    const notes = await getUserNotes({ userId: session.user.id });

    return NextResponse.json({
      success: true,
      notes: notes || "",
    });
  } catch (error: any) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notes } = body;

    if (typeof notes !== "string") {
      return NextResponse.json(
        { error: "Invalid request body. Notes must be a string" },
        { status: 400 }
      );
    }

    const [updatedUser] = await updateUserNotes({
      userId: session.user.id,
      notes,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notes saved successfully",
      notes: updatedUser.notes,
    });
  } catch (error: any) {
    console.error("Error saving notes:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

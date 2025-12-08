import { auth } from "@/app/(auth)/auth";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { prompt } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// GET the system prompt
export async function GET() {
    const session = await auth();

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const [systemPrompt] = await db
            .select()
            .from(prompt)
            .limit(1);

        if (!systemPrompt) {
            return NextResponse.json({ error: "System prompt not found" }, { status: 404 });
        }

        return NextResponse.json(systemPrompt);
    } catch (error) {
        console.error("Error fetching system prompt:", error);
        return NextResponse.json({ error: "Failed to fetch system prompt" }, { status: 500 });
    }
}

// POST create system prompt (only if doesn't exist)
export async function POST(request: Request) {
    const session = await auth();

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Check if system prompt already exists
        const [existingPrompt] = await db
            .select()
            .from(prompt)
            .limit(1);

        if (existingPrompt) {
            return NextResponse.json(
                { error: "System prompt already exists. Use PUT to update it." },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, content } = body;

        if (!content) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        const [newPrompt] = await db
            .insert(prompt)
            .values({
                name: name || "System Prompt",
                content,
                createdBy: session.user.id!,
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
            })
            .returning();

        revalidateTag("system-prompt");

        return NextResponse.json(newPrompt, { status: 201 });
    } catch (error) {
        console.error("Error creating system prompt:", error);
        return NextResponse.json({ error: "Failed to create system prompt" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await auth();

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, name, content } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing prompt ID" }, { status: 400 });
        }

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const [currentPrompt] = await db
            .select()
            .from(prompt)
            .where(eq(prompt.id, id));

        if (!currentPrompt) {
            return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
        }

        const [updatedPrompt] = await db
            .update(prompt)
            .set({
                name: name || "System Prompt",
                content,
                updatedAt: new Date(),
                version: currentPrompt.version + 1,
            })
            .where(eq(prompt.id, id))
            .returning();

        // Invalidate cache so the updated prompt is used immediately
        revalidateTag("system-prompt");

        return NextResponse.json(updatedPrompt);
    } catch (error) {
        console.error("Error updating system prompt:", error);
        return NextResponse.json({ error: "Failed to update system prompt" }, { status: 500 });
    }
}

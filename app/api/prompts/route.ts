import { auth } from "@/app/(auth)/auth";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { prompt } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function GET() {
	const session = await auth();

	if (!session || !session.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	if (session.user.role !== "admin") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	try {
		const prompts = await db
			.select()
			.from(prompt)
			.orderBy(desc(prompt.updatedAt));

		return NextResponse.json(prompts);
	} catch (error) {
		console.error("Error fetching prompts:", error);
		return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	const session = await auth();

	if (!session || !session.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	if (session.user.role !== "admin") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	try {
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
				{ error: "Missing required field: content" },
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
			})
			.returning();

		return NextResponse.json(newPrompt, { status: 201 });
	} catch (error) {
		console.error("Error creating prompt:", error);
		return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
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
				name: name || currentPrompt.name,
				content,
				updatedAt: new Date(),
				version: currentPrompt.version + 1,
			})
			.where(eq(prompt.id, id))
			.returning();

		return NextResponse.json(updatedPrompt);
	} catch (error) {
		console.error("Error updating prompt:", error);
		return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	const session = await auth();

	if (!session || !session.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	if (session.user.role !== "admin") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return NextResponse.json({ error: "Missing prompt ID" }, { status: 400 });
	}

	try {
		await db.delete(prompt).where(eq(prompt.id, id));
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting prompt:", error);
		return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 });
	}
}

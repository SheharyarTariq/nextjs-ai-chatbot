import { auth } from "@/app/(auth)/auth";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { book, embeddings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function GET() {
    const session = await auth();

    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin role if needed, or just allow all users to see their own uploads
    // For now, assuming all authenticated users can see their own uploads

    try {
        const books = await db
            .select()
            .from(book)
            .where(eq(book.userId, session.user.id!))
            .orderBy(desc(book.uploadDate));

        return Response.json(books);
    } catch (error) {
        console.error("Error fetching books:", error);
        return Response.json({ error: "Failed to fetch books" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
        return Response.json({ error: "Missing book ID" }, { status: 400 });
    }

    try {
        // Verify ownership
        const [existingBook] = await db
            .select()
            .from(book)
            .where(eq(book.id, id));

        if (!existingBook) {
            return Response.json({ error: "Book not found" }, { status: 404 });
        }

        if (existingBook.userId !== session.user.id) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete embeddings first (cascade should handle this, but good to be explicit or rely on cascade)
        // Since we set onDelete: 'cascade' in schema, deleting book should be enough.

        await db.delete(book).where(eq(book.id, id));

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error deleting book:", error);
        return Response.json({ error: "Failed to delete book" }, { status: 500 });
    }
}

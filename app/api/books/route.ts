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

    // Only admins can access books
    if (session.user.role !== "admin") {
        return Response.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    try {
        // Admins can see all books in the knowledge base
        const books = await db
            .select()
            .from(book)
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

    // Only admins can delete books
    if (session.user.role !== "admin") {
        return Response.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    if (!id) {
        return Response.json({ error: "Missing book ID" }, { status: 400 });
    }

    try {
        // Verify book exists
        const [existingBook] = await db
            .select()
            .from(book)
            .where(eq(book.id, id));

        if (!existingBook) {
            return Response.json({ error: "Book not found" }, { status: 404 });
        }

        // Delete embeddings associated with this book
        await db.delete(embeddings).where(eq(embeddings.bookId, id));
        
        // Delete the book
        await db.delete(book).where(eq(book.id, id));

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error deleting book:", error);
        return Response.json({ error: "Failed to delete book" }, { status: 500 });
    }
}

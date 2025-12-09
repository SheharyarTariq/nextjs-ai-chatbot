import { auth } from "@/app/(auth)/auth";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { book, embeddings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import mammoth from "mammoth";
import { createOpenAI } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

export const runtime = 'nodejs';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        const endIndex = Math.min(startIndex + chunkSize, text.length);
        chunks.push(text.slice(startIndex, endIndex));
        startIndex += chunkSize - overlap;
    }

    return chunks;
}

export async function POST(request: NextRequest) {
    const session = await auth();

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    const openai = createOpenAI({
        apiKey: apiKey,
    });



    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can upload books
    if (session.user.role !== "admin") {
        return Response.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    let newBookId: string | null = null;

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return Response.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        let textContent = "";

        // Extract text based on file type
        if (fileExtension === 'pdf') {
            // @ts-ignore
            const PDFParser = require("pdf2json");
            const pdfParser = new PDFParser(null, 1);

            textContent = await new Promise((resolve, reject) => {
                pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                    resolve(pdfParser.getRawTextContent());
                });
                pdfParser.parseBuffer(buffer);
            });
        } else if (fileExtension === 'docx') {
            const result = await mammoth.extractRawText({ buffer });
            textContent = result.value;
        } else if (fileExtension === 'txt') {
            textContent = buffer.toString('utf-8');
        } else {
            return Response.json({ error: "Unsupported file type" }, { status: 400 });
        }

        // Create book entry
        const [newBook] = await db
            .insert(book)
            .values({
                name: file.name,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                type: fileExtension || 'unknown',
                processingStatus: "processing",
                userId: session.user.id!,
                textContent: textContent, // Optional: store full text if needed, or just rely on chunks
            })
            .returning();

        newBookId = newBook.id;

        // Chunk text
        const chunks = chunkText(textContent);

        console.log(`Processing ${chunks.length} chunks for file: ${file.name}`);

        // Generate embeddings in batches to avoid token limits
        // OpenAI embedding API has limits: ~8,000 inputs or ~320,000 tokens per request
        // With 1000-char chunks (~250 tokens each), we batch 100 chunks = ~25,000 tokens
        const EMBEDDING_BATCH_SIZE = 100;
        const vectors: number[][] = [];

        try {
            for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
                const batchChunks = chunks.slice(i, Math.min(i + EMBEDDING_BATCH_SIZE, chunks.length));
                
                console.log(`Generating embeddings for batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}/${Math.ceil(chunks.length / EMBEDDING_BATCH_SIZE)} (${batchChunks.length} chunks)`);
                
                const { embeddings: batchVectors } = await embedMany({
                    model: openai.embedding('text-embedding-3-large'),
                    values: batchChunks,
                });
                
                vectors.push(...batchVectors);

                // Update progress in database
                await db
                    .update(book)
                    .set({
                        processedChunks: vectors.length,
                    })
                    .where(eq(book.id, newBook.id));
            }

            console.log(`Successfully generated ${vectors.length} embeddings`);
        } catch (embeddingError: any) {
            console.error("Error generating embeddings:", embeddingError);
            throw new Error(`Embedding generation failed: ${embeddingError.message}`);
        }

        // Save embeddings
        const embeddingValues = chunks.map((chunk, index) => ({
            bookId: newBook.id,
            chunkIndex: index,
            originalText: chunk,
            embedding: vectors[index], // pgvector expects array of numbers
            userId: session.user.id!,
        }));

        // Batch insert embeddings
        // Drizzle might have limits on batch size, so let's do it in chunks of 50
        const batchSize = 50;
        for (let i = 0; i < embeddingValues.length; i += batchSize) {
            const batch = embeddingValues.slice(i, i + batchSize);
            await db.insert(embeddings).values(batch);
        }

        // Update book status
        await db
            .update(book)
            .set({
                processingStatus: "completed",
                totalChunks: chunks.length,
                processedChunks: chunks.length,
            })
            .where(eq(book.id, newBook.id));

        return Response.json({ success: true, bookId: newBook.id });

    } catch (error: any) {
        console.error("Error processing book:", error);

        if (newBookId) {
            await db
                .update(book)
                .set({
                    processingStatus: "failed",
                })
                .where(eq(book.id, newBookId));
        }

        return Response.json({ error: error.message || "Failed to process book" }, { status: 500 });
    }
}

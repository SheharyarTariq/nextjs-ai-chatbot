CREATE TABLE IF NOT EXISTS "Book" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"uploadDate" timestamp DEFAULT now() NOT NULL,
	"size" varchar(32),
	"type" varchar(16) DEFAULT 'pdf' NOT NULL,
	"processingStatus" varchar DEFAULT 'queued' NOT NULL,
	"textContent" text,
	"totalChunks" integer,
	"processedChunks" integer,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"original_text" text NOT NULL,
	"embedding" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Book" ADD CONSTRAINT "Book_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_book_id_Book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."Book"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "notes";
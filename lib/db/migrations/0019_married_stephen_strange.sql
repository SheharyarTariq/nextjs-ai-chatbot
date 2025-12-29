ALTER TABLE "User" ADD COLUMN "country" varchar(30);--> statement-breakpoint
ALTER TABLE "Prompt" DROP COLUMN IF EXISTS "description";
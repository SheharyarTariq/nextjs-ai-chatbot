ALTER TABLE "Prompt" ALTER COLUMN "name" SET DEFAULT 'System Prompt';--> statement-breakpoint
ALTER TABLE "Prompt" DROP COLUMN IF EXISTS "type";--> statement-breakpoint
ALTER TABLE "Prompt" DROP COLUMN IF EXISTS "isActive";
ALTER TABLE "User" DROP COLUMN "dateOfBirth";--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "birthDay" integer;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "birthMonth" integer;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "birthYear" integer;

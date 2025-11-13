ALTER TABLE "User" ADD COLUMN "resetToken" varchar(255);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "resetTokenExpiry" timestamp;
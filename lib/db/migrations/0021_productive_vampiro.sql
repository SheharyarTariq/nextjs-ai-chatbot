ALTER TABLE "Event" ALTER COLUMN "dateTime" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN "date" varchar(20);--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN "time" varchar(10);
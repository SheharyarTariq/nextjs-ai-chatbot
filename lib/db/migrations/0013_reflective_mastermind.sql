CREATE TABLE IF NOT EXISTS "Agenda" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"chatId" uuid NOT NULL,
	"goal" text NOT NULL,
	"startDate" timestamp NOT NULL,
	"currentWeek" integer DEFAULT 1 NOT NULL,
	"totalWeeks" integer DEFAULT 12 NOT NULL,
	"trainingFrequency" integer,
	"injuries" text,
	"workType" varchar(50),
	"userData" jsonb,
	"weeklyData" jsonb,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

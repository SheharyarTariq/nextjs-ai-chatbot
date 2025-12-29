DO $$ BEGIN
 CREATE TYPE "public"."event_intensity" AS ENUM('High', 'Medium', 'Low');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_type" AS ENUM('Run', 'Yoga', 'Strength', 'Mobility', 'HIIT', 'Recovery', 'Others');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "Event" ALTER COLUMN "type" SET DATA TYPE event_type USING type::event_type;--> statement-breakpoint
ALTER TABLE "Event" ALTER COLUMN "intensity" SET DATA TYPE event_intensity USING intensity::event_intensity;
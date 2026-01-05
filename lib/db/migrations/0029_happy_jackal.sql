-- First, delete duplicate UserEvent records, keeping only the earliest joined
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY "userId", "eventId" ORDER BY "joinedAt" ASC) as rn
  FROM "UserEvent"
)
DELETE FROM "UserEvent"
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Then create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_event_idx" ON "UserEvent" USING btree ("userId","eventId");
ALTER TABLE "review_events"
  ADD COLUMN IF NOT EXISTS "duration_seconds" real,
  ADD COLUMN IF NOT EXISTS "ai_provider" text,
  ADD COLUMN IF NOT EXISTS "failure_reason" text;

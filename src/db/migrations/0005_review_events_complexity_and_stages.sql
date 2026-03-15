ALTER TABLE "review_events"
  ADD COLUMN IF NOT EXISTS "files_changed" integer,
  ADD COLUMN IF NOT EXISTS "lines_added" integer,
  ADD COLUMN IF NOT EXISTS "lines_removed" integer,
  ADD COLUMN IF NOT EXISTS "queued_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "diff_fetched_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "ai_started_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "comments_posted_at" timestamp with time zone;

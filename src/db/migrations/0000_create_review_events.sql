CREATE TABLE IF NOT EXISTS "review_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "provider" text NOT NULL,
  "repo_id" text NOT NULL,
  "repo_name" text NOT NULL,
  "mr_number" integer NOT NULL,
  "author_username" text,
  "status" text NOT NULL DEFAULT 'queued',
  "comments_posted_count" integer NOT NULL DEFAULT 0,
  "bullmq_job_id" text NOT NULL UNIQUE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

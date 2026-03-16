CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "provider" text NOT NULL,
  "event_type" text NOT NULL,
  "repo_name" text NOT NULL,
  "action" text,
  "accepted" boolean NOT NULL DEFAULT true,
  "queued" boolean NOT NULL DEFAULT false,
  "received_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "webhook_events_received_at_idx" ON "webhook_events" ("received_at" DESC);

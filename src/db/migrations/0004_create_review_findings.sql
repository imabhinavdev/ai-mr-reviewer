CREATE TABLE IF NOT EXISTS "review_findings" (
  "id" serial PRIMARY KEY NOT NULL,
  "review_event_id" integer NOT NULL REFERENCES "review_events"("id") ON DELETE CASCADE,
  "category" text NOT NULL,
  "severity" text NOT NULL,
  "count" integer NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS "review_findings_review_event_id_idx" ON "review_findings" ("review_event_id");
CREATE INDEX IF NOT EXISTS "review_findings_category_idx" ON "review_findings" ("category");

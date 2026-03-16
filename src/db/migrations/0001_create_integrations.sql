CREATE TABLE IF NOT EXISTS "integrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL UNIQUE,
  "configured" boolean NOT NULL DEFAULT false,
  "synced_at" timestamp with time zone NOT NULL DEFAULT now()
);

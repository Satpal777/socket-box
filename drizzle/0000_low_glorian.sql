CREATE TABLE IF NOT EXISTS "checkboxes" (
	"id" text PRIMARY KEY NOT NULL,
	"checked" integer DEFAULT 0 NOT NULL,
	"updated_by" integer DEFAULT 0 NOT NULL
);

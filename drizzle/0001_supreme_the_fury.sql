ALTER TABLE "checkboxes" ALTER COLUMN "updated_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "checkboxes" ALTER COLUMN "updated_by" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "checkboxes" ALTER COLUMN "updated_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "checkboxes" ADD COLUMN "updated_at" timestamp DEFAULT now();
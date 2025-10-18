ALTER TABLE "user_profiles" ADD COLUMN "location" varchar(255);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "tags" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "adminNotes" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "status" varchar(20) DEFAULT 'Active' NOT NULL;
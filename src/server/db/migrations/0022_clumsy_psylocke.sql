DROP TABLE "product_tags" CASCADE;--> statement-breakpoint
DROP TABLE "tags" CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" text[] DEFAULT '{}'::text[] NOT NULL;
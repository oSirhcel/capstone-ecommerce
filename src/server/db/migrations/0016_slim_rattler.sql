ALTER TABLE "stores" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_slug_unique" UNIQUE("slug");
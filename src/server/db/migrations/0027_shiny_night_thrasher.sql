ALTER TABLE "categories" ADD COLUMN "imageUrl" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "imageUrl" text NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "image";
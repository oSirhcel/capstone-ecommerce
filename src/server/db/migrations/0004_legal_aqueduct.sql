ALTER TABLE "products" ADD COLUMN "sku" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "compareAtPrice" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "costPerItem" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "trackQuantity" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "allowBackorders" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight" numeric(8, 3);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "length" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "width" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "height" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "seoTitle" varchar(60);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "seoDescription" varchar(160);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "slug" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "status" varchar(20) DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" text;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sku_unique" UNIQUE("sku");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_slug_unique" UNIQUE("slug");
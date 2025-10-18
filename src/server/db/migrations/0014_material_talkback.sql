ALTER TABLE "store_settings" ALTER COLUMN "taxRate" SET DEFAULT '0.10';--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "verifiedPurchase" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "abn" varchar(11);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "businessName" varchar(255);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "contactEmail" varchar(255);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "gstRegistered" boolean DEFAULT false NOT NULL;
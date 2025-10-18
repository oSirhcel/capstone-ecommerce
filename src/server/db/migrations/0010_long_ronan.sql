ALTER TABLE "store_customer_profiles" RENAME COLUMN "totalSpentCents" TO "totalSpent";--> statement-breakpoint
ALTER TABLE "store_customer_profiles" ALTER COLUMN "marketingOptIn" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "store_customer_profiles" ALTER COLUMN "marketingOptIn" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "store_customer_profiles" ALTER COLUMN "marketingOptIn" DROP NOT NULL;
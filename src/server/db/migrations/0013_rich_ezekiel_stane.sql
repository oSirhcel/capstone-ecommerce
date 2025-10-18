CREATE TYPE "public"."address_types" AS ENUM('shipping', 'billing');--> statement-breakpoint
ALTER TABLE "addresses" RENAME COLUMN "postalCode" TO "postcode";--> statement-breakpoint
ALTER TABLE "order_addresses" RENAME COLUMN "postalCode" TO "postcode";--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "type" SET DATA TYPE "public"."address_types" USING "type"::"public"."address_types";--> statement-breakpoint
ALTER TABLE "order_addresses" ALTER COLUMN "type" SET DATA TYPE "public"."address_types" USING "type"::"public"."address_types";
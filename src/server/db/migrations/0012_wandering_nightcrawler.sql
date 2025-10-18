CREATE TYPE "public"."order_status" AS ENUM('Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled', 'Refunded', 'On-hold', 'Failed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('Pending', 'Paid', 'Failed', 'Refunded');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'Pending'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paymentStatus" "payment_status" DEFAULT 'Pending' NOT NULL;
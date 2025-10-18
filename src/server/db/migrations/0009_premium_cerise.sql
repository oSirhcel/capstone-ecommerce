CREATE TABLE "store_customer_profiles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "store_customer_profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" varchar(255) NOT NULL,
	"storeId" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"adminNotes" text,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"firstOrderAt" timestamp,
	"lastOrderAt" timestamp,
	"orderCount" integer DEFAULT 0 NOT NULL,
	"totalSpentCents" integer DEFAULT 0 NOT NULL,
	"marketingOptIn" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_customer_profiles_user_store_unique" UNIQUE("userId","storeId")
);
--> statement-breakpoint
ALTER TABLE "store_customer_profiles" ADD CONSTRAINT "store_customer_profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_customer_profiles" ADD CONSTRAINT "store_customer_profiles_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_customer_profiles_store_idx" ON "store_customer_profiles" USING btree ("storeId");--> statement-breakpoint
CREATE INDEX "store_customer_profiles_user_idx" ON "store_customer_profiles" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "store_customer_profiles_status_idx" ON "store_customer_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "store_customer_profiles_last_order_idx" ON "store_customer_profiles" USING btree ("lastOrderAt");--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "dateOfBirth";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "location";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "adminNotes";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "status";
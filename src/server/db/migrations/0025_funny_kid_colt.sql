CREATE TABLE "store_payment_providers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "store_payment_providers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"storeId" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"stripeAccountId" varchar(255),
	"stripeAccountStatus" varchar(50),
	"isActive" boolean DEFAULT false NOT NULL,
	"connectedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_payment_provider_store_provider_unique" UNIQUE("storeId","provider")
);
--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD COLUMN "storeId" varchar(255);--> statement-breakpoint
ALTER TABLE "store_payment_providers" ADD CONSTRAINT "store_payment_providers_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_payment_providers_store_idx" ON "store_payment_providers" USING btree ("storeId");--> statement-breakpoint
CREATE INDEX "store_payment_providers_provider_idx" ON "store_payment_providers" USING btree ("provider");--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shipping_methods_store_idx" ON "shipping_methods" USING btree ("storeId");
CREATE TYPE "public"."cart_event_type" AS ENUM('view', 'add', 'remove', 'checkout');--> statement-breakpoint
CREATE TABLE "cart_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cart_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" varchar(255) NOT NULL,
	"productId" integer NOT NULL,
	"storeId" varchar(255) NOT NULL,
	"eventType" "cart_event_type" NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "page_views_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" varchar(255),
	"productId" integer,
	"storeId" varchar(255),
	"referrer" text,
	"userAgent" text,
	"ipAddress" varchar(45),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart_events" ADD CONSTRAINT "cart_events_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_events" ADD CONSTRAINT "cart_events_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_events" ADD CONSTRAINT "cart_events_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cart_events_store_id_idx" ON "cart_events" USING btree ("storeId");--> statement-breakpoint
CREATE INDEX "cart_events_created_at_idx" ON "cart_events" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "cart_events_user_id_idx" ON "cart_events" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "cart_events_event_type_idx" ON "cart_events" USING btree ("eventType");--> statement-breakpoint
CREATE INDEX "page_views_store_id_idx" ON "page_views" USING btree ("storeId");--> statement-breakpoint
CREATE INDEX "page_views_created_at_idx" ON "page_views" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "page_views_product_id_idx" ON "page_views" USING btree ("productId");
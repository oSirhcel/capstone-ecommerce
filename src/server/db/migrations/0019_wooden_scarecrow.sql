CREATE TABLE "risk_assessment_store_links" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "risk_assessment_store_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"risk_assessment_id" integer NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"store_order_id" integer,
	"store_subtotal" integer NOT NULL,
	"store_item_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ras_links_assessment_store_unique" UNIQUE("risk_assessment_id","store_id")
);
--> statement-breakpoint
ALTER TABLE "risk_assessment_store_links" ADD CONSTRAINT "risk_assessment_store_links_risk_assessment_id_zero_trust_assessments_id_fk" FOREIGN KEY ("risk_assessment_id") REFERENCES "public"."zero_trust_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessment_store_links" ADD CONSTRAINT "risk_assessment_store_links_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessment_store_links" ADD CONSTRAINT "risk_assessment_store_links_store_order_id_orders_id_fk" FOREIGN KEY ("store_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ras_links_assessment_idx" ON "risk_assessment_store_links" USING btree ("risk_assessment_id");--> statement-breakpoint
CREATE INDEX "ras_links_store_idx" ON "risk_assessment_store_links" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "ras_links_order_idx" ON "risk_assessment_store_links" USING btree ("store_order_id");
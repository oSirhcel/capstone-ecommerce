CREATE TYPE "public"."product_status" AS ENUM('Active', 'Inactive', 'Draft', 'Archived');--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'Draft'::"public"."product_status";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "status" SET DATA TYPE "public"."product_status" USING "status"::"public"."product_status";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "tags" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "tags" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "tags" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
CREATE INDEX "raol_assessment_idx" ON "risk_assessment_order_links" USING btree ("riskAssessmentId");--> statement-breakpoint
CREATE INDEX "raol_order_idx" ON "risk_assessment_order_links" USING btree ("orderId");--> statement-breakpoint
ALTER TABLE "risk_assessment_order_links" ADD CONSTRAINT "raol_assessment_order_unique" UNIQUE("riskAssessmentId","orderId");--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_slug_unique" UNIQUE("slug");
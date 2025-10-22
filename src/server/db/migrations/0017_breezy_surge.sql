ALTER TYPE "public"."order_status" ADD VALUE 'Denied';--> statement-breakpoint
CREATE TABLE "risk_assessment_order_links" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "risk_assessment_order_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"riskAssessmentId" integer NOT NULL,
	"orderId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "risk_assessment_order_links" ADD CONSTRAINT "risk_assessment_order_links_riskAssessmentId_zero_trust_assessments_id_fk" FOREIGN KEY ("riskAssessmentId") REFERENCES "public"."zero_trust_assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessment_order_links" ADD CONSTRAINT "risk_assessment_order_links_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
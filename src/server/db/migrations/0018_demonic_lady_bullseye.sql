ALTER TABLE "risk_assessment_order_links" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "risk_assessment_order_links" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "zero_trust_assessments" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "zero_trust_assessments" ALTER COLUMN "createdAt" SET DEFAULT now();
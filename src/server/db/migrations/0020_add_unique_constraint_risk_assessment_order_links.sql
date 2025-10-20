-- Migration: Add unique constraint to risk_assessment_order_links
-- This prevents duplicate entries when linking risk assessments to orders

-- Step 1: Remove duplicate entries (keep only the earliest entry for each combination)
DELETE FROM risk_assessment_order_links a
USING risk_assessment_order_links b
WHERE a.id > b.id
  AND a."riskAssessmentId" = b."riskAssessmentId"
  AND a."orderId" = b."orderId";

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE "risk_assessment_order_links" 
ADD CONSTRAINT "raol_assessment_order_unique" 
UNIQUE ("riskAssessmentId", "orderId");

-- Step 3: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "raol_assessment_idx" 
ON "risk_assessment_order_links" ("riskAssessmentId");

CREATE INDEX IF NOT EXISTS "raol_order_idx" 
ON "risk_assessment_order_links" ("orderId");


/**
 * Server-side API functions for Risk Justification CRUD operations
 * These functions use the database directly and should only be used in server components/API routes
 */

import { db } from "@/server/db";
import { zeroTrustAssessments } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { generateRiskJustification } from "@/lib/ai/risk-justification";
import type { RiskScore, RiskPayload } from "@/lib/zeroTrustMiddleware";

export interface RiskAssessmentWithJustification {
  id: number;
  userId: string | null;
  orderId: number | null;
  paymentIntentId: string | null;
  riskScore: number;
  decision: string;
  confidence: number;
  transactionAmount: number;
  currency: string;
  itemCount: number;
  storeCount: number;
  riskFactors: string | null;
  aiJustification: string | null;
  justificationGeneratedAt: Date | null;
  userAgent: string | null;
  ipAddress: string | null;
  shippingCountry: string | null;
  shippingState: string | null;
  shippingCity: string | null;
  createdAt: Date;
}

/**
 * Fetch a risk assessment by ID
 */
export async function getRiskAssessment(
  assessmentId: number
): Promise<RiskAssessmentWithJustification | null> {
  try {
    const [assessment] = await db
      .select()
      .from(zeroTrustAssessments)
      .where(eq(zeroTrustAssessments.id, assessmentId))
      .limit(1);

    return assessment ?? null;
  } catch (error) {
    console.error("Error fetching risk assessment:", error);
    throw new Error("Failed to fetch risk assessment");
  }
}


/**
 * Get existing justification or generate a new one if missing
 */
export async function getOrGenerateJustification(
  assessmentId: number
): Promise<string> {
  const assessment = await getRiskAssessment(assessmentId);
  
  if (!assessment) {
    throw new Error("Assessment not found");
  }

  // If justification already exists, return it
  if (assessment.aiJustification) {
    return assessment.aiJustification;
  }

  // Generate new justification
  return await generateAndSaveJustification(assessmentId);
}

/**
 * Update the AI justification for an assessment
 */
export async function updateAssessmentJustification(
  assessmentId: number,
  justification: string
): Promise<void> {
  const result = await db
    .update(zeroTrustAssessments)
    .set({
      aiJustification: justification,
      justificationGeneratedAt: new Date(),
    })
    .where(eq(zeroTrustAssessments.id, assessmentId));

  if (!result) {
    throw new Error("Failed to update assessment justification");
  }
}

/**
 * Generate or regenerate AI justification for an assessment
 * This can be called async after assessment is saved
 */
export async function generateAndSaveJustification(
  assessmentId: number
): Promise<string> {
  try {
    // Fetch the assessment
    const assessment = await getRiskAssessment(assessmentId);
    
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    // Parse risk factors from JSON
    const factors = assessment.riskFactors 
      ? (JSON.parse(assessment.riskFactors) as RiskScore["factors"])
      : [];

    // Build RiskScore object
    const riskScore: RiskScore = {
      score: assessment.riskScore,
      decision: assessment.decision as "allow" | "deny" | "warn",
      confidence: assessment.confidence / 100, // Convert back to 0-1
      factors: factors,
    };

    // Build minimal RiskPayload for AI generation
    // We reconstruct what we can from the stored assessment
    const riskPayload: RiskPayload = {
      userId: assessment.userId,
      userEmail: null,
      userType: null,
      totalAmount: assessment.transactionAmount,
      currency: assessment.currency,
      itemCount: assessment.itemCount,
      uniqueItemCount: assessment.itemCount, // Approximation
      items: [], // Not stored in assessment
      orderId: assessment.orderId ?? undefined,
      paymentMethodId: undefined,
      savePaymentMethod: false,
      userAgent: assessment.userAgent,
      ipAddress: assessment.ipAddress,
      timestamp: assessment.createdAt.toISOString(),
      uniqueStoreCount: assessment.storeCount,
      storeDistribution: [], // Not stored in assessment
    };

    // Generate AI justification
    const justification = await generateRiskJustification(riskScore, riskPayload);

    // Save to database
    await updateAssessmentJustification(assessmentId, justification);

    return justification;
  } catch (error) {
    console.error("Error generating and saving justification:", error);
    throw error;
  }
}

/**
 * Background task to generate justification with full context
 * Optimized version that uses provided riskScore and payload instead of reconstructing
 * Does not throw errors, just logs them
 */
export async function generateJustificationBackground(
  assessmentId: number,
  riskScore: RiskScore,
  riskPayload: RiskPayload
): Promise<void> {
  try {
    const justification = await generateRiskJustification(riskScore, riskPayload);
    await updateAssessmentJustification(assessmentId, justification);
    console.log(`✓ Generated AI justification for assessment ${assessmentId}`);
  } catch (error) {
    console.error(`✗ Failed to generate AI justification for assessment ${assessmentId}:`, error);
    // Don't throw - this is a background task
  }
}

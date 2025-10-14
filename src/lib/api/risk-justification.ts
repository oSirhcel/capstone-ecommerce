/**
 * API functions for Risk Justification CRUD operations
 * Handles fetching, creating, and regenerating AI-powered risk explanations
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

    return assessment || null;
  } catch (error) {
    console.error("Error fetching risk assessment:", error);
    throw new Error("Failed to fetch risk assessment");
  }
}

/**
 * Fetch a risk assessment by order ID
 */
export async function getRiskAssessmentByOrderId(
  orderId: number
): Promise<RiskAssessmentWithJustification | null> {
  try {
    const [assessment] = await db
      .select()
      .from(zeroTrustAssessments)
      .where(eq(zeroTrustAssessments.orderId, orderId))
      .orderBy(zeroTrustAssessments.createdAt)
      .limit(1);

    return assessment || null;
  } catch (error) {
    console.error("Error fetching risk assessment by order:", error);
    throw new Error("Failed to fetch risk assessment");
  }
}

/**
 * Get all risk assessments for a user
 */
export async function getRiskAssessmentsByUserId(
  userId: string
): Promise<RiskAssessmentWithJustification[]> {
  try {
    const assessments = await db
      .select()
      .from(zeroTrustAssessments)
      .where(eq(zeroTrustAssessments.userId, userId))
      .orderBy(zeroTrustAssessments.createdAt);

    return assessments;
  } catch (error) {
    console.error("Error fetching user risk assessments:", error);
    throw new Error("Failed to fetch user risk assessments");
  }
}

/**
 * Update an existing assessment with AI justification
 */
export async function updateAssessmentJustification(
  assessmentId: number,
  justification: string
): Promise<void> {
  try {
    await db
      .update(zeroTrustAssessments)
      .set({
        aiJustification: justification,
        justificationGeneratedAt: new Date(),
      })
      .where(eq(zeroTrustAssessments.id, assessmentId));
  } catch (error) {
    console.error("Error updating assessment justification:", error);
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
    // Generate AI justification with full context
    const justification = await generateRiskJustification(riskScore, riskPayload);
    
    // Save to database
    await updateAssessmentJustification(assessmentId, justification);
    
    console.log(`AI justification generated for assessment ${assessmentId}`);
  } catch (error) {
    console.error(`Failed to generate justification for assessment ${assessmentId}:`, error);
    // Don't throw - this is a background task
  }
}

/**
 * Background task to generate justification (legacy version)
 * Uses database reconstruction when riskScore and payload aren't available
 * Does not throw errors, just logs them
 */
export async function generateJustificationBackgroundLegacy(
  assessmentId: number
): Promise<void> {
  try {
    await generateAndSaveJustification(assessmentId);
    console.log(`AI justification generated for assessment ${assessmentId}`);
  } catch (error) {
    console.error(`Failed to generate justification for assessment ${assessmentId}:`, error);
    // Don't throw - this is a background task
  }
}

/**
 * Get justification for an assessment (generate if missing)
 */
export async function getOrGenerateJustification(
  assessmentId: number
): Promise<string> {
  const assessment = await getRiskAssessment(assessmentId);
  
  if (!assessment) {
    throw new Error("Assessment not found");
  }

  // If justification exists and is recent (< 7 days old), return it
  if (assessment.aiJustification && assessment.justificationGeneratedAt) {
    const daysSinceGeneration = 
      (Date.now() - assessment.justificationGeneratedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceGeneration < 7) {
      return assessment.aiJustification;
    }
  }

  // Otherwise, generate new justification
  return await generateAndSaveJustification(assessmentId);
}


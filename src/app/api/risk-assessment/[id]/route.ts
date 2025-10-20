/**
 * API Route: GET /api/risk-assessment/[id]
 * Fetch a risk assessment with its AI justification
 */

import { NextRequest, NextResponse } from "next/server";
import { getRiskAssessment } from "@/lib/api/risk-justification-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessmentId = parseInt(id, 10);

    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { error: "Invalid assessment ID" },
        { status: 400 }
      );
    }

    // Fetch the assessment
    const assessment = await getRiskAssessment(assessmentId);

    if (!assessment) {
      return NextResponse.json(
        { error: "Risk assessment not found" },
        { status: 404 }
      );
    }

    // Parse risk factors from JSON
    const riskFactors = assessment.riskFactors
      ? JSON.parse(assessment.riskFactors)
      : [];

    // Return assessment with parsed factors
    return NextResponse.json({
      id: assessment.id,
      userId: assessment.userId,
      orderId: assessment.orderId,
      paymentIntentId: assessment.paymentIntentId,
      riskScore: assessment.riskScore,
      decision: assessment.decision,
      confidence: assessment.confidence,
      transactionAmount: assessment.transactionAmount,
      currency: assessment.currency,
      itemCount: assessment.itemCount,
      storeCount: assessment.storeCount,
      riskFactors,
      aiJustification: assessment.aiJustification,
      justificationGeneratedAt: assessment.justificationGeneratedAt,
      userAgent: assessment.userAgent,
      ipAddress: assessment.ipAddress,
      shippingCountry: assessment.shippingCountry,
      shippingState: assessment.shippingState,
      shippingCity: assessment.shippingCity,
      createdAt: assessment.createdAt,
      userEmail: assessment.userEmail,
      userName: assessment.userName,
      userLastName: assessment.userLastName,
      username: assessment.username,
    });
  } catch (error) {
    console.error("Error fetching risk assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk assessment" },
      { status: 500 }
    );
  }
}


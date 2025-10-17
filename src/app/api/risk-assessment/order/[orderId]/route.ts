/**
 * API Route: GET /api/risk-assessment/order/[orderId]
 * Fetch risk assessment by order ID
 */

import { NextRequest, NextResponse } from "next/server";
import { getRiskAssessmentByOrderId } from "@/lib/api/risk-justification-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const orderIdNum = parseInt(orderId, 10);

    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Fetch the assessment by order ID
    const assessment = await getRiskAssessmentByOrderId(orderIdNum);

    if (!assessment) {
      return NextResponse.json(
        { error: "No risk assessment found for this order" },
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
    });
  } catch (error) {
    console.error("Error fetching risk assessment by order:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk assessment" },
      { status: 500 }
    );
  }
}


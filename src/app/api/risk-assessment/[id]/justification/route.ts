/**
 * API Routes: /api/risk-assessment/[id]/justification
 * GET - Fetch AI justification (generate if missing)
 * POST - Regenerate AI justification
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  getOrGenerateJustification,
  generateAndSaveJustification,
  getRiskAssessment,
} from "@/lib/api/risk-justification-server";

/**
 * GET /api/risk-assessment/[id]/justification
 * Fetch justification, generate if missing
 */
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

    // Get or generate justification
    const justification = await getOrGenerateJustification(assessmentId);

    return NextResponse.json({
      assessmentId,
      justification,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching justification:", error);
    
    if (error instanceof Error && error.message === "Assessment not found") {
      return NextResponse.json(
        { error: "Risk assessment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch justification" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/risk-assessment/[id]/justification
 * Force regenerate AI justification
 */
export async function POST(
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

    // Check if assessment exists
    const assessment = await getRiskAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json(
        { error: "Risk assessment not found" },
        { status: 404 }
      );
    }

    // Regenerate justification
    const justification = await generateAndSaveJustification(assessmentId);

    return NextResponse.json({
      assessmentId,
      justification,
      regenerated: true,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error regenerating justification:", error);
    return NextResponse.json(
      { error: "Failed to regenerate justification" },
      { status: 500 }
    );
  }
}


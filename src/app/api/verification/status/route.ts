/**
 * API Route: GET /api/verification/status?token=xxx
 * Get verification status
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVerificationStatus } from "@/lib/api/otp-verification";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const verification = await getVerificationStatus(token);

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    // Ensure user can only access their own verifications
    if (verification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to verification" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      status: verification.status,
      expiresAt: verification.expiresAt.toISOString(),
      riskScore: verification.riskScore,
      email: verification.userEmail,
    });
  } catch (error) {
    console.error("Error getting verification status:", error);
    
    return NextResponse.json(
      { error: "Failed to get verification status" },
      { status: 500 }
    );
  }
}


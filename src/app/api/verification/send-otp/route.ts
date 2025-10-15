/**
 * API Route: POST /api/verification/send-otp
 * Send OTP code for transaction verification
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOTPVerification } from "@/lib/api/otp-verification";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { paymentData, riskScore, riskFactors, transactionAmount } = body;

    if (!paymentData || typeof riskScore !== 'number' || !Array.isArray(riskFactors)) {
      return NextResponse.json(
        { error: "Invalid request. Missing required fields." },
        { status: 400 }
      );
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    // Create OTP verification and send email
    const { token, expiresAt } = await createOTPVerification({
      userId: session.user.id,
      userEmail,
      userName: session.user.name || undefined,
      paymentData,
      riskScore,
      riskFactors,
      transactionAmount,
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString(),
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to send verification code";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


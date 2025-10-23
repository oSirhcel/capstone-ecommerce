/**
 * API Route: POST /api/verification/resend-otp
 * Resend OTP code for transaction verification
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resendOTP } from "@/lib/api/otp-verification";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Resend OTP
    const result = await resendOTP(token);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.message || "Failed to resend code" 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Verification code resent successfully",
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to resend verification code";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


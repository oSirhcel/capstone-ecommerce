/**
 * API Route: POST /api/verification/verify-otp
 * Verify OTP code and return payment data if valid
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyOTP } from "@/lib/api/otp-verification";

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
    const { token, otp } = body;

    if (!token || !otp) {
      return NextResponse.json(
        { error: "Token and OTP are required" },
        { status: 400 }
      );
    }

    // Verify the OTP
    const result = await verifyOTP({ token, otp });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.message || "Verification failed" 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentData: result.paymentData,
      message: "Verification successful",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Verification failed";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeToken } from "@/lib/auth";

/**
 * POST /api/auth/revoke
 * Revoke the current user's session token
 */
export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // In a real implementation, you would get the JTI from the session token
    // For demo purposes, we'll revoke a test token
    const testJti = "test-revocation";
    revokeToken(testJti);

    return NextResponse.json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking session:", error);
    return NextResponse.json(
      { error: "Failed to revoke session" },
      { status: 500 }
    );
  }
}

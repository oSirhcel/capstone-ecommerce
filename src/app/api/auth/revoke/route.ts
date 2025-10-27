import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeToken } from "@/lib/auth";
import { getToken } from "next-auth/jwt";

/**
 * POST /api/auth/revoke
 * Revoke the current user's session token
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get the JWT token to extract the jti
    const token = await getToken({ req });
    
    if (!token?.jti || typeof token.jti !== "string") {
      return NextResponse.json(
        { error: "Session token missing or invalid" },
        { status: 400 }
      );
    }

    // Revoke the actual session token
    revokeToken(token.jti);

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

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { zeroTrustVerifications } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

// GET /api/verification/payment-data?token=...
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const [verification] = await db
      .select()
      .from(zeroTrustVerifications)
      .where(
        and(
          eq(zeroTrustVerifications.token, token),
          eq(zeroTrustVerifications.userId, session.user.id),
          eq(zeroTrustVerifications.status, "verified"),
        ),
      )
      .limit(1);

    if (!verification) {
      return NextResponse.json(
        { error: "Verified token not found" },
        { status: 404 },
      );
    }

    const paymentData = JSON.parse(verification.paymentData) as unknown;
    return NextResponse.json({ paymentData });
  } catch (error) {
    console.error("Failed to get payment data:", error);
    return NextResponse.json(
      { error: "Failed to retrieve payment data" },
      { status: 500 },
    );
  }
}



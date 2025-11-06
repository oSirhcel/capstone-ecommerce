import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { zeroTrustVerifications } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// POST /api/verification/update-payment-data
// Updates the paymentData of an existing verification with orderIds
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      token: string;
      orderIds: number[];
    };

    const { token, orderIds } = body;

    if (!token || !orderIds || orderIds.length === 0) {
      return NextResponse.json(
        { error: "Token and orderIds are required" },
        { status: 400 }
      );
    }

    // Fetch the verification record
    const [verification] = await db
      .select()
      .from(zeroTrustVerifications)
      .where(eq(zeroTrustVerifications.token, token))
      .limit(1);

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    // Verify the verification belongs to the current user
    if (verification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to verification" },
        { status: 403 }
      );
    }

    // Parse existing payment data and merge with orderIds
    let paymentData: Record<string, unknown>;
    try {
      paymentData = JSON.parse(verification.paymentData ?? '{}') as Record<string, unknown>;
    } catch (error) {
      console.error('Failed to parse existing payment data:', error);
      paymentData = {};
    }

    // Merge orderIds into payment data
    const updatedPaymentData = {
      ...paymentData,
      orderIds,
      orderId: orderIds[0], // Set primary order ID for backward compatibility
    };

    // Update the verification record
    await db
      .update(zeroTrustVerifications)
      .set({
        paymentData: JSON.stringify(updatedPaymentData),
        updatedAt: new Date(),
      })
      .where(eq(zeroTrustVerifications.token, token));

    console.log(`Updated verification ${token} with orderIds:`, orderIds);

    return NextResponse.json({
      success: true,
      message: "Verification payment data updated successfully",
      orderIds,
    });
  } catch (error) {
    console.error("Error updating verification payment data:", error);
    return NextResponse.json(
      {
        error: "Failed to update verification payment data",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}


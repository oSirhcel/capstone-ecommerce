import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { riskAssessmentOrderLinks } from "@/server/db/schema";
import { auth } from "@/lib/auth";

// POST /api/risk-assessments/link-orders
// Links a risk assessment to multiple orders (for multi-store transactions)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      riskAssessmentId: number;
      orderIds: number[];
    };

    const { riskAssessmentId, orderIds } = body;

    if (!riskAssessmentId || !orderIds || orderIds.length === 0) {
      return NextResponse.json(
        { error: "Risk assessment ID and order IDs are required" },
        { status: 400 }
      );
    }

    // Create links for each order
    const links = orderIds.map(orderId => ({
      riskAssessmentId,
      orderId,
    }));

    await db.insert(riskAssessmentOrderLinks).values(links);

    return NextResponse.json({
      success: true,
      message: `Linked risk assessment ${riskAssessmentId} to ${orderIds.length} orders`,
      linkedOrders: orderIds,
    });
  } catch (error) {
    console.error("Error linking risk assessment to orders:", error);
    return NextResponse.json(
      { error: "Failed to link risk assessment to orders" },
      { status: 500 }
    );
  }
}

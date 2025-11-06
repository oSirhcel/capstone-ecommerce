import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { eq } from "drizzle-orm";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

// GET /api/orders/stats - Get order statistics for overview cards
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;

    // Get all orders for the user to calculate accurate statistics
    const allOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, user.id));

    // Calculate statistics
    const totalOrders = allOrders.length;
    const completedOrders = allOrders.filter((o) => o.status === "Completed").length;
    const inTransitOrders = allOrders.filter((o) => 
      o.status === "Processing" || o.status === "Shipped"
    ).length;
    const pendingOrders = allOrders.filter((o) => o.status === "Pending").length;
    const cancelledOrders = allOrders.filter((o) => 
      o.status === "Cancelled" || o.status === "Failed" || o.status === "Denied"
    ).length;

    return NextResponse.json({
      totalOrders,
      completedOrders,
      inTransitOrders,
      pendingOrders,
      cancelledOrders,
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    return NextResponse.json(
      { error: "Failed to get order statistics" },
      { status: 500 }
    );
  }
}

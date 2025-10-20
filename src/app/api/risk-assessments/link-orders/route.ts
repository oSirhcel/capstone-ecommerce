import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { riskAssessmentOrderLinks, riskAssessmentStoreLinks, orders, orderItems } from "@/server/db/schema";
import { auth } from "@/lib/auth";
import { eq, inArray, sql } from "drizzle-orm";

// POST /api/risk-assessments/link-orders
// Links a risk assessment to multiple orders (for multi-store transactions)
// Also creates store links for efficient querying by store owners
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

    // Use onConflictDoNothing to handle duplicate calls (race condition)
    await db
      .insert(riskAssessmentOrderLinks)
      .values(links)
      .onConflictDoNothing();

    // Create store links for efficient querying
    // Fetch order details including store IDs and totals
    const orderDetails = await db
      .select({
        orderId: orders.id,
        storeId: orders.storeId,
        totalAmount: orders.totalAmount,
      })
      .from(orders)
      .where(inArray(orders.id, orderIds));

    // Get item counts per order
    const itemCounts = await db
      .select({
        orderId: orderItems.orderId,
        itemCount: sql<number>`count(*)::int`,
      })
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds))
      .groupBy(orderItems.orderId);

    const itemCountMap = new Map(itemCounts.map(ic => [ic.orderId, ic.itemCount]));

    // Create store links (one per unique store)
    const storeLinksMap = new Map<string, {
      storeId: string;
      storeOrderId: number;
      storeSubtotal: number;
      storeItemCount: number;
    }>();

    for (const order of orderDetails) {
      if (!order.storeId) continue;

      const existing = storeLinksMap.get(order.storeId);
      const itemCount = itemCountMap.get(order.orderId) || 0;

      if (existing) {
        // Accumulate if multiple orders from same store (edge case)
        existing.storeSubtotal += order.totalAmount;
        existing.storeItemCount += itemCount;
      } else {
        storeLinksMap.set(order.storeId, {
          storeId: order.storeId,
          storeOrderId: order.orderId,
          storeSubtotal: order.totalAmount,
          storeItemCount: itemCount,
        });
      }
    }

    // Insert store links
    if (storeLinksMap.size > 0) {
      const storeLinks = Array.from(storeLinksMap.values()).map(link => ({
        riskAssessmentId,
        storeId: link.storeId,
        storeOrderId: link.storeOrderId,
        storeSubtotal: link.storeSubtotal,
        storeItemCount: link.storeItemCount,
      }));

      // Use onConflictDoNothing to handle race conditions when called multiple times
      await db
        .insert(riskAssessmentStoreLinks)
        .values(storeLinks)
        .onConflictDoNothing();
    }

    return NextResponse.json({
      success: true,
      message: `Linked risk assessment ${riskAssessmentId} to ${orderIds.length} orders and ${storeLinksMap.size} stores`,
      linkedOrders: orderIds,
      linkedStores: Array.from(storeLinksMap.keys()),
    });
  } catch (error) {
    console.error("Error linking risk assessment to orders:", error);
    return NextResponse.json(
      { 
        error: "Failed to link risk assessment to orders",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

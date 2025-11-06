import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders, orderItems } from "@/server/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";

interface CheckExistingOrderRequest {
  totalAmount: number;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
}

// POST /api/orders/check-existing - Check if an order already exists with the same data
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const body = (await request.json()) as CheckExistingOrderRequest;
    const { totalAmount, items } = body;

    if (!totalAmount || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }

    // Get recent orders for this user (last 2 hours to catch more potential duplicates)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const recentOrders = await db
      .select({
        id: orders.id,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, user.id),
          eq(orders.totalAmount, totalAmount),
          gte(orders.createdAt, twoHoursAgo), // Check orders from the last 2 hours
        ),
      )
      .orderBy(desc(orders.createdAt))
      .limit(30); // Check up to 30 recent orders for better matching

    // For each recent order, check if the items match
    for (const order of recentOrders) {
      // Skip if order status is not pending (already processed)
      if (order.status !== "Pending") {
        continue;
      }

      // Get order items for this order
      const orderItemsData = await db
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          priceAtTime: orderItems.priceAtTime,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      // Check if items match (same products, quantities, and prices)
      const itemsMatch = items.every((item) => {
        const matchingOrderItem = orderItemsData.find(
          (orderItem) => orderItem.productId === item.productId,
        );

        if (!matchingOrderItem) {
          return false;
        }

        // Check quantity and price (price is in cents)
        const itemPriceInCents = Math.round(item.price * 100);
        return (
          matchingOrderItem.quantity === item.quantity &&
          matchingOrderItem.priceAtTime === itemPriceInCents
        );
      });

      // Also check that the number of items matches
      if (itemsMatch && orderItemsData.length === items.length) {
        console.log(
          `Found existing order ${order.id} with matching items for user ${user.id}`,
        );
        return NextResponse.json({
          existingOrderId: order.id,
          order: {
            id: order.id,
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
          },
        });
      }
    }

    // No matching order found
    return NextResponse.json({
      existingOrderId: null,
    });
  } catch (error) {
    console.error("Error checking for existing orders:", error);
    return NextResponse.json(
      { error: "Failed to check for existing orders" },
      { status: 500 },
    );
  }
}

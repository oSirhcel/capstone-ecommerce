import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders, orderItems, products } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

const CancelOrderSchema = z.object({
  reason: z
    .string()
    .min(1, "Cancellation reason is required")
    .max(500, "Reason is too long"),
});

// PUT /api/orders/[id]/cancel - Cancel a pending order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const { id } = await params;
    const orderId = parseInt(id);

    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Validate request body (reason is stored but not currently used)
    CancelOrderSchema.parse(await request.json());

    // Check if order exists and belongs to the user
    const [order] = await db
      .select({
        id: orders.id,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalAmount: orders.totalAmount,
      })
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order can be cancelled
    if (order.status !== "Pending") {
      return NextResponse.json(
        {
          error: "Order cannot be cancelled",
          details: `Orders with status '${order.status}' cannot be cancelled. Only pending orders can be cancelled.`,
        },
        { status: 400 },
      );
    }

    // Start transaction to cancel order and restore inventory
    await db.transaction(async (tx) => {
      try {
        // Update order status to cancelled
        await tx
          .update(orders)
          .set({
            status: "Cancelled",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));

        // Get order items to restore inventory
        const orderItemsList = await tx
          .select({
            productId: orderItems.productId,
            quantity: orderItems.quantity,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId));

        // Restore inventory for each item in the order
        for (const item of orderItemsList) {
          // Get current stock for the product
          const [currentProduct] = await tx
            .select({ stock: products.stock })
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (currentProduct) {
            const newStock = currentProduct.stock + item.quantity;

            // Restore stock for the product
            await tx
              .update(products)
              .set({
                stock: newStock,
                updatedAt: new Date(),
              })
              .where(eq(products.id, item.productId));
          }
        }
      } catch (txError) {
        console.error("Transaction error:", txError);
        throw txError;
      }
    });

    return NextResponse.json({
      message: "Order cancelled successfully",
      orderId: orderId,
      status: "Cancelled",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: z.treeifyError(error) },
        { status: 400 },
      );
    }

    console.error("Error cancelling order:", error);

    return NextResponse.json(
      {
        error: "Failed to cancel order. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

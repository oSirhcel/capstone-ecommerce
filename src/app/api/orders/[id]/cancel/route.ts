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
  reason: z.string().min(1, "Cancellation reason is required").max(500, "Reason is too long"),
});

// PUT /api/orders/[id]/cancel - Cancel a pending order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const body = await request.json();
    const { reason } = CancelOrderSchema.parse(body);

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
          details: `Orders with status '${order.status}' cannot be cancelled. Only pending orders can be cancelled.` 
        },
        { status: 400 }
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

        console.log("Order status updated to Cancelled");

        // Get order items to restore inventory
        const orderItemsList = await tx
          .select({
            productId: orderItems.productId,
            quantity: orderItems.quantity,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId));

        console.log("Found order items:", orderItemsList);

        // Restore inventory for each item in the order
        for (const item of orderItemsList) {
          console.log(`Restoring inventory for product ${item.productId}, quantity: ${item.quantity}`);
          
          // Get current stock for the product
          const [currentProduct] = await tx
            .select({ stock: products.stock })
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (currentProduct) {
            const newStock = currentProduct.stock + item.quantity;
            console.log(`Updating product ${item.productId} stock from ${currentProduct.stock} to ${newStock}`);
            
            // Restore stock for the product
            await tx
              .update(products)
              .set({
                stock: newStock,
                updatedAt: new Date(),
              })
              .where(eq(products.id, item.productId));
          } else {
            console.warn(`Product ${item.productId} not found, skipping inventory restoration`);
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
      console.error("Validation error in cancel order:", error.errors);
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error cancelling order:", error);
    console.error("Order ID:", orderId);
    console.error("User ID:", userId);
    
    return NextResponse.json(
      { 
        error: "Failed to cancel order. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

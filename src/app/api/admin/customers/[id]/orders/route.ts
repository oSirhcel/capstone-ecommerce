import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  orders,
  orderItems,
  paymentTransactions,
  stores,
} from "@/server/db/schema";
import { eq, desc, count, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ordersQuerySchema } from "@/lib/api/admin/customers";
import { formatOrderNumber } from "@/lib/utils/order-number";

/**
 * GET /api/admin/customers/[id]/orders
 * Get customer's order history with pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Check admin authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const storeId = searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 },
      );
    }

    const query = ordersQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
    });

    // Verify user owns the store
    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, storeId));

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (store.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have access to this store" },
        { status: 403 },
      );
    }

    // Verify customer has ordered from this store
    const [hasOrderedFromStore] = await db
      .select({ orderId: orders.id })
      .from(orders)
      .where(and(eq(orders.userId, id), eq(orders.storeId, storeId)))
      .limit(1);

    if (!hasOrderedFromStore) {
      return NextResponse.json(
        { error: "Customer not found for this store" },
        { status: 404 },
      );
    }

    const offset = (query.page - 1) * query.limit;

    // Get orders with item count
    const customerOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        itemCount: count(orderItems.id),
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.userId, id),
          eq(orders.storeId, storeId),
          query.status ? eq(orders.status, query.status) : undefined,
        ),
      )
      .groupBy(orders.id)
      .orderBy(desc(orders.createdAt))
      .limit(query.limit)
      .offset(offset);

    // Get payment status for each order
    const ordersWithPayments = await Promise.all(
      customerOrders.map(async (order) => {
        const [payment] = await db
          .select({ status: paymentTransactions.status })
          .from(paymentTransactions)
          .where(eq(paymentTransactions.orderId, order.id))
          .limit(1);

        return {
          id: order.id,
          orderNumber: formatOrderNumber(order.id),
          createdAt: order.createdAt.toISOString(),
          status: order.status,
          totalAmount: order.totalAmount,
          itemCount: order.itemCount,
          paymentStatus: payment?.status || "pending",
        };
      }),
    );

    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(orders)
      .where(
        and(
          eq(orders.userId, id),
          eq(orders.storeId, storeId),
          query.status ? eq(orders.status, query.status) : undefined,
        ),
      );

    return NextResponse.json({
      orders: ordersWithPayments,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

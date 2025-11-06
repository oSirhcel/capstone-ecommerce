import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders, stores, userProfiles, users } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const limit = Number(searchParams.get("limit") ?? "5");

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 },
      );
    }

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

    const recentOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: userProfiles.email,
        username: users.username,
      })
      .from(orders)
      .leftJoin(userProfiles, eq(orders.userId, userProfiles.userId))
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.storeId, storeId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    const formattedOrders = recentOrders.map((order) => {
      const customerName =
        order.firstName && order.lastName
          ? `${order.firstName} ${order.lastName}`
          : (order.email ?? order.username ?? "Unknown Customer");

      return {
        id: `#${order.id}`,
        customer: customerName,
        amount: `$${(order.totalAmount / 100).toFixed(2)}`,
        status: order.status.toLowerCase(),
        date: order.createdAt.toISOString().split("T")[0],
      };
    });

    return NextResponse.json({ orders: formattedOrders });
  } catch (error) {
    console.error("Admin dashboard recent orders GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch recent orders" },
      { status: 500 },
    );
  }
}

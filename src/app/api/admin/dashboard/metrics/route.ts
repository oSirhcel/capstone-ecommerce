import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders, products, stores } from "@/server/db/schema";
import { and, between, count, eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const period = searchParams.get("period") ?? "month";

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

    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;

    // Calculate date ranges based on period
    if (period === "month") {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (period === "year") {
      currentStart = new Date(now.getFullYear(), 0, 1);
      currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    } else {
      // Default to month
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    const currentWhere = [
      eq(orders.storeId, storeId),
      between(orders.createdAt, currentStart, currentEnd),
    ];
    const previousWhere = [
      eq(orders.storeId, storeId),
      between(orders.createdAt, previousStart, previousEnd),
    ];

    // Current period metrics
    const [currentMetrics] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        orders: count(orders.id),
        activeUsers: sql<number>`COUNT(DISTINCT ${orders.userId})`,
      })
      .from(orders)
      .where(and(...currentWhere));

    // Previous period metrics for comparison
    const [previousMetrics] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        orders: count(orders.id),
        activeUsers: sql<number>`COUNT(DISTINCT ${orders.userId})`,
      })
      .from(orders)
      .where(and(...previousWhere));

    // Total products count (all time for this store)
    const [productsCount] = await db
      .select({ count: count(products.id) })
      .from(products)
      .where(eq(products.storeId, storeId));

    const currentRevenue = Number(currentMetrics?.revenue ?? 0) / 100;
    const previousRevenue = Number(previousMetrics?.revenue ?? 0) / 100;
    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
          ? 100
          : 0;

    const currentOrders = Number(currentMetrics?.orders ?? 0);
    const previousOrders = Number(previousMetrics?.orders ?? 0);
    const ordersChange =
      previousOrders > 0
        ? ((currentOrders - previousOrders) / previousOrders) * 100
        : currentOrders > 0
          ? 100
          : 0;

    const currentActiveUsers = Number(currentMetrics?.activeUsers ?? 0);
    const previousActiveUsers = Number(previousMetrics?.activeUsers ?? 0);
    const activeUsersChange =
      previousActiveUsers > 0
        ? ((currentActiveUsers - previousActiveUsers) / previousActiveUsers) *
          100
        : currentActiveUsers > 0
          ? 100
          : 0;

    // Products change is compared to previous period products count
    const [previousProductsCount] = await db
      .select({ count: count(products.id) })
      .from(products)
      .where(
        and(
          eq(products.storeId, storeId),
          between(products.createdAt, previousStart, previousEnd),
        ),
      );

    const totalProducts = Number(productsCount?.count ?? 0);
    const previousProducts = Number(previousProductsCount?.count ?? 0);
    const productsChange =
      previousProducts > 0
        ? ((totalProducts - previousProducts) / previousProducts) * 100
        : totalProducts > 0
          ? 100
          : 0;

    return NextResponse.json({
      revenue: {
        value: currentRevenue.toFixed(2),
        change: revenueChange.toFixed(1),
        trend: revenueChange >= 0 ? "up" : "down",
      },
      activeUsers: {
        value: currentActiveUsers.toString(),
        change: activeUsersChange.toFixed(1),
        trend: activeUsersChange >= 0 ? "up" : "down",
      },
      totalProducts: {
        value: totalProducts.toString(),
        change: productsChange.toFixed(1),
        trend: productsChange >= 0 ? "up" : "down",
      },
      totalOrders: {
        value: currentOrders.toString(),
        change: ordersChange.toFixed(1),
        trend: ordersChange >= 0 ? "up" : "down",
      },
    });
  } catch (error) {
    console.error("Admin dashboard metrics GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 },
    );
  }
}

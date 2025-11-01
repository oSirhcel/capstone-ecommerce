import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  orders,
  stores,
  products,
  orderItems,
  pageViews,
} from "@/server/db/schema";
import { and, between, count, eq, sql, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const categoryId = searchParams.get("categoryId");

    // Get all stores owned by the user
    const userStores = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, session.user.id));

    if (userStores.length === 0) {
      return NextResponse.json({
        totalRevenue: { value: "0.00", change: "0.0", trend: "up" },
        conversionRate: { value: "0.00", change: "0.0", trend: "up" },
        avgOrderValue: { value: "0.00", change: "0.0", trend: "up" },
        customerLifetimeValue: { value: "0.00", change: "0.0", trend: "up" },
      });
    }

    const storeIds = userStores.map((s) => s.id);

    // Parse date range
    let startDate: Date;
    let endDate: Date;
    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Calculate previous period (same duration)
    const duration = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(previousEndDate.getTime() - duration);

    // Build where conditions
    const currentWhere = [
      inArray(orders.storeId, storeIds),
      between(orders.createdAt, startDate, endDate),
    ];

    const previousWhere = [
      inArray(orders.storeId, storeIds),
      between(orders.createdAt, previousStartDate, previousEndDate),
    ];

    // Add category filter if provided
    if (categoryId) {
      const productsInCategory = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.categoryId, Number(categoryId)));

      const productIds = productsInCategory.map((p) => p.id);
      if (productIds.length > 0) {
        const orderIdsWithCategory = await db
          .select({ orderId: orderItems.orderId })
          .from(orderItems)
          .where(inArray(orderItems.productId, productIds));

        const orderIds = orderIdsWithCategory.map((o) => o.orderId);
        if (orderIds.length > 0) {
          currentWhere.push(inArray(orders.id, orderIds));
          previousWhere.push(inArray(orders.id, orderIds));
        } else {
          // No orders in this category
          return NextResponse.json({
            totalRevenue: { value: "0.00", change: "0.0", trend: "up" },
            conversionRate: { value: "0.00", change: "0.0", trend: "up" },
            avgOrderValue: { value: "0.00", change: "0.0", trend: "up" },
            customerLifetimeValue: {
              value: "0.00",
              change: "0.0",
              trend: "up",
            },
          });
        }
      }
    }

    // Current period metrics
    const [currentMetrics] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        orderCount: count(orders.id),
        uniqueCustomers: sql<number>`COUNT(DISTINCT ${orders.userId})`,
      })
      .from(orders)
      .where(and(...currentWhere));

    // Previous period metrics
    const [previousMetrics] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        orderCount: count(orders.id),
        uniqueCustomers: sql<number>`COUNT(DISTINCT ${orders.userId})`,
      })
      .from(orders)
      .where(and(...previousWhere));

    // Get visits for conversion rate
    const visitsWhere = [
      inArray(pageViews.storeId, storeIds),
      between(pageViews.createdAt, startDate, endDate),
    ];
    if (categoryId) {
      const productsInCategory = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.categoryId, Number(categoryId)));
      const productIds = productsInCategory.map((p) => p.id);
      if (productIds.length > 0) {
        visitsWhere.push(inArray(pageViews.productId, productIds));
      }
    }

    const [visitsData] = await db
      .select({
        visits: count(pageViews.id),
      })
      .from(pageViews)
      .where(and(...visitsWhere));

    const [previousVisitsData] = await db
      .select({
        visits: count(pageViews.id),
      })
      .from(pageViews)
      .where(
        and(
          inArray(pageViews.storeId, storeIds),
          between(pageViews.createdAt, previousStartDate, previousEndDate),
        ),
      );

    const currentRevenue = Number(currentMetrics?.revenue ?? 0) / 100;
    const previousRevenue = Number(previousMetrics?.revenue ?? 0) / 100;
    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
          ? 100
          : 0;

    const currentOrders = Number(currentMetrics?.orderCount ?? 0);
    const previousOrders = Number(previousMetrics?.orderCount ?? 0);
    const ordersChange =
      previousOrders > 0
        ? ((currentOrders - previousOrders) / previousOrders) * 100
        : currentOrders > 0
          ? 100
          : 0;

    const avgOrderValue =
      currentOrders > 0 ? currentRevenue / currentOrders : 0;
    const previousAvgOrderValue =
      previousOrders > 0 ? previousRevenue / previousOrders : 0;
    const avgOrderValueChange =
      previousAvgOrderValue > 0
        ? ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) *
          100
        : avgOrderValue > 0
          ? 100
          : 0;

    const visits = Number(visitsData?.visits ?? 0);
    const purchases = currentOrders;
    const conversionRate = visits > 0 ? (purchases / visits) * 100 : 0;

    const previousVisits = Number(previousVisitsData?.visits ?? 0);
    const previousPurchases = previousOrders;
    const previousConversionRate =
      previousVisits > 0 ? (previousPurchases / previousVisits) * 100 : 0;
    const conversionRateChange =
      previousConversionRate > 0
        ? ((conversionRate - previousConversionRate) / previousConversionRate) *
          100
        : conversionRate > 0
          ? 100
          : 0;

    // Customer Lifetime Value = avg order value × avg orders per customer
    const uniqueCustomers = Number(currentMetrics?.uniqueCustomers ?? 0);
    const avgOrdersPerCustomer =
      uniqueCustomers > 0 ? currentOrders / uniqueCustomers : 0;
    const clv = avgOrderValue * avgOrdersPerCustomer;

    const previousUniqueCustomers = Number(
      previousMetrics?.uniqueCustomers ?? 0,
    );
    const previousAvgOrdersPerCustomer =
      previousUniqueCustomers > 0
        ? previousOrders / previousUniqueCustomers
        : 0;
    const previousClv = previousAvgOrderValue * previousAvgOrdersPerCustomer;
    const clvChange =
      previousClv > 0
        ? ((clv - previousClv) / previousClv) * 100
        : clv > 0
          ? 100
          : 0;

    return NextResponse.json({
      totalRevenue: {
        value: currentRevenue.toFixed(2),
        change: revenueChange.toFixed(1),
        trend: revenueChange >= 0 ? "up" : "down",
      },
      conversionRate: {
        value: conversionRate.toFixed(2),
        change: conversionRateChange.toFixed(1),
        trend: conversionRateChange >= 0 ? "up" : "down",
      },
      avgOrderValue: {
        value: avgOrderValue.toFixed(2),
        change: avgOrderValueChange.toFixed(1),
        trend: avgOrderValueChange >= 0 ? "up" : "down",
      },
      customerLifetimeValue: {
        value: clv.toFixed(2),
        change: clvChange.toFixed(1),
        trend: clvChange >= 0 ? "up" : "down",
      },
    });
  } catch (error) {
    console.error("Analytics metrics GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics metrics" },
      { status: 500 },
    );
  }
}

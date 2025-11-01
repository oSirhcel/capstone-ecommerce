import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders, stores, pageViews, cartEvents } from "@/server/db/schema";
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

    // Get all stores owned by the user
    const userStores = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, session.user.id));

    if (userStores.length === 0) {
      return NextResponse.json([
        { stage: "Visits", count: 0, percentage: 0 },
        { stage: "Product Views", count: 0, percentage: 0 },
        { stage: "Add to Cart", count: 0, percentage: 0 },
        { stage: "Checkout", count: 0, percentage: 0 },
        { stage: "Purchase", count: 0, percentage: 0 },
      ]);
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

    // Visits (all page views)
    const [visitsData] = await db
      .select({
        count: count(pageViews.id),
      })
      .from(pageViews)
      .where(
        and(
          inArray(pageViews.storeId, storeIds),
          between(pageViews.createdAt, startDate, endDate),
        ),
      );

    const visits = Number(visitsData?.count ?? 0);

    // Product Views (page views with productId)
    const [productViewsData] = await db
      .select({
        count: count(pageViews.id),
      })
      .from(pageViews)
      .where(
        and(
          inArray(pageViews.storeId, storeIds),
          between(pageViews.createdAt, startDate, endDate),
          sql`${pageViews.productId} IS NOT NULL`,
        ),
      );

    const productViews = Number(productViewsData?.count ?? 0);

    // Add to Cart events
    const [addToCartData] = await db
      .select({
        count: count(cartEvents.id),
      })
      .from(cartEvents)
      .where(
        and(
          inArray(cartEvents.storeId, storeIds),
          between(cartEvents.createdAt, startDate, endDate),
          eq(cartEvents.eventType, "add"),
        ),
      );

    const addToCart = Number(addToCartData?.count ?? 0);

    // Checkout events
    const [checkoutData] = await db
      .select({
        count: count(cartEvents.id),
      })
      .from(cartEvents)
      .where(
        and(
          inArray(cartEvents.storeId, storeIds),
          between(cartEvents.createdAt, startDate, endDate),
          eq(cartEvents.eventType, "checkout"),
        ),
      );

    const checkout = Number(checkoutData?.count ?? 0);

    // Purchases (completed orders)
    const [purchasesData] = await db
      .select({
        count: count(orders.id),
      })
      .from(orders)
      .where(
        and(
          inArray(orders.storeId, storeIds),
          between(orders.createdAt, startDate, endDate),
          eq(orders.status, "Completed"),
        ),
      );

    const purchases = Number(purchasesData?.count ?? 0);

    const stages = [
      { stage: "Visits", count: visits, percentage: 100 },
      {
        stage: "Product Views",
        count: productViews,
        percentage: visits > 0 ? (productViews / visits) * 100 : 0,
      },
      {
        stage: "Add to Cart",
        count: addToCart,
        percentage: visits > 0 ? (addToCart / visits) * 100 : 0,
      },
      {
        stage: "Checkout",
        count: checkout,
        percentage: visits > 0 ? (checkout / visits) * 100 : 0,
      },
      {
        stage: "Purchase",
        count: purchases,
        percentage: visits > 0 ? (purchases / visits) * 100 : 0,
      },
    ];

    return NextResponse.json(stages);
  } catch (error) {
    console.error("Analytics conversion GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch conversion funnel data" },
      { status: 500 },
    );
  }
}

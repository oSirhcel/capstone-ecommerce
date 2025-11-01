import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders, stores, orderItems, products } from "@/server/db/schema";
import { and, between, count, eq, sql, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year")
      ? Number(searchParams.get("year"))
      : new Date().getFullYear();

    // Get all stores owned by the user
    const userStores = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, session.user.id));

    if (userStores.length === 0) {
      return NextResponse.json([]);
    }

    const storeIds = userStores.map((s) => s.id);

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const revenueData = await db
      .select({
        month: sql<number>`EXTRACT(MONTH FROM ${orders.createdAt})`,
        revenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        orders: count(orders.id),
      })
      .from(orders)
      .where(
        and(
          inArray(orders.storeId, storeIds),
          between(orders.createdAt, startOfYear, endOfYear),
        ),
      )
      .groupBy(sql`EXTRACT(MONTH FROM ${orders.createdAt})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${orders.createdAt})`);

    // Calculate profit (revenue - cost)
    const profitData = await db
      .select({
        month: sql<number>`EXTRACT(MONTH FROM ${orders.createdAt})`,
        cost: sql<number>`COALESCE(SUM(${orderItems.quantity} * ${products.costPerItem}), 0)`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          inArray(orders.storeId, storeIds),
          between(orders.createdAt, startOfYear, endOfYear),
        ),
      )
      .groupBy(sql`EXTRACT(MONTH FROM ${orders.createdAt})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${orders.createdAt})`);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const profitMap = new Map(
      profitData.map((row) => [Number(row.month), Number(row.cost ?? 0) / 100]),
    );

    const revenueMap = new Map(
      revenueData.map((row) => [
        Number(row.month),
        {
          revenue: Number(row.revenue) / 100,
          orders: Number(row.orders),
        },
      ]),
    );

    const fullYearData = monthNames.map((name, index) => {
      const monthNum = index + 1;
      const revenueInfo = revenueMap.get(monthNum) ?? { revenue: 0, orders: 0 };
      const cost = profitMap.get(monthNum) ?? 0;
      return {
        month: name,
        revenue: revenueInfo.revenue,
        orders: revenueInfo.orders,
        profit: revenueInfo.revenue - cost,
      };
    });

    return NextResponse.json(fullYearData);
  } catch (error) {
    console.error("Analytics revenue GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 },
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  orders,
  stores,
  categories,
  products,
  orderItems,
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

    // Get all stores owned by the user
    const userStores = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, session.user.id));

    if (userStores.length === 0) {
      return NextResponse.json([]);
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

    // Get category performance for current period
    const categoryData = await db
      .select({
        categoryId: products.categoryId,
        categoryName: categories.name,
        sales: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        orders: count(orders.id),
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          inArray(orders.storeId, storeIds),
          between(orders.createdAt, startDate, endDate),
        ),
      )
      .groupBy(products.categoryId, categories.name)
      .orderBy(sql`SUM(${orders.totalAmount}) DESC`);

    // Get category performance for previous period
    const previousCategoryData = await db
      .select({
        categoryId: products.categoryId,
        categoryName: categories.name,
        sales: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          inArray(orders.storeId, storeIds),
          between(orders.createdAt, previousStartDate, previousEndDate),
        ),
      )
      .groupBy(products.categoryId, categories.name);

    const previousSalesMap = new Map(
      previousCategoryData.map((row) => [
        row.categoryId ?? 0,
        Number(row.sales) / 100,
      ]),
    );

    const result = categoryData.map((row) => {
      const currentSales = Number(row.sales) / 100;
      const previousSales = previousSalesMap.get(row.categoryId ?? 0) ?? 0;
      const growth =
        previousSales > 0
          ? ((currentSales - previousSales) / previousSales) * 100
          : currentSales > 0
            ? 100
            : 0;

      return {
        category: row.categoryName ?? "Uncategorized",
        sales: currentSales,
        orders: Number(row.orders),
        growth: Math.round(growth * 10) / 10,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analytics categories GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch category performance data" },
      { status: 500 },
    );
  }
}

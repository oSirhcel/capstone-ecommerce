import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders, stores } from "@/server/db/schema";
import { and, between, count, eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const year = searchParams.get("year")
      ? Number(searchParams.get("year"))
      : new Date().getFullYear();

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

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const salesData = await db
      .select({
        month: sql<number>`EXTRACT(MONTH FROM ${orders.createdAt})`,
        sales: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        orders: count(orders.id),
      })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
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

    // Create a map of month -> data
    const monthDataMap = new Map(
      salesData.map((row) => [
        Number(row.month),
        {
          sales: Number(row.sales) / 100,
          orders: Number(row.orders),
        },
      ]),
    );

    // Build full year array with all months
    const fullYearData = monthNames.map((name, index) => {
      const monthNum = index + 1;
      const data = monthDataMap.get(monthNum) ?? { sales: 0, orders: 0 };
      return {
        name,
        sales: data.sales,
        orders: data.orders,
      };
    });

    return NextResponse.json(fullYearData);
  } catch (error) {
    console.error("Admin dashboard sales GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch sales data" },
      { status: 500 },
    );
  }
}

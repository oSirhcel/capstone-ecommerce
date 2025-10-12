import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders, stores } from "@/server/db/schema";
import { and, between, count, eq, sql, sum } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

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
    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    if (store.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const where = [eq(orders.storeId, storeId)];
    if (dateFrom && dateTo)
      where.push(
        between(orders.createdAt, new Date(dateFrom), new Date(dateTo)),
      );

    const [{ totalOrders, revenueCents, avgOrderValueCents }] = await db
      .select({
        totalOrders: count(orders.id),
        revenueCents: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        avgOrderValueCents: sql<number>`COALESCE(AVG(${orders.totalAmount}), 0)`,
      })
      .from(orders)
      .where(and(...where));

    // Placeholder: active customers count requires distinct users who ordered in period
    const [{ activeCustomers }] = await db
      .select({
        activeCustomers: sql<number>`COUNT(DISTINCT ${orders.userId})`,
      })
      .from(orders)
      .where(and(...where));

    // Placeholder for period-over-period comparison values
    const stats = {
      totalOrders: Number(totalOrders ?? 0),
      revenue: (Number(revenueCents ?? 0) / 100).toFixed(2),
      averageOrderValue: (Number(avgOrderValueCents ?? 0) / 100).toFixed(2),
      activeCustomers: Number(activeCustomers ?? 0),
      changes: {
        totalOrders: 0,
        revenue: 0,
        averageOrderValue: 0,
        activeCustomers: 0,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin Orders stats GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}

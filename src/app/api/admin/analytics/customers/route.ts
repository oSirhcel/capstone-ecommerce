import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders, stores, users } from "@/server/db/schema";
import { and, between, count, eq, sql, inArray } from "drizzle-orm";

interface CustomerRFM {
  userId: string;
  recency: number; // days since last order
  frequency: number; // order count
  monetary: number; // total spent in cents
}

function segmentCustomer(rfm: CustomerRFM): string {
  const { recency, frequency, monetary } = rfm;

  // VIP: High RFM (top 20% in all metrics)
  if (recency <= 30 && frequency >= 5 && monetary >= 50000) {
    return "VIP Customers";
  }

  // Loyal: High frequency (5+ orders)
  if (frequency >= 5) {
    return "Loyal Customers";
  }

  // New: Recent first order (within 30 days)
  if (recency <= 30 && frequency === 1) {
    return "New Customers";
  }

  // At-Risk: Low recency (90+ days since last order)
  if (recency >= 90) {
    return "At-Risk";
  }

  // Regular: Everything else
  return "Regular Customers";
}

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
        { segment: "VIP Customers", count: 0, revenue: 0, avgOrder: 0 },
        { segment: "Loyal Customers", count: 0, revenue: 0, avgOrder: 0 },
        { segment: "Regular Customers", count: 0, revenue: 0, avgOrder: 0 },
        { segment: "New Customers", count: 0, revenue: 0, avgOrder: 0 },
        { segment: "At-Risk", count: 0, revenue: 0, avgOrder: 0 },
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
      // Default to last 12 months for RFM analysis
      const now = new Date();
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    }

    // Get customer RFM data
    const customerData = await db
      .select({
        userId: orders.userId,
        lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
        frequency: count(orders.id),
        monetary: sql<number>`SUM(${orders.totalAmount})`,
      })
      .from(orders)
      .where(
        and(
          inArray(orders.storeId, storeIds),
          between(orders.createdAt, startDate, endDate),
        ),
      )
      .groupBy(orders.userId);

    const now = new Date();
    const customers: CustomerRFM[] = customerData.map((row) => {
      const lastOrderDate = new Date(row.lastOrderDate);
      const recency = Math.floor(
        (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        userId: row.userId,
        recency,
        frequency: Number(row.frequency),
        monetary: Number(row.monetary),
      };
    });

    // Segment customers
    const segments = new Map<string, CustomerRFM[]>();
    customers.forEach((customer) => {
      const segment = segmentCustomer(customer);
      if (!segments.has(segment)) {
        segments.set(segment, []);
      }
      segments.get(segment)!.push(customer);
    });

    // Calculate segment metrics
    const result = Array.from(segments.entries()).map(
      ([segment, customers]) => {
        const totalRevenue = customers.reduce((sum, c) => sum + c.monetary, 0);
        const totalOrders = customers.reduce((sum, c) => sum + c.frequency, 0);
        const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders / 100 : 0;

        return {
          segment,
          count: customers.length,
          revenue: totalRevenue / 100,
          avgOrder: Math.round(avgOrder * 100) / 100,
        };
      },
    );

    // Ensure all segments are present
    const segmentNames = [
      "VIP Customers",
      "Loyal Customers",
      "Regular Customers",
      "New Customers",
      "At-Risk",
    ];
    const existingSegments = new Set(result.map((r) => r.segment));
    segmentNames.forEach((name) => {
      if (!existingSegments.has(name)) {
        result.push({ segment: name, count: 0, revenue: 0, avgOrder: 0 });
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analytics customers GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch customer segmentation data" },
      { status: 500 },
    );
  }
}

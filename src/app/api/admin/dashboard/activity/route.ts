import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders, products, stores, userProfiles } from "@/server/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const limit = Number(searchParams.get("limit") ?? "10");

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

    // Fetch recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        createdAt: orders.createdAt,
        type: sql<string>`'order'`.as("type"),
        target: sql<string>`CONCAT('#', ${orders.id})`.as("target"),
      })
      .from(orders)
      .where(eq(orders.storeId, storeId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    // Fetch recent product creations/updates
    const recentProducts = await db
      .select({
        id: products.id,
        userId: sql<string>`NULL`.as("userId"),
        createdAt: products.createdAt,
        type: sql<string>`'product'`.as("type"),
        target: products.name,
      })
      .from(products)
      .where(eq(products.storeId, storeId))
      .orderBy(desc(products.createdAt))
      .limit(limit);

    // Fetch recent payments (orders with paymentStatus = "Paid")
    const recentPayments = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        createdAt: orders.createdAt,
        type: sql<string>`'payment'`.as("type"),
        target:
          sql<string>`CONCAT('$', ROUND(${orders.totalAmount}::numeric / 100, 2))`.as(
            "target",
          ),
      })
      .from(orders)
      .where(and(eq(orders.storeId, storeId), eq(orders.paymentStatus, "Paid")))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    // Combine and sort all activities
    const allActivitiesRaw = [
      ...recentOrders.map((o) => ({
        ...o,
        action: "placed an order",
      })),
      ...recentProducts.map((p) => ({
        ...p,
        action: "created a new product",
      })),
      ...recentPayments.map((p) => ({
        ...p,
        action: "completed payment",
      })),
    ];

    // Deduplicate by creating a map with composite key (type-id)
    const activityMap = new Map<string, (typeof allActivitiesRaw)[0]>();

    for (const activity of allActivitiesRaw) {
      const key = `${activity.type}-${activity.id}`;
      // If payment activity exists, prefer it over order activity (more specific)
      if (!activityMap.has(key) || activity.type === "payment") {
        activityMap.set(key, activity);
      }
    }

    const allActivities = Array.from(activityMap.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    // Fetch user profiles for order activities
    const userIds: string[] = Array.from(
      new Set(
        allActivities
          .filter((a): a is typeof a & { userId: string } => !!a.userId)
          .map((a) => a.userId),
      ),
    );

    const userProfilesData =
      userIds.length > 0
        ? await db
            .select({
              userId: userProfiles.userId,
              firstName: userProfiles.firstName,
              lastName: userProfiles.lastName,
              email: userProfiles.email,
            })
            .from(userProfiles)
            .where(inArray(userProfiles.userId, userIds))
        : [];

    const userMap = new Map(
      userProfilesData.map((u) => [
        u.userId,
        `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ?? u.email,
      ]),
    );

    // Format activities with user names
    const activities = allActivities.map((activity) => {
      const userName = activity.userId
        ? (userMap.get(activity.userId) ?? "Unknown User")
        : "System";

      const timeAgo = formatTimeAgo(activity.createdAt);

      return {
        id: activity.id,
        user: userName,
        avatar: null,
        action: activity.action,
        target: activity.target,
        time: timeAgo,
        type: activity.type,
      };
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Admin dashboard activity GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch activity data" },
      { status: 500 },
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} ${diffInSeconds === 1 ? "second" : "seconds"} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
}

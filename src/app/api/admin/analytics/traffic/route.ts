import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { stores, pageViews } from "@/server/db/schema";
import { and, between, eq, inArray } from "drizzle-orm";

function categorizeReferrer(referrer: string | null): string {
  if (!referrer) return "Direct";

  const url = referrer.toLowerCase();

  // Check for social media domains
  if (
    url.includes("facebook") ||
    url.includes("twitter") ||
    url.includes("instagram") ||
    url.includes("linkedin") ||
    url.includes("pinterest") ||
    url.includes("youtube") ||
    url.includes("tiktok") ||
    url.includes("reddit")
  ) {
    return "Social Media";
  }

  // Check for email
  if (
    url.includes("mailto:") ||
    url.includes("email") ||
    url.includes("newsletter")
  ) {
    return "Email";
  }

  // Check for search engines
  if (
    url.includes("google") ||
    url.includes("bing") ||
    url.includes("yahoo") ||
    url.includes("duckduckgo") ||
    url.includes("search")
  ) {
    return "Organic Search";
  }

  // Everything else is referral
  return "Referral";
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
        { name: "Direct", value: 0, percentage: 0 },
        { name: "Organic Search", value: 0, percentage: 0 },
        { name: "Social Media", value: 0, percentage: 0 },
        { name: "Referral", value: 0, percentage: 0 },
        { name: "Email", value: 0, percentage: 0 },
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

    // Get all page views with referrers
    const pageViewsData = await db
      .select({
        referrer: pageViews.referrer,
      })
      .from(pageViews)
      .where(
        and(
          inArray(pageViews.storeId, storeIds),
          between(pageViews.createdAt, startDate, endDate),
        ),
      );

    // Categorize referrers
    const sourceCounts = new Map<string, number>();
    pageViewsData.forEach((pv) => {
      const category = categorizeReferrer(pv.referrer);
      sourceCounts.set(category, (sourceCounts.get(category) ?? 0) + 1);
    });

    const total = pageViewsData.length;
    const result = Array.from(sourceCounts.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }));

    // Ensure all categories are present
    const categories = [
      "Direct",
      "Organic Search",
      "Social Media",
      "Referral",
      "Email",
    ];
    const existingNames = new Set(result.map((r) => r.name));
    categories.forEach((cat) => {
      if (!existingNames.has(cat)) {
        result.push({ name: cat, value: 0, percentage: 0 });
      }
    });

    // Sort by value descending
    result.sort((a, b) => b.value - a.value);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analytics traffic GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch traffic sources data" },
      { status: 500 },
    );
  }
}

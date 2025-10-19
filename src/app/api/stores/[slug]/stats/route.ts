import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { stores, products, reviews } from "@/server/db/schema";
import { eq, and, sql, count, inArray } from "drizzle-orm";

// GET /api/stores/[id]/stats - Get store statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const storeData = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (storeData.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const store = storeData[0];

    // Get total products count
    const [totalProductsResult] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.storeId, store.id));

    const totalProducts = totalProductsResult?.count || 0;

    // Get active products count
    const [activeProductsResult] = await db
      .select({ count: count() })
      .from(products)
      .where(
        and(eq(products.storeId, store.id), eq(products.status, "Active")),
      );

    const activeProducts = activeProductsResult?.count || 0;

    // Get all product IDs for this store
    const storeProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.storeId, store.id));

    const productIds = storeProducts.map((p) => p.id);

    // Calculate average rating and total reviews from all store products
    let averageRating = 0;
    let totalReviews = 0;

    if (productIds.length > 0) {
      const [reviewStats] = await db
        .select({
          avgRating: sql<string>`avg(${reviews.rating})`,
          totalReviews: count(),
        })
        .from(reviews)
        .where(inArray(reviews.productId, productIds));

      averageRating = reviewStats?.avgRating
        ? Math.round(parseFloat(reviewStats.avgRating) * 10) / 10
        : 0;
      totalReviews = reviewStats?.totalReviews || 0;
    }

    return NextResponse.json({
      storeId: store.id,
      totalProducts,
      activeProducts,
      averageRating,
      totalReviews,
      memberSince: store.createdAt,
    });
  } catch (error) {
    console.error("Error fetching store stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch store stats" },
      { status: 500 },
    );
  }
}

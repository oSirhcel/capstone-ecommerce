import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { reviews, userProfiles, products, stores } from "@/server/db/schema";
import { eq, and, sql, desc, asc, count, inArray } from "drizzle-orm";

// GET /api/stores/[id]/reviews - Get aggregated reviews from all store products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const sort = searchParams.get("sort") ?? "newest";

    const offset = (page - 1) * limit;

    const storeData = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (storeData.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const store = storeData[0];

    // Get all product IDs for this store
    const storeProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.storeId, store.id));

    const productIds = storeProducts.map((p) => p.id);

    if (productIds.length === 0) {
      return NextResponse.json({
        reviews: [],
        stats: {
          average: 0,
          total: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Build sorting
    let orderBy;
    switch (sort) {
      case "oldest":
        orderBy = asc(reviews.createdAt);
        break;
      case "highest":
        orderBy = desc(reviews.rating);
        break;
      case "lowest":
        orderBy = asc(reviews.rating);
        break;
      case "newest":
      default:
        orderBy = desc(reviews.createdAt);
        break;
    }

    // Fetch reviews with user info
    const reviewsData = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        productId: reviews.productId,
        rating: reviews.rating,
        comment: reviews.comment,
        verifiedPurchase: reviews.verifiedPurchase,
        createdAt: reviews.createdAt,
        userName: userProfiles.firstName,
        userEmail: userProfiles.email,
        productName: products.name,
      })
      .from(reviews)
      .leftJoin(userProfiles, eq(reviews.userId, userProfiles.userId))
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(inArray(reviews.productId, productIds))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Calculate stats using Drizzle ORM built-in aggregate functions
    const [statsResult] = await db
      .select({
        average: sql<number>`ROUND(AVG(${reviews.rating})::numeric, 2)`.mapWith(
          Number,
        ),
        total: count().mapWith(Number),
      })
      .from(reviews)
      .where(inArray(reviews.productId, productIds));

    // Calculate rating distribution using separate optimized query
    const distributionResult = await db
      .select({
        rating: reviews.rating,
        count: count().mapWith(Number),
      })
      .from(reviews)
      .where(inArray(reviews.productId, productIds))
      .groupBy(reviews.rating);

    // Build distribution object from results (as percentages)
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
      1 | 2 | 3 | 4 | 5,
      number
    >;

    const totalReviews = statsResult?.total ?? 0;

    distributionResult.forEach(({ rating, count: ratingCount }) => {
      if (rating >= 1 && rating <= 5 && totalReviews > 0) {
        const percentage = Math.round((ratingCount / totalReviews) * 100);
        distribution[rating as keyof typeof distribution] = percentage;
      }
    });

    const stats = {
      average: statsResult?.average ?? 0,
      total: statsResult?.total ?? 0,
      distribution,
    };

    // Format reviews data
    const formattedReviews = reviewsData.map((review) => ({
      id: review.id,
      userId: review.userId,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      verifiedPurchase: review.verifiedPurchase,
      createdAt: review.createdAt,
      user: {
        name: review.userName ?? "Anonymous",
        email: review.userEmail ?? "",
      },
      product: {
        name: review.productName ?? "Unknown Product",
      },
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      stats: {
        average: stats.average,
        total: stats.total,
        distribution: stats.distribution,
      },
      pagination: {
        page,
        limit,
        total: stats.total,
        totalPages: Math.ceil(stats.total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching store reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch store reviews" },
      { status: 500 },
    );
  }
}

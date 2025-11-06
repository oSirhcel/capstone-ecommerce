import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { reviews, userProfiles, users } from "@/server/db/schema";
import { eq, and, sql, desc, asc, count } from "drizzle-orm";
import { z } from "zod";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

// GET /api/reviews - Fetch reviews for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const sort = searchParams.get("sort") ?? "newest";

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
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
        username: users.username,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        userEmail: userProfiles.email,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .leftJoin(userProfiles, eq(reviews.userId, userProfiles.userId))
      .where(eq(reviews.productId, productIdNum))
      .orderBy(orderBy);

    // Calculate stats using Drizzle ORM built-in aggregate functions
    const [statsResult] = await db
      .select({
        average: sql<number>`ROUND(AVG(${reviews.rating})::numeric, 2)`.mapWith(
          Number,
        ),
        total: count().mapWith(Number),
      })
      .from(reviews)
      .where(eq(reviews.productId, productIdNum));

    // Calculate rating distribution using separate optimized query
    const distributionResult = await db
      .select({
        rating: reviews.rating,
        count: count().mapWith(Number),
      })
      .from(reviews)
      .where(eq(reviews.productId, productIdNum))
      .groupBy(reviews.rating);

    // Build distribution object from results
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
      1 | 2 | 3 | 4 | 5,
      number
    >;
    distributionResult.forEach(({ rating, count: ratingCount }) => {
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution] = ratingCount;
      }
    });

    const stats = {
      average: statsResult?.average ?? 0,
      total: statsResult?.total ?? 0,
      distribution,
    };

    // Format reviews data
    const formattedReviews = reviewsData.map((review) => {
      // Create display name: prefer full name from profile, fallback to username
      let displayName = "Anonymous";
      if (review.firstName && review.lastName) {
        displayName = `${review.firstName} ${review.lastName}`;
      } else if (review.firstName) {
        displayName = review.firstName;
      } else if (review.username) {
        displayName = review.username;
      }

      return {
        id: review.id,
        userId: review.userId,
        productId: review.productId,
        rating: review.rating,
        comment: review.comment,
        verifiedPurchase: review.verifiedPurchase,
        createdAt: review.createdAt,
        user: {
          name: displayName,
          email: review.userEmail ?? "",
        },
      };
    });

    return NextResponse.json({
      reviews: formattedReviews,
      stats: {
        average: stats.average,
        total: stats.total,
        distribution: stats.distribution,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

// POST /api/reviews - Submit new review
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;

    const SubmitReviewSchema = z.object({
      productId: z.number().int().positive(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(1000).optional(),
    });

    const body = (await request.json()) as unknown;
    const parsed = SubmitReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { productId, rating, comment } = parsed.data;

    // Check if user already reviewed this product
    const existingReview = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.userId, user.id), eq(reviews.productId, productId)))
      .limit(1);

    if (existingReview.length > 0) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 },
      );
    }

    // Allow all logged-in users to submit reviews (no purchase requirement)
    // Create review
    const [newReview] = await db
      .insert(reviews)
      .values({
        userId: user.id,
        productId,
        rating,
        comment: comment ?? null,
        verifiedPurchase: false, // Set to false since no purchase verification
      })
      .returning();

    return NextResponse.json({
      success: true,
      review: {
        id: newReview.id,
        userId: newReview.userId,
        productId: newReview.productId,
        rating: newReview.rating,
        comment: newReview.comment,
        verifiedPurchase: newReview.verifiedPurchase,
        createdAt: newReview.createdAt,
      },
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 },
    );
  }
}

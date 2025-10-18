import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { reviews } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

// PUT /api/reviews/[id] - Edit review
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const reviewId = parseInt(params.id, 10);

    if (isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const UpdateReviewSchema = z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(1000).optional(),
    });

    const body = (await request.json()) as unknown;
    const parsed = UpdateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { rating, comment } = parsed.data;

    // Check if review exists and belongs to user
    const existingReview = await db
      .select({ userId: reviews.userId })
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (existingReview.length === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (existingReview[0].userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit your own reviews" },
        { status: 403 },
      );
    }

    // Update review
    const [updatedReview] = await db
      .update(reviews)
      .set({
        rating,
        comment: comment ?? null,
      })
      .where(eq(reviews.id, reviewId))
      .returning();

    return NextResponse.json({
      success: true,
      review: {
        id: updatedReview.id,
        userId: updatedReview.userId,
        productId: updatedReview.productId,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        verifiedPurchase: updatedReview.verifiedPurchase,
        createdAt: updatedReview.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 },
    );
  }
}

// DELETE /api/reviews/[id] - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const reviewId = parseInt(params.id, 10);

    if (isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    // Check if review exists and belongs to user
    const existingReview = await db
      .select({ userId: reviews.userId })
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (existingReview.length === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (existingReview[0].userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only delete your own reviews" },
        { status: 403 },
      );
    }

    // Delete review
    await db.delete(reviews).where(eq(reviews.id, reviewId));

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}

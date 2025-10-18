import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders, orderItems } from "@/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

// GET /api/reviews/can-review - Check if user can review a product
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          canReview: false,
          reason: "You must be logged in to review products",
        },
        { status: 401 },
      );
    }

    const user = session.user as SessionUser;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { canReview: false, reason: "Product ID is required" },
        { status: 400 },
      );
    }

    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) {
      return NextResponse.json(
        { canReview: false, reason: "Invalid product ID" },
        { status: 400 },
      );
    }

    // Check if user has purchased this product
    // Allow reviews for orders that have been paid (Processing, Shipped, or Completed)
    const hasPurchased = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.userId, user.id),
          eq(orderItems.productId, productIdNum),
          inArray(orders.status, ["Processing", "Shipped", "Completed"]),
        ),
      )
      .limit(1);

    if (hasPurchased.length === 0) {
      return NextResponse.json({
        canReview: false,
        reason: "You must purchase this product before you can review it",
      });
    }

    return NextResponse.json({
      canReview: true,
    });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return NextResponse.json(
      { canReview: false, reason: "Failed to check review eligibility" },
      { status: 500 },
    );
  }
}

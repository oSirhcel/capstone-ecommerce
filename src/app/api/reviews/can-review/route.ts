import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { orders, orderItems } from "@/server/db/schema";
import { eq, and, inArray, or } from "drizzle-orm";

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

    // Allow all logged-in users to review products (no purchase requirement)
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

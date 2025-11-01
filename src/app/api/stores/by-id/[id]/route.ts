import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { stores } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET /api/stores/by-id/[id] - Get store by ID (for admin use)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const storeData = await db
      .select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);

    if (storeData.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const store = storeData[0];

    // Verify ownership
    if (store.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have access to this store" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      id: store.id,
      name: store.name,
      slug: store.slug,
      imageUrl: store.imageUrl,
      description: store.description,
      ownerId: store.ownerId,
      createdAt: store.createdAt,
    });
  } catch (error) {
    console.error("Error fetching store by ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch store" },
      { status: 500 },
    );
  }
}

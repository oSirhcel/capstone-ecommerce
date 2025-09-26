import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { stores, products } from "@/server/db/schema";
import { eq, count } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  userType?: string;
}

// GET /api/stores/[id] - Get a specific store by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get store information
    const storeData = await db
      .select({
        id: stores.id,
        name: stores.name,
        description: stores.description,
        ownerId: stores.ownerId,
        createdAt: stores.createdAt,
      })
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);

    if (storeData.length === 0) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Get product count for this store
    const [productCountResult] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.storeId, id));

    const store = {
      ...storeData[0],
      productCount: productCountResult?.count || 0,
    };

    return NextResponse.json(store);
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Failed to fetch store" },
      { status: 500 }
    );
  }
}

// PUT /api/stores/[id] - Update a store
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!(session?.user as SessionUser)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session?.user as SessionUser)?.id;
    const body = await request.json();
    
    const { name, description } = body;

    // Check if store exists and user owns it
    const existingStore = await db
      .select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);

    if (existingStore.length === 0) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    if (existingStore[0].ownerId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own store" },
        { status: 403 }
      );
    }

    // Validate inputs
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Store name cannot be empty" },
        { status: 400 }
      );
    }

    // Update the store
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    const [updatedStore] = await db
      .update(stores)
      .set(updateData)
      .where(eq(stores.id, id))
      .returning();

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error("Error updating store:", error);
    return NextResponse.json(
      { error: "Failed to update store" },
      { status: 500 }
    );
  }
}

// DELETE /api/stores/[id] - Delete a store
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!(session?.user as SessionUser)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session?.user as SessionUser)?.id;

    // Check if store exists and user owns it
    const existingStore = await db
      .select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);

    if (existingStore.length === 0) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    if (existingStore[0].ownerId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own store" },
        { status: 403 }
      );
    }

    // Check if store has products
    const [productCount] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.storeId, id));

    if (productCount.count > 0) {
      return NextResponse.json(
        { error: "Cannot delete store with existing products. Please remove all products first." },
        { status: 400 }
      );
    }

    // Delete the store
    await db
      .delete(stores)
      .where(eq(stores.id, id));

    return NextResponse.json({ message: "Store deleted successfully" });
  } catch (error) {
    console.error("Error deleting store:", error);
    return NextResponse.json(
      { error: "Failed to delete store" },
      { status: 500 }
    );
  }
}

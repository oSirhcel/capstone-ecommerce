import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { stores, products } from "@/server/db/schema";
import { eq, desc, asc, count, ilike } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  userType?: string;
}

// GET /api/stores - Get all stores with optional filtering and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    const offset = (page - 1) * limit;

    // Build the base query with conditional WHERE
    const whereCondition = search && search.trim() 
      ? ilike(stores.name, `%${search.trim()}%`)
      : undefined;

    // Get stores with pagination
    const baseStoresQuery = db
      .select({
        id: stores.id,
        name: stores.name,
        description: stores.description,
        ownerId: stores.ownerId,
        createdAt: stores.createdAt,
      })
      .from(stores);

    const storesData = whereCondition
      ? await baseStoresQuery
          .where(whereCondition)
          .orderBy(asc(stores.name))
          .limit(limit)
          .offset(offset)
      : await baseStoresQuery
          .orderBy(asc(stores.name))
          .limit(limit)
          .offset(offset);

    // Get product count for each store
    const storesWithProductCount = await Promise.all(
      storesData.map(async (store) => {
        const [productCountResult] = await db
          .select({ count: count() })
          .from(products)
          .where(eq(products.storeId, store.id));

        return {
          ...store,
          productCount: productCountResult?.count || 0,
        };
      })
    );

    // Get total count for pagination (with search filter if applied)
    const baseTotalQuery = db
      .select({ count: count() })
      .from(stores);

    const [totalResult] = whereCondition
      ? await baseTotalQuery.where(whereCondition)
      : await baseTotalQuery;
    const total = totalResult?.count || 0;

    return NextResponse.json({
      stores: storesWithProductCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}

// POST /api/stores - Create a new store
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(session?.user as SessionUser)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session?.user as SessionUser)?.id;
    const body = await request.json();
    
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Store name is required" },
        { status: 400 }
      );
    }

    // Check if user already has a store (assuming one store per user for now)
    const existingStore = await db
      .select()
      .from(stores)
      .where(eq(stores.ownerId, userId!))
      .limit(1);

    if (existingStore.length > 0) {
      return NextResponse.json(
        { error: "You already have a store" },
        { status: 400 }
      );
    }

    // Create the store
    const [newStore] = await db
      .insert(stores)
      .values({
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: userId!,
      })
      .returning();

    return NextResponse.json(newStore, { status: 201 });
  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json(
      { error: "Failed to create store" },
      { status: 500 }
    );
  }
}

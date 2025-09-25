import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { stores, products } from "@/server/db/schema";
import { eq, desc, asc, count, ilike } from "drizzle-orm";

// GET /api/stores - Get all stores with optional filtering and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    const offset = (page - 1) * limit;

    // Build the base query
    let storesQuery = db
      .select({
        id: stores.id,
        name: stores.name,
        description: stores.description,
        ownerId: stores.ownerId,
        createdAt: stores.createdAt,
      })
      .from(stores);

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      storesQuery = storesQuery.where(
        ilike(stores.name, searchTerm)
      );
    }

    // Get stores with pagination
    const storesData = await storesQuery
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
    let totalQuery = db
      .select({ count: count() })
      .from(stores);

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      totalQuery = totalQuery.where(
        ilike(stores.name, searchTerm)
      );
    }

    const [totalResult] = await totalQuery;
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

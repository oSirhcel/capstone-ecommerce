import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { stores, products, reviews } from "@/server/db/schema";
import { eq, asc, count, ilike, sql, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";

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
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") ?? "name";

    // Build the base query with conditional WHERE
    const whereCondition = search?.trim()
      ? ilike(stores.name, `%${search.trim()}%`)
      : undefined;

    // For rating-based sorting, we need to fetch all stores first, calculate ratings, then sort
    // Otherwise, we can paginate directly from the database
    const shouldSortByRating = sort === "rating-high";

    // Get stores - fetch all stores if sorting by rating to ensure we get the top-rated ones
    // For non-rating sorts, use normal pagination
    const offset = (page - 1) * limit;

    const baseStoresQuery = db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        description: stores.description,
        ownerId: stores.ownerId,
        createdAt: stores.createdAt,
      })
      .from(stores);

    const storesData = whereCondition
      ? await baseStoresQuery
          .where(whereCondition)
          .orderBy(sort === "name" ? asc(stores.name) : asc(stores.createdAt))
          .limit(shouldSortByRating ? 500 : limit)
          .offset(shouldSortByRating ? 0 : offset)
      : await baseStoresQuery
          .orderBy(sort === "name" ? asc(stores.name) : asc(stores.createdAt))
          .limit(shouldSortByRating ? 500 : limit)
          .offset(shouldSortByRating ? 0 : offset);

    // Get product count and average rating for each store
    const storesWithProductCount = await Promise.all(
      storesData.map(async (store) => {
        // Get product IDs for this store (reuse for both count and rating)
        const storeProducts = await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.storeId, store.id));

        const productIds = storeProducts.map((p) => p.id);
        const productCount = productIds.length;

        // Calculate average rating from reviews
        let averageRating = 0;
        if (productIds.length > 0) {
          const [reviewStats] = await db
            .select({
              avgRating: sql<string>`avg(${reviews.rating})`,
            })
            .from(reviews)
            .where(inArray(reviews.productId, productIds));

          averageRating = reviewStats?.avgRating
            ? Math.round(parseFloat(reviewStats.avgRating) * 10) / 10
            : 0;
        }

        return {
          ...store,
          productCount,
          averageRating,
        };
      }),
    );

    // Sort by rating if needed
    let sortedStores = storesWithProductCount;
    if (shouldSortByRating) {
      sortedStores = storesWithProductCount.sort(
        (a, b) => b.averageRating - a.averageRating,
      );
      // Apply pagination after sorting
      sortedStores = sortedStores.slice(offset, offset + limit);
    }

    // Get total count for pagination (with search filter if applied)
    const baseTotalQuery = db.select({ count: count() }).from(stores);

    const [totalResult] = whereCondition
      ? await baseTotalQuery.where(whereCondition)
      : await baseTotalQuery;
    const total = totalResult?.count || 0;

    return NextResponse.json({
      stores: sortedStores,
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
      { status: 500 },
    );
  }
}

// POST /api/stores - Create a new store
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!(session?.user as SessionUser)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session?.user as SessionUser)?.id;
    const body = (await request.json()) as {
      name: string;
      description: string;
      slug: string;
    };

    const { name, description, slug } = body ?? {};

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Store name is required" },
        { status: 400 },
      );
    }

    if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
      return NextResponse.json(
        { error: "Store slug is required" },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9-]{3,50}$/.test(slug)) {
      return NextResponse.json(
        { error: "Invalid slug format" },
        { status: 400 },
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
        { status: 400 },
      );
    }

    // Create the store
    const [newStore] = await db
      .insert(stores)
      .values({
        id: crypto.randomUUID(),
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        ownerId: userId!,
      })
      .returning();

    return NextResponse.json(newStore, { status: 201 });
  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json(
      { error: "Failed to create store" },
      { status: 500 },
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { stores, products, reviews } from "@/server/db/schema";
import {
  eq,
  asc,
  desc,
  ilike,
  sql,
  inArray,
  and,
  isNotNull,
} from "drizzle-orm";
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
    const limit = parseInt(searchParams.get("limit") ?? "6");
    const search = searchParams.get("search");
    const categoryId = searchParams.get("category")
      ? parseInt(searchParams.get("category")!)
      : null;
    const sort = searchParams.get("sort") ?? "name";

    // Build conditions for filtering
    const conditions = [];
    if (search?.trim()) {
      conditions.push(ilike(stores.name, `%${search.trim()}%`));
    }
    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (page - 1) * limit;
    const shouldSortByRating = sort === "rating-high";
    const shouldSortByProducts = sort === "products-high";

    // Build WHERE conditions including category filter
    const whereConditions = [];
    if (whereCondition) {
      whereConditions.push(whereCondition);
    }

    // Get category store IDs once if category filter is applied
    let categoryStoreIds: string[] = [];
    if (categoryId) {
      const categoryStoreIdsResult = await db
        .selectDistinct({ storeId: products.storeId })
        .from(products)
        .where(
          and(
            eq(products.categoryId, categoryId),
            isNotNull(products.categoryId),
          ),
        );

      categoryStoreIds = categoryStoreIdsResult.map((p) => p.storeId);
      if (categoryStoreIds.length === 0) {
        // No stores have products in this category
        return NextResponse.json({
          stores: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      whereConditions.push(inArray(stores.id, categoryStoreIds));
    }

    const finalWhereCondition =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Build query with conditional WHERE
    const queryBuilder = db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        imageUrl: stores.imageUrl,
        description: stores.description,
        ownerId: stores.ownerId,
        createdAt: stores.createdAt,
        productCount: sql<number>`COUNT(DISTINCT ${products.id})`.mapWith(
          Number,
        ),
        averageRating:
          sql<number>`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`.mapWith(
            Number,
          ),
      })
      .from(stores)
      .leftJoin(products, eq(products.storeId, stores.id))
      .leftJoin(reviews, eq(reviews.productId, products.id));

    const query = finalWhereCondition
      ? queryBuilder.where(finalWhereCondition).groupBy(stores.id)
      : queryBuilder.groupBy(stores.id);

    // Handle sorting - for rating/product sorting, we need to fetch all and sort
    // For name/newest, we can sort at database level
    let orderByClause;
    if (sort === "name") {
      orderByClause = asc(stores.name);
    } else if (sort === "newest") {
      orderByClause = desc(stores.createdAt);
    } else if (shouldSortByRating) {
      orderByClause = desc(
        sql`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`,
      );
    } else if (shouldSortByProducts) {
      orderByClause = desc(sql`COUNT(DISTINCT ${products.id})`);
    } else {
      orderByClause = asc(stores.name);
    }

    // For rating/product sorting, fetch all stores then paginate in memory
    // For other sorts, paginate at database level
    const fetchLimit =
      shouldSortByRating || shouldSortByProducts ? 5000 : limit;
    const fetchOffset = shouldSortByRating || shouldSortByProducts ? 0 : offset;

    const storesWithStats = await query
      .orderBy(orderByClause)
      .limit(fetchLimit)
      .offset(fetchOffset);

    // Sort in memory if needed (for rating/product sorting)
    let sortedStores = storesWithStats;
    if (shouldSortByRating || shouldSortByProducts) {
      if (shouldSortByRating) {
        sortedStores = storesWithStats.sort(
          (a, b) => b.averageRating - a.averageRating,
        );
      } else if (shouldSortByProducts) {
        sortedStores = storesWithStats.sort(
          (a, b) => b.productCount - a.productCount,
        );
      }
      // Apply pagination after sorting
      sortedStores = sortedStores.slice(offset, offset + limit);
    }

    // Get total count for pagination (with search and category filters if applied)
    let total = 0;
    if (categoryId && categoryStoreIds.length > 0) {
      // Reuse categoryStoreIds from above
      const categoryCountConditions = [inArray(stores.id, categoryStoreIds)];
      if (whereCondition) {
        categoryCountConditions.push(whereCondition);
      }
      const [totalResult] = await db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(stores)
        .where(and(...categoryCountConditions));
      total = totalResult?.count || 0;
    } else {
      const baseTotalQuery = db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(stores);
      const [totalResult] = whereCondition
        ? await baseTotalQuery.where(whereCondition)
        : await baseTotalQuery;
      total = totalResult?.count || 0;
    }

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
        imageUrl: "",
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

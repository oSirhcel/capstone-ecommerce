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
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("category")
      ? parseInt(searchParams.get("category")!)
      : null;
    const sort = searchParams.get("sort") ?? "name";

    const offset = (page - 1) * limit;
    const shouldSortByRating = sort === "rating-high";
    const shouldSortByProducts = sort === "products-high";

    // Get category store IDs if category filter is applied
    let categoryStoreIds: string[] | undefined;
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
    }

    // Build query with conditional WHERE using drizzle pattern
    const storesWithStats = await db
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
      .leftJoin(reviews, eq(reviews.productId, products.id))
      .where(
        and(
          search ? ilike(stores.name, `%${search}%`) : undefined,
          categoryStoreIds ? inArray(stores.id, categoryStoreIds) : undefined,
        ),
      )
      .groupBy(stores.id)
      .orderBy(
        sort === "name"
          ? asc(stores.name)
          : sort === "newest"
            ? desc(stores.createdAt)
            : shouldSortByRating
              ? desc(
                  sql`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`,
                )
              : shouldSortByProducts
                ? desc(sql`COUNT(DISTINCT ${products.id})`)
                : asc(stores.name),
      )
      .limit(shouldSortByRating || shouldSortByProducts ? 5000 : limit)
      .offset(shouldSortByRating || shouldSortByProducts ? 0 : offset);

    // Sort in memory if needed (for rating/product sorting)
    let sortedStores = storesWithStats;
    if (shouldSortByRating) {
      sortedStores = storesWithStats.sort(
        (a, b) => b.averageRating - a.averageRating,
      );
      sortedStores = sortedStores.slice(offset, offset + limit);
    } else if (shouldSortByProducts) {
      sortedStores = storesWithStats.sort(
        (a, b) => b.productCount - a.productCount,
      );
      sortedStores = sortedStores.slice(offset, offset + limit);
    }

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(stores)
      .where(
        and(
          search ? ilike(stores.name, `%${search}%`) : undefined,
          categoryStoreIds ? inArray(stores.id, categoryStoreIds) : undefined,
        ),
      );

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

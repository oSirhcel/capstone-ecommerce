import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  products,
  stores,
  categories,
  productImages,
  reviews,
} from "@/server/db/schema";
import { eq, and, desc, asc, ilike, or, count, sql } from "drizzle-orm";

// GET /api/stores/[id]/products - Get products for a specific store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") ?? "featured";

    const offset = (page - 1) * limit;

    const storeData = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (storeData.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const store = storeData[0];

    // Build WHERE conditions
    const whereConditions = [eq(products.storeId, store.id)];

    if (category && category !== "all") {
      // First, try to find the category by name
      const categoryData = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.name, category))
        .limit(1);

      if (categoryData.length > 0) {
        whereConditions.push(eq(products.categoryId, categoryData[0].id));
      } else {
        // If category not found, return empty results
        return NextResponse.json({
          products: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }
    }

    if (search) {
      whereConditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`),
        )!,
      );
    }

    // Build sorting
    let orderBy;
    switch (sort) {
      case "price-low":
        orderBy = asc(products.price);
        break;
      case "price-high":
        orderBy = desc(products.price);
        break;
      case "name":
        orderBy = asc(products.name);
        break;
      case "newest":
        orderBy = desc(products.createdAt);
        break;
      case "featured":
      default:
        orderBy = [desc(products.featured), desc(products.createdAt)];
        break;
    }

    // Build the main query
    const query = db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        description: products.description,
        price: products.price,
        slug: products.slug,
        stock: products.stock,
        status: products.status,
        featured: products.featured,
        storeId: products.storeId,
        categoryId: products.categoryId,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        store: {
          id: stores.id,
          name: stores.name,
        },
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(products)
      .leftJoin(stores, eq(products.storeId, stores.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...whereConditions));

    const productsData = await query
      .orderBy(...(Array.isArray(orderBy) ? orderBy : [orderBy]))
      .limit(limit)
      .offset(offset);

    // Get product images and review statistics for each product
    const productsWithImages = await Promise.all(
      productsData.map(async (product) => {
        const images = await db
          .select({
            id: productImages.id,
            imageUrl: productImages.imageUrl,
            altText: productImages.altText,
            isPrimary: productImages.isPrimary,
            displayOrder: productImages.displayOrder,
          })
          .from(productImages)
          .where(eq(productImages.productId, product.id))
          .orderBy(asc(productImages.displayOrder));

        // Get review statistics for this product
        const [reviewStats] = await db
          .select({
            averageRating:
              sql<number>`ROUND(AVG(${reviews.rating})::numeric, 2)`.mapWith(
                Number,
              ),
            reviewCount: count().mapWith(Number),
          })
          .from(reviews)
          .where(eq(reviews.productId, product.id));

        return {
          ...product,
          rating: reviewStats?.averageRating ?? 0,
          reviewCount: reviewStats?.reviewCount ?? 0,
          images:
            images.length > 0
              ? images
              : [
                  {
                    id: 0,
                    imageUrl: "/placeholder.svg",
                    altText: "Product image",
                    isPrimary: true,
                    displayOrder: 0,
                  },
                ],
        };
      }),
    );

    // Get total count for pagination
    const [totalCountResult] = await db
      .select({ count: count() })
      .from(products)
      .where(and(...whereConditions));

    const total = totalCountResult?.count || 0;

    return NextResponse.json({
      products: productsWithImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching store products:", error);
    return NextResponse.json(
      { error: "Failed to fetch store products" },
      { status: 500 },
    );
  }
}

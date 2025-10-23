import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  products,
  stores,
  categories,
  productImages,
} from "@/server/db/schema";
import { eq, desc, asc, or, ilike } from "drizzle-orm";

// GET /api/search - Search across products, stores, and categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const type = searchParams.get("type"); // 'products', 'stores', 'categories', or 'all'

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        products: [],
        stores: [],
        categories: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const searchTerm = `%${query.trim()}%`;
    const offset = (page - 1) * limit;

    const results: {
      products: Array<{
        id: number;
        name: string;
        description: string | null;
        price: number | null;
        stock: number;
        storeId: string;
        categoryId: number | null;
        createdAt: Date;
        updatedAt: Date;
        store: { id: string; name: string; slug: string } | null;
        category: { id: number; name: string } | null;
        images: Array<{
          id: number;
          imageUrl: string;
          altText: string | null;
          isPrimary: boolean;
          displayOrder: number;
        }>;
      }>;
      stores: Array<{
        id: string;
        name: string;
        description: string | null;
        ownerId: string;
        createdAt: Date;
      }>;
      categories: Array<{
        id: number;
        name: string;
        description: string | null;
      }>;
    } = {
      products: [],
      stores: [],
      categories: [],
    };

    // Search products
    if (!type || type === "all" || type === "products") {
      const productsData = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          stock: products.stock,
          storeId: products.storeId,
          categoryId: products.categoryId,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          store: {
            id: stores.id,
            name: stores.name,
            slug: stores.slug,
          },
          category: {
            id: categories.id,
            name: categories.name,
          },
        })
        .from(products)
        .leftJoin(stores, eq(products.storeId, stores.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          or(
            ilike(products.name, searchTerm),
            ilike(products.description, searchTerm),
          ),
        )
        .orderBy(desc(products.createdAt))
        .limit(type === "products" ? limit : 10)
        .offset(type === "products" ? offset : 0);

      // Get product images for each product
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

          return {
            ...product,
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

      results.products = productsWithImages;
    }

    // Search stores
    if (!type || type === "all" || type === "stores") {
      const storesData = await db
        .select({
          id: stores.id,
          name: stores.name,
          slug: stores.slug,
          description: stores.description,
          ownerId: stores.ownerId,
          createdAt: stores.createdAt,
        })
        .from(stores)
        .where(
          or(
            ilike(stores.name, searchTerm),
            ilike(stores.description, searchTerm),
          ),
        )
        .orderBy(asc(stores.name))
        .limit(type === "stores" ? limit : 10)
        .offset(type === "stores" ? offset : 0);

      results.stores = storesData;
    }

    // Search categories
    if (!type || type === "all" || type === "categories") {
      const categoriesData = await db
        .select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
        })
        .from(categories)
        .where(
          or(
            ilike(categories.name, searchTerm),
            ilike(categories.description, searchTerm),
          ),
        )
        .orderBy(asc(categories.name))
        .limit(type === "categories" ? limit : 10)
        .offset(type === "categories" ? offset : 0);

      results.categories = categoriesData;
    }

    const totalResults =
      results.products.length +
      results.stores.length +
      results.categories.length;

    return NextResponse.json({
      ...results,
      query,
      pagination: {
        page,
        limit,
        total: totalResults,
        totalPages: Math.ceil(totalResults / limit),
      },
    });
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 },
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  products,
  stores,
  categories,
  productImages,
  reviews,
} from "@/server/db/schema";
import { eq, asc, sql, count, ne, and } from "drizzle-orm";

// GET /api/products/[slug]/related - Get related products for a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "6");

    // Check if the slug is a numeric ID
    const isNumericId = /^\d+$/.test(slug);
    const productId = isNumericId ? parseInt(slug) : null;

    // First, get the current product to find its category
    const currentProduct = await db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        storeId: products.storeId,
      })
      .from(products)
      .where(
        isNumericId 
          ? eq(products.id, productId!)
          : eq(products.slug, slug)
      )
      .limit(1);

    if (currentProduct.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const currentProductData = currentProduct[0];

    // Build WHERE conditions for related products
    const whereConditions = [
      ne(products.id, currentProductData.id), // Exclude current product
      eq(products.status, "Active"), // Only active products
    ];

    // If the product has a category, prioritize products from the same category
    if (currentProductData.categoryId) {
      whereConditions.push(eq(products.categoryId, currentProductData.categoryId));
    }

    // Get related products with store and category information
    const relatedProductsData = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        description: products.description,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        costPerItem: products.costPerItem,
        stock: products.stock,
        trackQuantity: products.trackQuantity,
        allowBackorders: products.allowBackorders,
        weight: products.weight,
        length: products.length,
        width: products.width,
        height: products.height,
        seoTitle: products.seoTitle,
        seoDescription: products.seoDescription,
        slug: products.slug,
        status: products.status,
        featured: products.featured,
        tags: products.tags,
        storeId: products.storeId,
        categoryId: products.categoryId,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        store: {
          id: stores.id,
          name: stores.name,
          slug: stores.slug,
          description: stores.description,
        },
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(products)
      .leftJoin(stores, eq(products.storeId, stores.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...whereConditions))
      .orderBy(sql`CASE WHEN ${products.categoryId} = ${currentProductData.categoryId} THEN 0 ELSE 1 END, ${products.featured} DESC, ${products.createdAt} DESC`)
      .limit(limit);

    // If we don't have enough products from the same category, get more from other categories
    if (relatedProductsData.length < limit && currentProductData.categoryId) {
      const additionalLimit = limit - relatedProductsData.length;
      
      const additionalProducts = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          description: products.description,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
          costPerItem: products.costPerItem,
          stock: products.stock,
          trackQuantity: products.trackQuantity,
          allowBackorders: products.allowBackorders,
          weight: products.weight,
          length: products.length,
          width: products.width,
          height: products.height,
          seoTitle: products.seoTitle,
          seoDescription: products.seoDescription,
          slug: products.slug,
          status: products.status,
          featured: products.featured,
          tags: products.tags,
          storeId: products.storeId,
          categoryId: products.categoryId,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          store: {
            id: stores.id,
            name: stores.name,
            slug: stores.slug,
            description: stores.description,
          },
          category: {
            id: categories.id,
            name: categories.name,
          },
        })
        .from(products)
        .leftJoin(stores, eq(products.storeId, stores.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(
          ne(products.id, currentProductData.id),
          ne(products.categoryId, currentProductData.categoryId),
          eq(products.status, "Active")
        ))
        .orderBy(sql`${products.featured} DESC, ${products.createdAt} DESC`)
        .limit(additionalLimit);

      relatedProductsData.push(...additionalProducts);
    }

    // Get product images and review statistics for each related product
    const relatedProductsWithImages = await Promise.all(
      relatedProductsData.map(async (product) => {
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
            averageRating: sql<number>`ROUND(AVG(${reviews.rating})::numeric, 2)`.mapWith(Number),
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

    return NextResponse.json({
      products: relatedProductsWithImages,
    });
  } catch (error) {
    console.error("Error fetching related products:", error);
    return NextResponse.json(
      { error: "Failed to fetch related products" },
      { status: 500 },
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  products,
  stores,
  categories,
  productImages,
  reviews,
} from "@/server/db/schema";
import { eq, asc, sql, count } from "drizzle-orm";

// GET /api/products/[slug] - Get a specific product by slug or ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // Check if the slug is a numeric ID
    const isNumericId = /^\d+$/.test(slug);
    const productId = isNumericId ? parseInt(slug) : null;

    // Get product with store and category information
    const productData = await db
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
      .where(
        isNumericId 
          ? eq(products.id, productId!)
          : eq(products.slug, slug)
      )
      .limit(1);

    if (productData.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get product images
    const images = await db
      .select({
        id: productImages.id,
        imageUrl: productImages.imageUrl,
        altText: productImages.altText,
        isPrimary: productImages.isPrimary,
        displayOrder: productImages.displayOrder,
      })
      .from(productImages)
      .where(eq(productImages.productId, productData[0].id))
      .orderBy(asc(productImages.displayOrder));

    const product = productData[0];

    // Get review statistics for this product
    const [reviewStats] = await db
      .select({
        averageRating: sql<number>`ROUND(AVG(${reviews.rating})::numeric, 2)`.mapWith(Number),
        reviewCount: count().mapWith(Number),
      })
      .from(reviews)
      .where(eq(reviews.productId, product.id));

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

// PUT /api/products/[slug] - Update a product by slug or ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    
    // Check if the slug is a numeric ID
    const isNumericId = /^\d+$/.test(slug);
    let productId: number;
    
    if (isNumericId) {
      productId = parseInt(slug);
    } else {
      // First, get the product ID from the slug
      const productLookup = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);
      
      if (productLookup.length === 0) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      
      productId = productLookup[0].id;
    }

    const body = (await request.json()) as {
      name?: string;
      sku?: string;
      description?: string;
      price?: number;
      compareAtPrice?: number;
      costPerItem?: number;
      stock?: number;
      trackQuantity?: boolean;
      allowBackorders?: boolean;
      weight?: number;
      dimensions?: {
        length?: number;
        width?: number;
        height?: number;
      };
      seoTitle?: string;
      seoDescription?: string;
      slug?: string;
      status?: "active" | "draft" | "archived";
      featured?: boolean;
      tags?: string;
      categoryId?: number;
      images?: string[];
    };

    // Validate required fields for active products
    if (body.status === "active") {
      const currentProduct = await db
        .select({
          sku: products.sku,
          description: products.description,
          price: products.price,
          status: products.status,
        })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      // Check SKU
      const effectiveSku = body.sku ?? currentProduct[0]?.sku;
      if (!effectiveSku || effectiveSku.trim() === "") {
        return NextResponse.json(
          { error: "SKU is required for active products" },
          { status: 400 },
        );
      }

      // Check Description
      const effectiveDescription =
        body.description ?? currentProduct[0]?.description;
      if (!effectiveDescription || effectiveDescription.trim() === "") {
        return NextResponse.json(
          { error: "Description is required for active products" },
          { status: 400 },
        );
      }

      // Check Price
      const effectivePrice =
        body.price ??
        (currentProduct[0]?.price ? currentProduct[0].price / 100 : 0);
      if (!effectivePrice || effectivePrice <= 0) {
        return NextResponse.json(
          {
            error:
              "Price is required and must be greater than 0 for active products",
          },
          { status: 400 },
        );
      }
    }

    // Build the update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.sku !== undefined) {
      // Convert empty strings to null for drafts
      updateData.sku = body.sku && body.sku.trim() !== "" ? body.sku : null;
    }
    if (body.description !== undefined)
      updateData.description = body.description;

    if (body.price !== undefined) {
      updateData.price = Math.round(body.price * 100);
    }
    if (body.compareAtPrice !== undefined) {
      updateData.compareAtPrice = body.compareAtPrice
        ? Math.round(body.compareAtPrice * 100)
        : null;
    }
    if (body.costPerItem !== undefined) {
      updateData.costPerItem = body.costPerItem
        ? Math.round(body.costPerItem * 100)
        : null;
    }

    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.trackQuantity !== undefined)
      updateData.trackQuantity = body.trackQuantity;
    if (body.allowBackorders !== undefined)
      updateData.allowBackorders = body.allowBackorders;

    if (body.weight !== undefined) {
      updateData.weight = body.weight ? body.weight.toString() : null;
    }
    if (body.dimensions?.length !== undefined) {
      updateData.length = body.dimensions.length
        ? body.dimensions.length.toString()
        : null;
    }
    if (body.dimensions?.width !== undefined) {
      updateData.width = body.dimensions.width
        ? body.dimensions.width.toString()
        : null;
    }
    if (body.dimensions?.height !== undefined) {
      updateData.height = body.dimensions.height
        ? body.dimensions.height.toString()
        : null;
    }

    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined)
      updateData.seoDescription = body.seoDescription;
    if (body.slug !== undefined) {
      // Convert empty strings to null for drafts
      updateData.slug = body.slug && body.slug.trim() !== "" ? body.slug : null;
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.featured !== undefined) updateData.featured = body.featured;

    if (body.tags !== undefined) {
      updateData.tags = body.tags
        ? JSON.stringify(body.tags.split(",").map((tag: string) => tag.trim()))
        : null;
    }

    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId ?? null;
    }

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    // Update the product
    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update images if provided
    if (body.images !== undefined) {
      // Delete existing images
      await db
        .delete(productImages)
        .where(eq(productImages.productId, productId));

      // Insert new images
      if (body.images.length > 0) {
        const imageRecords = body.images.map(
          (imageUrl: string, index: number) => ({
            productId,
            imageUrl,
            altText: `${updatedProduct.name} - Image ${index + 1}`,
            isPrimary: index === 0,
            displayOrder: index,
          }),
        );

        await db.insert(productImages).values(imageRecords);
      }
    }

    // Fetch the complete updated product
    const productWithImages = await db
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
        },
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(products)
      .leftJoin(stores, eq(products.storeId, stores.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, productId))
      .limit(1);

    // Get product images
    const images = await db
      .select({
        id: productImages.id,
        imageUrl: productImages.imageUrl,
        altText: productImages.altText,
        isPrimary: productImages.isPrimary,
        displayOrder: productImages.displayOrder,
      })
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.displayOrder));

    // Get review statistics for this product
    const [reviewStats] = await db
      .select({
        averageRating: sql<number>`ROUND(AVG(${reviews.rating})::numeric, 2)`.mapWith(Number),
        reviewCount: count().mapWith(Number),
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    const completeProduct = {
      ...productWithImages[0],
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

    return NextResponse.json({ product: completeProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

// DELETE /api/products/[slug] - Delete a product (placeholder for future implementation)
export async function DELETE(
  _request: NextRequest,
  { params: _params }: { params: Promise<{ slug: string }> },
) {
  // TODO: Implement product deletion with proper authentication
  return NextResponse.json(
    { error: "Product deletion not yet implemented" },
    { status: 501 },
  );
}

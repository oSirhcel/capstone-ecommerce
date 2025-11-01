import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  products,
  stores,
  categories,
  productImages,
  productTags,
  tags,
  cartItems,
  orderItems,
  reviews,
  wishlists,
  inventoryLogs,
  productVariants,
} from "@/server/db/schema";
import { eq, asc, sql, count, notInArray } from "drizzle-orm";

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
      .where(
        isNumericId ? eq(products.id, productId!) : eq(products.slug, slug),
      )
      .limit(1);

    if (productData.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = productData[0];

    // Get product tags
    const productTagsData = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(productTags)
      .innerJoin(tags, eq(productTags.tagId, tags.id))
      .where(eq(productTags.productId, product.id));

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

    return NextResponse.json({
      ...product,
      tags: productTagsData,
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
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
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
      status?: "Active" | "Draft" | "Archived";
      featured?: boolean;
      tagIds?: number[];
      categoryId?: number;
      images?: string[];
    };

    // Validate required fields for active products
    if (body.status === "Active") {
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
    if (body.status !== undefined) {
      // Normalize status to DB enum values
      const statusValue: "Active" | "Draft" | "Archived" =
        body.status === "Active"
          ? "Active"
          : body.status === "Archived"
            ? "Archived"
            : "Draft";
      updateData.status = statusValue;
    }
    if (body.featured !== undefined) updateData.featured = body.featured;

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

    // Handle tag updates
    if (body.tagIds !== undefined) {
      // Delete existing product-tag relationships
      await db.delete(productTags).where(eq(productTags.productId, productId));

      // Insert new product-tag relationships
      if (body.tagIds.length > 0) {
        await db.insert(productTags).values(
          body.tagIds.map((tagId) => ({
            productId,
            tagId,
          })),
        );
      }
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
      .where(eq(products.id, productId))
      .limit(1);

    // Get product tags
    const updatedTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(productTags)
      .innerJoin(tags, eq(productTags.tagId, tags.id))
      .where(eq(productTags.productId, productId));

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
        averageRating:
          sql<number>`ROUND(AVG(${reviews.rating})::numeric, 2)`.mapWith(
            Number,
          ),
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
      tags: updatedTags,
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

// DELETE /api/products/[slug] - Delete a product by slug or ID
export async function DELETE(
  _request: NextRequest,
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
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
      }

      productId = productLookup[0].id;
    }

    // Verify product exists before attempting deletion
    const productExists = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (productExists.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete related records first (since foreign keys don't cascade)
    // Note: Some of these (orderItems, inventoryLogs) are historical records
    // but must be deleted due to FK constraints. Consider archiving instead in production.

    // Delete cart items
    await db.delete(cartItems).where(eq(cartItems.productId, productId));

    // Delete wishlist items
    await db.delete(wishlists).where(eq(wishlists.productId, productId));

    // Delete reviews
    await db.delete(reviews).where(eq(reviews.productId, productId));

    // Delete product variants
    await db
      .delete(productVariants)
      .where(eq(productVariants.productId, productId));

    // Delete inventory logs (historical data - consider archiving in production)
    await db
      .delete(inventoryLogs)
      .where(eq(inventoryLogs.productId, productId));

    // Delete order items (historical data - consider archiving in production)
    await db.delete(orderItems).where(eq(orderItems.productId, productId));

    // Delete product images
    await db
      .delete(productImages)
      .where(eq(productImages.productId, productId));

    // Delete product-tag relationships (productTags has cascade, but let's be explicit)
    await db.delete(productTags).where(eq(productTags.productId, productId));

    // Delete the product
    await db.delete(products).where(eq(products.id, productId));

    // Clean up orphaned tags (tags with no products)
    // Get all tag IDs that are still in use
    const usedTagIds = await db
      .select({ tagId: productTags.tagId })
      .from(productTags);

    const usedTagIdArray = Array.from(new Set(usedTagIds.map((t) => t.tagId)));

    // Delete tags that are not in use
    // If usedTagIdArray is empty, notInArray will match all tags (deleting all orphaned tags)
    if (usedTagIdArray.length > 0) {
      await db.delete(tags).where(notInArray(tags.id, usedTagIdArray));
    } else {
      // If no tags are in use, delete all tags (intentional - cleaning up orphaned tags)
      // eslint-disable-next-line drizzle/enforce-delete-with-where
      await db.delete(tags);
    }

    return NextResponse.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}

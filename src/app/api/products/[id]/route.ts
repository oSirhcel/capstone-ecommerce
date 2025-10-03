import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  products,
  stores,
  categories,
  productImages,
} from "@/server/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/products/[id] - Get a specific product by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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
      .where(eq(products.id, parseInt(id)))
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
      .where(eq(productImages.productId, parseInt(id)))
      .orderBy(asc(productImages.displayOrder));

    const product = productData[0];

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

// PUT /api/products/[id] - Update a product (placeholder for future implementation)
export async function PUT(
  _request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> },
) {
  // TODO: Implement product updates with proper authentication
  return NextResponse.json(
    { error: "Product updates not yet implemented" },
    { status: 501 },
  );
}

// DELETE /api/products/[id] - Delete a product (placeholder for future implementation)
export async function DELETE(
  _request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> },
) {
  // TODO: Implement product deletion with proper authentication
  return NextResponse.json(
    { error: "Product deletion not yet implemented" },
    { status: 501 },
  );
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { products, stores, categories, productImages } from "@/server/db/schema";
import { eq, desc, asc, and, like } from "drizzle-orm";

// GET /api/products - Get all products with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const store = searchParams.get("store");
    const search = searchParams.get("search");

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const whereConditions = [];
    
    if (category) {
      whereConditions.push(eq(products.categoryId, parseInt(category)));
    }
    
    if (store) {
      whereConditions.push(eq(products.storeId, store));
    }
    
    if (search) {
      whereConditions.push(like(products.name, `%${search}%`));
    }

    // Build the main query
    let query = db
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
        },
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(products)
      .leftJoin(stores, eq(products.storeId, stores.id))
      .leftJoin(categories, eq(products.categoryId, categories.id));

    // Apply WHERE conditions if any
    if (whereConditions.length > 0) {
      query = query.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
    }

    const productsData = await query
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

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
          images: images.length > 0 ? images : [{ 
            id: 0, 
            imageUrl: "/placeholder.svg", 
            altText: "Product image", 
            isPrimary: true, 
            displayOrder: 0 
          }],
        };
      })
    );

    return NextResponse.json({
      products: productsWithImages,
      pagination: {
        page,
        limit,
        total: productsData.length,
        totalPages: Math.ceil(productsData.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product (placeholder for future implementation)
export async function POST(request: NextRequest) {
  // TODO: Implement product creation with proper authentication
  return NextResponse.json(
    { error: "Product creation not yet implemented" },
    { status: 501 }
  );
}

// PUT /api/products - Update products (placeholder for future implementation)
export async function PUT(request: NextRequest) {
  // TODO: Implement product updates with proper authentication
  return NextResponse.json(
    { error: "Product updates not yet implemented" },
    { status: 501 }
  );
}

// DELETE /api/products - Delete products (placeholder for future implementation)
export async function DELETE(request: NextRequest) {
  // TODO: Implement product deletion with proper authentication
  return NextResponse.json(
    { error: "Product deletion not yet implemented" },
    { status: 501 }
  );
}

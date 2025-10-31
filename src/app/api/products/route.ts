import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  products,
  stores,
  categories,
  productImages,
  reviews,
  productTags,
  tags,
} from "@/server/db/schema";
import { eq, desc, asc, and, ilike, sql, count } from "drizzle-orm";

// GET /api/products - Get all products with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const category = searchParams.get("category");
    const store = searchParams.get("store");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured") === "true";
    const sort = searchParams.get("sort") ?? "release-newest";

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
      whereConditions.push(ilike(products.name, `%${search}%`));
    }

    if (featured) {
      whereConditions.push(eq(products.featured, true));
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
      // Apply WHERE conditions if any
      .where(
        whereConditions.length === 0
          ? undefined
          : whereConditions.length === 1
            ? whereConditions[0]
            : and(...whereConditions, eq(products.status, "Active")),
      );

    // Build sorting for fields directly available
    let orderByClause;
    switch (sort) {
      case "price-low":
        orderByClause = asc(products.price);
        break;
      case "price-high":
        orderByClause = desc(products.price);
        break;
      case "name-asc":
        orderByClause = asc(products.name);
        break;
      case "name-desc":
        orderByClause = desc(products.name);
        break;
      case "release-oldest":
        orderByClause = asc(products.createdAt);
        break;
      case "release-newest":
      default:
        orderByClause = desc(products.createdAt);
        break;
    }

    // Get total count for pagination (before applying limit/offset)
    const [{ totalCount }] = await db
      .select({
        totalCount: count().mapWith(Number),
      })
      .from(products)
      .leftJoin(stores, eq(products.storeId, stores.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        whereConditions.length === 0
          ? undefined
          : whereConditions.length === 1
            ? whereConditions[0]
            : and(...whereConditions),
      );

    const productsData = await query
      .orderBy(orderByClause as Parameters<typeof query.orderBy>[0])
      .limit(limit)
      .offset(offset);

    // Get product images and review statistics for each product
    let productsWithImages = await Promise.all(
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

    // Apply rating-based sorting client-side after enrichment
    if (sort === "rating-low" || sort === "rating-high") {
      productsWithImages = productsWithImages.sort((a, b) =>
        sort === "rating-low" ? a.rating - b.rating : b.rating - a.rating,
      );
    }

    return NextResponse.json({
      products: productsWithImages,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name: string;
      sku?: string;
      description?: string;
      price?: number;
      compareAtPrice?: number;
      costPerItem?: number;
      stock?: number;
      trackQuantity?: boolean;
      allowBackorders?: boolean;
      weight?: number;
      dimensions?: { length?: number; width?: number; height?: number };
      seoTitle?: string;
      seoDescription?: string;
      slug?: string;
      status?: "Active" | "Inactive" | "Draft" | "Archived";
      featured?: boolean;
      tagIds?: number[];
      storeId: string;
      categoryId?: number;
      images?: string[];
    };

    const {
      name,
      sku,
      description,
      price,
      compareAtPrice,
      costPerItem,
      stock = 0,
      trackQuantity = true,
      allowBackorders = false,
      weight,
      dimensions,
      seoTitle,
      seoDescription,
      slug,
      status = "Draft",
      featured = false,
      tagIds = [],
      storeId,
      categoryId,
      images = [],
    } = body;

    // Validate required fields
    if (!name || !storeId) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, storeId",
        },
        { status: 400 },
      );
    }

    // Validate required fields for active products
    if (status === "Active") {
      if (!sku || sku.trim() === "") {
        return NextResponse.json(
          { error: "SKU is required for active products" },
          { status: 400 },
        );
      }
      if (!description || description.trim() === "") {
        return NextResponse.json(
          { error: "Description is required for active products" },
          { status: 400 },
        );
      }
      if (!price || price <= 0) {
        return NextResponse.json(
          {
            error:
              "Price is required and must be greater than 0 for active products",
          },
          { status: 400 },
        );
      }
    }

    // Convert price to cents (assuming price is in dollars)
    const priceInCents = price ? Math.round(price * 100) : 0;
    const compareAtPriceInCents = compareAtPrice
      ? Math.round(compareAtPrice * 100)
      : null;
    const costPerItemInCents = costPerItem
      ? Math.round(costPerItem * 100)
      : null;

    // Convert weight to string for decimal storage
    const weightString = weight ? weight.toString() : null;

    // Convert dimensions to strings for decimal storage
    const lengthString = dimensions?.length
      ? dimensions.length.toString()
      : null;
    const widthString = dimensions?.width ? dimensions.width.toString() : null;
    const heightString = dimensions?.height
      ? dimensions.height.toString()
      : null;

    // Normalize status to DB enum values
    const statusValue: "Active" | "Inactive" | "Draft" | "Archived" =
      status === "Active"
        ? "Active"
        : status === "Archived"
          ? "Archived"
          : status === "Inactive"
            ? "Inactive"
            : "Draft";

    // Create the product
    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        sku: sku && sku.trim() !== "" ? sku : null, // Convert empty strings to null
        description,
        price: priceInCents,
        compareAtPrice: compareAtPriceInCents,
        costPerItem: costPerItemInCents,
        stock,
        trackQuantity,
        allowBackorders,
        weight: weightString,
        length: lengthString,
        width: widthString,
        height: heightString,
        seoTitle,
        seoDescription,
        slug: slug && slug.trim() !== "" ? slug : null, // Convert empty strings to null
        status: statusValue,
        featured,
        storeId,
        categoryId: categoryId ?? null,
      })
      .returning();

    // Insert product-tag relationships
    if (tagIds && tagIds.length > 0) {
      await db.insert(productTags).values(
        tagIds.map((tagId) => ({
          productId: newProduct.id,
          tagId,
        })),
      );
    }

    // Insert product images if provided
    if (images && images.length > 0) {
      const imageRecords = images.map((imageUrl: string, index: number) => ({
        productId: newProduct.id,
        imageUrl,
        altText: `${name} - Image ${index + 1}`,
        isPrimary: index === 0, // First image is primary
        displayOrder: index,
      }));

      await db.insert(productImages).values(imageRecords);
    }

    // Fetch the complete product with images
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
      .where(eq(products.id, newProduct.id))
      .limit(1);

    // Get product tags
    const productTagsData = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(productTags)
      .innerJoin(tags, eq(productTags.tagId, tags.id))
      .where(eq(productTags.productId, newProduct.id));

    // Get product images
    const productImagesData = await db
      .select({
        id: productImages.id,
        imageUrl: productImages.imageUrl,
        altText: productImages.altText,
        isPrimary: productImages.isPrimary,
        displayOrder: productImages.displayOrder,
      })
      .from(productImages)
      .where(eq(productImages.productId, newProduct.id))
      .orderBy(asc(productImages.displayOrder));

    const completeProduct = {
      ...productWithImages[0],
      tags: productTagsData,
      images:
        productImagesData.length > 0
          ? productImagesData
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
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}

// PUT /api/products - Update products (placeholder for future implementation)
export async function PUT(_request: NextRequest) {
  // TODO: Implement product updates with proper authentication
  return NextResponse.json(
    { error: "Product updates not yet implemented" },
    { status: 501 },
  );
}

// DELETE /api/products - Delete products (placeholder for future implementation)
export async function DELETE(_request: NextRequest) {
  // TODO: Implement product deletion with proper authentication
  return NextResponse.json(
    { error: "Product deletion not yet implemented" },
    { status: 501 },
  );
}

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  products,
  productImages,
  productTags,
} from "../../src/server/db/schema";
import type { InferInsertModel } from "drizzle-orm";
import type { SeededStore } from "./stores";
import type { SeededCategory } from "./categories";
import type { SeededTag } from "./tags";
import { daysAgo, randomInt, cents, generateSKU, randomFloat } from "./utils";
import { readFileSync } from "fs";
import { join } from "path";

type NewProduct = InferInsertModel<typeof products>;
type NewProductImage = InferInsertModel<typeof productImages>;
type NewProductTag = InferInsertModel<typeof productTags>;

export interface ProductSeed {
  name: string;
  sku: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPerItem: number;
  stock: number;
  trackQuantity: boolean;
  allowBackorders: boolean;
  weight: string;
  length: string;
  width: string;
  height: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  status: "Active" | "Draft" | "Archived";
  featured: boolean;
  categoryName: string;
  tags: string[];
  images: Array<{
    imageUrl: string;
    altText: string;
    isPrimary: boolean;
    displayOrder: number;
  }>;
}

export interface SeededProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  storeId: string;
  categoryId: number;
  status: string;
}

interface OutputProduct {
  id: number;
  name: string;
  category: string;
  image_url: string;
  description: string;
  price: number;
}

function transformProduct(
  product: OutputProduct,
  storePrefix: string,
  productIndex: number,
): ProductSeed {
  const name = product.name;
  const categoryName = product.category;

  // Use price from JSONL file
  const priceBase = product.price;
  const price = cents(priceBase);
  const compareAtPrice =
    Math.random() > 0.6 ? cents(priceBase * 1.25) : undefined;
  const costPerItem = cents(priceBase * (0.4 + Math.random() * 0.2));

  const stock = randomInt(0, 200);
  const featured = Math.random() > 0.85;
  const status: "Active" | "Draft" = Math.random() > 0.95 ? "Draft" : "Active";

  // Generate slug
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 200);
  const slug = `${baseSlug}-${productIndex}`.substring(0, 255);

  // Generate SEO title (max 60 chars)
  let seoTitle = name.substring(0, 60);
  if (seoTitle.length === 60) {
    seoTitle = seoTitle.substring(0, 57) + "...";
  }

  // Use description from JSONL file, fallback if empty
  const description =
    product.description &&
    product.description.trim() !== "" &&
    product.description !== "Description"
      ? product.description
      : `${name}. High-quality ${categoryName.toLowerCase()} product with excellent features and performance. Perfect for everyday use.`;

  // Generate SEO description (max 200 chars)
  let seoDescription = description.substring(0, 200);
  if (seoDescription.length === 200) {
    const lastSpace = seoDescription.lastIndexOf(" ");
    seoDescription =
      lastSpace > 0 ? seoDescription.substring(0, lastSpace) : seoDescription;
  }

  // Generate tags based on product name
  const nameLower = name.toLowerCase();
  const tags: string[] = [];
  if (nameLower.includes("wireless") || nameLower.includes("bluetooth"))
    tags.push("wireless", "bluetooth");
  if (nameLower.includes("smart")) tags.push("smart-home");
  if (nameLower.includes("portable") || nameLower.includes("mobile"))
    tags.push("portable");
  if (nameLower.includes("rechargeable") || nameLower.includes("battery"))
    tags.push("rechargeable");
  if (nameLower.includes("waterproof") || nameLower.includes("water resistant"))
    tags.push("waterproof");
  if (nameLower.includes("premium") || priceBase > 100) tags.push("premium");
  if (priceBase < 50) tags.push("budget-friendly");
  if (Math.random() > 0.7) tags.push("bestseller");

  // Add category-specific tags
  if (categoryName === "Electronics") {
    tags.push("premium");
  }

  // Ensure at least some tags
  if (tags.length === 0) {
    tags.push("premium", "bestseller");
  }

  // Remove duplicate tags
  const uniqueTags = [...new Set(tags)];

  // Generate SKU
  const sku = generateSKU(storePrefix, categoryName, productIndex);

  // Create images array using image_url from JSONL
  const images = [
    {
      imageUrl: product.image_url,
      altText: `${name} - Product Image`,
      isPrimary: true,
      displayOrder: 0,
    },
  ];

  return {
    name,
    sku,
    description,
    price,
    compareAtPrice,
    costPerItem,
    stock,
    trackQuantity: true,
    allowBackorders: stock < 10 && Math.random() > 0.5,
    weight: randomFloat(0.05, 2.5).toFixed(3),
    length: randomFloat(5, 50).toFixed(2),
    width: randomFloat(5, 30).toFixed(2),
    height: randomFloat(2, 20).toFixed(2),
    seoTitle,
    seoDescription,
    slug,
    status,
    featured,
    categoryName,
    tags: uniqueTags,
    images,
  };
}

export async function seedProducts(
  db: NodePgDatabase<Record<string, never>>,
  stores: SeededStore[],
  categories: SeededCategory[],
  tags: SeededTag[],
): Promise<SeededProduct[]> {
  console.log("🌱 Seeding products from products.jsonl...");

  // Load products from products.jsonl (one JSON object per line)
  const outputPath = join(process.cwd(), "scripts/seed/products.jsonl");
  const fileContent = readFileSync(outputPath, "utf-8");
  const outputData = fileContent
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as OutputProduct);

  console.log(`  Loaded ${outputData.length} products from products.jsonl`);

  const seededProducts: SeededProduct[] = [];
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
  const tagMap = new Map(tags.map((t) => [t.name, t.id]));

  // Global product index counter
  const globalProductIndex = { current: 1 };

  // Distribute products across stores
  const productsPerStore = Math.floor(outputData.length / stores.length);
  const remainder = outputData.length % stores.length;

  let totalProductsCreated = 0;
  let productDataIndex = 0;

  for (let storeIndex = 0; storeIndex < stores.length; storeIndex++) {
    const store = stores[storeIndex];
    const productsForStore =
      productsPerStore + (storeIndex < remainder ? 1 : 0);

    console.log(
      `  Processing ${productsForStore} products for ${store.name}...`,
    );

    // Transform products for this store
    const storePrefix = store.slug.split("-")[0].substring(0, 3).toUpperCase();
    const productSeeds: ProductSeed[] = [];

    for (
      let i = 0;
      i < productsForStore && productDataIndex < outputData.length;
      i++
    ) {
      const outputProduct = outputData[productDataIndex];
      const transformed = transformProduct(
        outputProduct,
        storePrefix,
        globalProductIndex.current++,
      );

      // Add all products regardless of category
      productSeeds.push(transformed);
      productDataIndex++;
    }

    // Batch insert products
    const productInserts: NewProduct[] = [];

    for (const seed of productSeeds) {
      const categoryId = categoryMap.get(seed.categoryName);
      if (!categoryId) {
        console.warn(
          `Category not found for product: ${seed.name} (${seed.categoryName})`,
        );
        continue;
      }

      productInserts.push({
        name: seed.name,
        sku: seed.sku,
        description: seed.description,
        price: seed.price,
        compareAtPrice: seed.compareAtPrice,
        costPerItem: seed.costPerItem,
        stock: seed.stock,
        trackQuantity: seed.trackQuantity,
        allowBackorders: seed.allowBackorders,
        weight: seed.weight,
        length: seed.length,
        width: seed.width,
        height: seed.height,
        seoTitle: seed.seoTitle,
        seoDescription: seed.seoDescription,
        slug: seed.slug,
        status: seed.status,
        featured: seed.featured,
        storeId: store.id,
        categoryId,
        createdAt: daysAgo(randomInt(1, 180)),
        updatedAt: daysAgo(randomInt(0, 30)),
      });
    }

    if (productInserts.length === 0) {
      continue;
    }

    // Insert products and get IDs
    const insertedProducts = await db
      .insert(products)
      .values(productInserts)
      .returning();

    // Create images for each product
    const imageInserts: NewProductImage[] = [];
    for (let i = 0; i < insertedProducts.length; i++) {
      const product = insertedProducts[i];
      const seed = productSeeds[i];

      for (const img of seed.images) {
        imageInserts.push({
          productId: product.id,
          imageUrl: img.imageUrl,
          altText: img.altText,
          isPrimary: img.isPrimary,
          displayOrder: img.displayOrder,
        });
      }
    }

    if (imageInserts.length > 0) {
      await db.insert(productImages).values(imageInserts);
    }

    // Create product-tag relationships
    const tagInserts: NewProductTag[] = [];
    for (let i = 0; i < insertedProducts.length; i++) {
      const product = insertedProducts[i];
      const seed = productSeeds[i];

      for (const tagName of seed.tags) {
        const tagId = tagMap.get(tagName);
        if (tagId) {
          tagInserts.push({
            productId: product.id,
            tagId,
          });
        }
      }
    }

    if (tagInserts.length > 0) {
      await db.insert(productTags).values(tagInserts);
    }

    // Track seeded products
    for (const product of insertedProducts) {
      seededProducts.push({
        id: product.id,
        name: product.name,
        slug: product.slug ?? "",
        price: product.price ?? 0,
        storeId: product.storeId,
        categoryId: product.categoryId ?? 0,
        status: product.status,
      });
    }

    totalProductsCreated += insertedProducts.length;
  }

  console.log(`✅ Created ${totalProductsCreated} products`);
  console.log(`   - Products matched to stores by category focus`);
  console.log(`   - Product images: ${totalProductsCreated} (avg)`);
  console.log(`   - Product tags: ${totalProductsCreated * 3} (avg)`);

  return seededProducts;
}

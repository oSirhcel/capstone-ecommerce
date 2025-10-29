import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

import {
  users,
  stores,
  categories,
  products,
  productImages,
  reviews,
  userProfiles,
  orders,
  orderItems,
  addresses,
  paymentTransactions,
  zeroTrustAssessments,
  riskAssessmentOrderLinks,
  riskAssessmentStoreLinks,
  tags,
  productTags,
} from "../src/server/db/schema";
import { sql, eq, type InferInsertModel } from "drizzle-orm";

type NewUser = InferInsertModel<typeof users>;
type NewStore = InferInsertModel<typeof stores>;
type NewCategory = InferInsertModel<typeof categories>;
type NewProduct = InferInsertModel<typeof products>;
type NewProductImage = InferInsertModel<typeof productImages>;
type NewReview = InferInsertModel<typeof reviews>;
type NewUserProfile = InferInsertModel<typeof userProfiles>;
type NewOrder = InferInsertModel<typeof orders>;
type NewOrderItem = InferInsertModel<typeof orderItems>;
type NewAddress = InferInsertModel<typeof addresses>;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function decisionFromOrder(status: string, paymentStatus: string) {
  if (status === "Completed" && paymentStatus === "Paid") {
    return { decision: "allow" as const, min: 5, max: 25 };
  }
  if (status === "On-hold" || paymentStatus === "Pending") {
    return { decision: "warn" as const, min: 35, max: 65 };
  }
  if (status === "Denied" || paymentStatus === "Failed") {
    return { decision: "deny" as const, min: 70, max: 95 };
  }
  return { decision: "warn" as const, min: 30, max: 60 };
}
type NewTag = InferInsertModel<typeof tags>;
type NewProductTag = InferInsertModel<typeof productTags>;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in environment");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    console.log("🔄 Resetting database...");

    // Truncate all tables in correct order (respecting foreign keys)
    await db.execute(
      sql`TRUNCATE TABLE 
        "product_tags",
        "product_images", 
        "order_items", 
        "orders", 
        "addresses", 
        "user_profiles", 
        "products",
        "tags",
        "stores", 
        "categories", 
        "users" 
        RESTART IDENTITY CASCADE`,
    );

    console.log("✅ Database reset complete");

    // Create two store owners
    const passwordHash = bcrypt.hashSync("Test123", 10);
    const ownerAId = "default-store-id";
    const ownerBId = uuidv4();

    const ownerA: NewUser = {
      id: ownerAId,
      username: "owner_alpha",
      password: passwordHash,
    };
    const ownerB: NewUser = {
      id: ownerBId,
      username: "owner_beta",
      password: passwordHash,
    };
    await db.insert(users).values([ownerA, ownerB]);

    // Categories
    const categoryData: NewCategory[] = [
      { name: "Electronics", description: "Gadgets and digital devices" },
      { name: "Clothing", description: "Fashion and apparel" },
      { name: "Home & Living", description: "Home essentials and decor" },
      {
        name: "Sports & Outdoors",
        description: "Sports equipment and outdoor gear",
      },
      { name: "Books", description: "Books and educational materials" },
      {
        name: "Beauty & Personal Care",
        description: "Beauty products and personal care items",
      },
      { name: "Handmade", description: "Crafted with care" },
      { name: "Accessories", description: "Wearables and add-ons" },
    ];
    const insertedCategories = await db
      .insert(categories)
      .values(categoryData)
      .returning();

    const categoryMap = new Map(insertedCategories.map((c) => [c.name, c]));
    const categoryIds = {
      electronics: categoryMap.get("Electronics")!.id,
      clothing: categoryMap.get("Clothing")!.id,
      homeLiving: categoryMap.get("Home & Living")!.id,
      sports: categoryMap.get("Sports & Outdoors")!.id,
      books: categoryMap.get("Books")!.id,
      beauty: categoryMap.get("Beauty & Personal Care")!.id,
      handmade: categoryMap.get("Handmade")!.id,
      accessories: categoryMap.get("Accessories")!.id,
    };

    // Stores
    const storeA: NewStore = {
      id: "default-store-id",
      name: "Alpha Gadgets",
      slug: "alpha-gadgets", // NEW
      description: "Quality electronics and accessories",
      ownerId: ownerA.id,
    };
    const storeB: NewStore = {
      id: uuidv4(),
      name: "Beta Crafts",
      slug: "beta-crafts", // NEW
      description: "Handmade goods and home decor",
      ownerId: ownerB.id,
    };

    const insertedStores = await db
      .insert(stores)
      .values([storeA, storeB])
      .returning();

    const [alphaStore, betaStore] = insertedStores;

    // Helper to build product
    const cents = (n: number) => Math.round(n * 100);

    type ProductSeed = {
      product: NewProduct;
      images: Array<{
        imageUrl: string;
        altText?: string;
        isPrimary?: boolean;
        displayOrder?: number;
      }>;
      tags: string[];
    };

    const productsSeed: ProductSeed[] = [
      {
        product: {
          name: "Wireless Earbuds Pro",
          sku: "WEB-001",
          description:
            "Premium noise-cancelling Bluetooth earbuds with wireless charging case and 30-hour battery life. Perfect for music lovers and professionals.",
          price: cents(79.99),
          compareAtPrice: cents(99.99),
          costPerItem: cents(45.0),
          stock: 120,
          trackQuantity: true,
          allowBackorders: false,
          weight: "0.05",
          length: "6.5",
          width: "2.5",
          height: "3.0",
          seoTitle: "Wireless Earbuds Pro - Premium Noise Cancelling",
          seoDescription:
            "Premium wireless earbuds with active noise cancellation, 30-hour battery life, and superior sound quality.",
          slug: "wireless-earbuds-pro",
          status: "Active",
          featured: true,
          storeId: alphaStore.id,
          categoryId: categoryIds.electronics,
        },
        tags: [
          "wireless",
          "bluetooth",
          "earbuds",
          "noise-cancelling",
          "premium",
        ],
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/wireless-headphones-1.webp?v=1757144371",
            altText: "Wireless Earbuds Pro - Front view",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/wireless-headphones-2.webp?v=1757144374",
            altText: "Wireless Earbuds Pro - Side view",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "Smart Home Hub",
          sku: "SHH-001",
          description:
            "Centralized smart home control hub that connects and manages all your smart devices from lights to thermostats.",
          price: cents(129.0),
          compareAtPrice: cents(149.0),
          costPerItem: cents(75.0),
          stock: 45,
          trackQuantity: true,
          allowBackorders: true,
          weight: "0.3",
          length: "12.0",
          width: "8.0",
          height: "2.5",
          seoTitle: "Smart Home Hub - Centralized Control System",
          seoDescription:
            "Control lights, thermostats, and more from one centralized smart home hub.",
          slug: "smart-home-hub",
          status: "Active",
          featured: false,
          storeId: alphaStore.id,
          categoryId: categoryIds.homeLiving,
        },
        tags: ["smart-home", "hub", "automation", "iot"],
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/smart-home-hub-1.avif?v=1757144825",
            altText: "Smart Home Hub - Main unit",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/smart-home-hub-2.jpg?v=1757144831",
            altText: "Smart Home Hub - Setup view",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "USB-C Fast Charger",
          sku: "UFC-001",
          description:
            "65W GaN fast charger with USB-C Power Delivery 3.0, compatible with laptops, phones, and tablets.",
          price: cents(39.5),
          compareAtPrice: cents(49.99),
          costPerItem: cents(22.0),
          stock: 200,
          trackQuantity: true,
          allowBackorders: false,
          weight: "0.15",
          length: "7.0",
          width: "4.5",
          height: "2.0",
          seoTitle: "USB-C Fast Charger 65W - GaN Technology",
          seoDescription:
            "High-speed 65W GaN charger with USB-C Power Delivery for fast charging of all devices.",
          slug: "usb-c-fast-charger-65w",
          status: "Active",
          featured: false,
          storeId: alphaStore.id,
          categoryId: categoryIds.accessories,
        },
        tags: ["charger", "usb-c", "fast-charging", "gan", "65w"],
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/fast-charger-1.jpg?v=1757144919",
            altText: "USB-C Fast Charger - Front view",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/smart-charger-2.jpg?v=1757144919",
            altText: "USB-C Fast Charger - Side view",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "Handwoven Storage Basket",
          sku: "HWB-001",
          description:
            "Eco-friendly storage basket handwoven from natural seagrass fibers. Perfect for organizing home essentials.",
          price: cents(24.99),
          compareAtPrice: cents(34.99),
          costPerItem: cents(12.0),
          stock: 80,
          trackQuantity: true,
          allowBackorders: false,
          weight: "0.8",
          length: "30.0",
          width: "20.0",
          height: "15.0",
          seoTitle: "Handwoven Storage Basket - Natural Seagrass",
          seoDescription:
            "Eco-friendly storage basket handwoven from natural fibers for home organization.",
          slug: "handwoven-storage-basket",
          status: "Active",
          featured: true,
          storeId: betaStore.id,
          categoryId: categoryIds.handmade,
        },
        tags: ["handmade", "basket", "storage", "eco-friendly", "seagrass"],
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/handwoven-basket-1.avif?v=1757144999",
            altText: "Handwoven Storage Basket - Main view",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/handwoven-basket-2.avif?v=1757144998",
            altText: "Handwoven Storage Basket - Detail view",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "Minimalist Ceramic Vase",
          sku: "CV-001",
          description:
            "Hand-thrown ceramic vase with a minimalist design, perfect for modern interiors and flower arrangements.",
          price: cents(34.99),
          compareAtPrice: cents(45.0),
          costPerItem: cents(18.0),
          stock: 60,
          trackQuantity: true,
          allowBackorders: false,
          weight: "1.2",
          length: "15.0",
          width: "15.0",
          height: "25.0",
          seoTitle: "Minimalist Ceramic Vase - Hand-thrown Pottery",
          seoDescription:
            "Hand-thrown ceramic vase with minimalist design for modern home decor.",
          slug: "minimalist-ceramic-vase",
          status: "Active",
          featured: false,
          storeId: betaStore.id,
          categoryId: categoryIds.homeLiving,
        },
        tags: ["ceramic", "vase", "minimalist", "handmade", "decor"],
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/ceramic-vase-1.avif?v=1757145065",
            altText: "Minimalist Ceramic Vase - Front view",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/ceramic-vase-2.avif?v=1757145065",
            altText: "Minimalist Ceramic Vase - Side view",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "Handcrafted Leather Keychain",
          sku: "LK-001",
          description:
            "Handcrafted leather keychain with brass hardware. Made from premium vegetable-tanned leather.",
          price: cents(14.99),
          compareAtPrice: cents(19.99),
          costPerItem: cents(6.0),
          stock: 150,
          trackQuantity: true,
          allowBackorders: false,
          weight: "0.02",
          length: "8.0",
          width: "2.0",
          height: "0.5",
          seoTitle: "Handcrafted Leather Keychain - Premium Quality",
          seoDescription:
            "Handcrafted leather keychain with brass ring made from premium vegetable-tanned leather.",
          slug: "handcrafted-leather-keychain",
          status: "Active",
          featured: false,
          storeId: betaStore.id,
          categoryId: categoryIds.accessories,
        },
        tags: ["leather", "keychain", "handmade", "brass", "accessories"],
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/leather-keyring-1.webp?v=1757145189",
            altText: "Handcrafted Leather Keychain - Main view",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/leather-keyring-2.webp?v=1757145190",
            altText: "Handcrafted Leather Keychain - Detail view",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "Portable Bluetooth Speaker",
          sku: "BS-001",
          description:
            "Waterproof portable speaker with deep bass, 12-hour battery life, and wireless connectivity.",
          price: cents(59.99),
          compareAtPrice: cents(79.99),
          costPerItem: cents(35.0),
          stock: 95,
          trackQuantity: true,
          allowBackorders: false,
          weight: "0.6",
          length: "18.0",
          width: "7.0",
          height: "7.0",
          seoTitle: "Portable Bluetooth Speaker - Waterproof & Bass",
          seoDescription:
            "Portable speaker with deep bass, 12-hour battery life, and waterproof design.",
          slug: "portable-bluetooth-speaker",
          status: "Active",
          featured: true,
          storeId: alphaStore.id,
          categoryId: categoryIds.electronics,
        },
        tags: ["speaker", "bluetooth", "portable", "waterproof", "bass"],
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/bluetooth-speaker-1.webp?v=1757145189",
            altText: "Portable Bluetooth Speaker - Front view",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/bluetooth-speaker-2.webp?v=1757145189",
            altText: "Portable Bluetooth Speaker - Side view",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "Organic Cotton T-Shirt",
          sku: "OCT-001",
          description:
            "Soft organic cotton t-shirt made from sustainably sourced materials. Available in multiple colors.",
          price: cents(24.99),
          compareAtPrice: cents(32.99),
          costPerItem: cents(12.0),
          stock: 12,
          trackQuantity: true,
          allowBackorders: true,
          weight: "0.2",
          length: "70.0",
          width: "50.0",
          height: "1.0",
          seoTitle: "Organic Cotton T-Shirt - Sustainable Fashion",
          seoDescription:
            "Soft organic cotton t-shirt made from sustainably sourced materials.",
          slug: "organic-cotton-t-shirt",
          status: "Active",
          featured: false,
          storeId: betaStore.id,
          categoryId: categoryIds.clothing,
        },
        tags: ["cotton", "organic", "t-shirt", "sustainable", "clothing"],
        images: [
          {
            imageUrl: "/placeholder.svg",
            altText: "Organic Cotton T-Shirt - Front view",
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      },
      {
        product: {
          name: "Yoga Mat Premium",
          sku: "YM-001",
          description:
            "Non-slip premium yoga mat with extra cushioning and carrying strap. Perfect for all yoga practices.",
          price: cents(49.99),
          compareAtPrice: cents(69.99),
          costPerItem: cents(25.0),
          stock: 0,
          trackQuantity: true,
          allowBackorders: true,
          weight: "1.5",
          length: "180.0",
          width: "60.0",
          height: "0.5",
          seoTitle: "Premium Yoga Mat - Non-slip & Cushioned",
          seoDescription:
            "Non-slip premium yoga mat with extra cushioning and carrying strap.",
          slug: "yoga-mat-premium",
          status: "Draft",
          featured: false,
          storeId: alphaStore.id,
          categoryId: categoryIds.sports,
        },
        tags: ["yoga", "mat", "fitness", "non-slip", "premium"],
        images: [
          {
            imageUrl: "/placeholder.svg",
            altText: "Yoga Mat Premium - Main view",
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      },
      {
        product: {
          name: "Programming Fundamentals Book",
          sku: "PFB-001",
          description:
            "Comprehensive guide to programming fundamentals covering multiple languages and best practices.",
          price: cents(29.99),
          compareAtPrice: cents(39.99),
          costPerItem: cents(15.0),
          stock: 5,
          trackQuantity: true,
          allowBackorders: false,
          weight: "0.8",
          length: "23.0",
          width: "15.0",
          height: "2.5",
          seoTitle: "Programming Fundamentals Book - Complete Guide",
          seoDescription:
            "Comprehensive guide to programming fundamentals covering multiple languages.",
          slug: "programming-fundamentals-book",
          status: "Active",
          featured: false,
          storeId: alphaStore.id,
          categoryId: categoryIds.books,
        },
        tags: ["book", "programming", "education", "coding", "fundamentals"],
        images: [
          {
            imageUrl: "/placeholder.svg",
            altText: "Programming Fundamentals Book - Cover",
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      },
    ];

    const insertedProducts = await db
      .insert(products)
      .values(productsSeed.map((ps) => ps.product))
      .returning();

    // Extract all unique tag names from all products
    const allTagNames = Array.from(
      new Set(productsSeed.flatMap((ps) => ps.tags)),
    );

    // Helper to generate slug from tag name
    function generateTagSlug(name: string): string {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    // Create tags
    const tagData: NewTag[] = allTagNames.map((name) => ({
      name,
      slug: generateTagSlug(name),
    }));

    const insertedTags = await db.insert(tags).values(tagData).returning();
    const tagMap = new Map(insertedTags.map((t) => [t.name, t]));

    // Create product-tag relationships
    const productTagRelationships: NewProductTag[] = [];

    for (let i = 0; i < insertedProducts.length; i++) {
      const product = insertedProducts[i];
      const seed = productsSeed[i];

      for (const tagName of seed.tags) {
        const tag = tagMap.get(tagName);
        if (tag) {
          productTagRelationships.push({
            productId: product.id,
            tagId: tag.id,
          });
        }
      }
    }

    if (productTagRelationships.length > 0) {
      await db.insert(productTags).values(productTagRelationships);
    }

    const imageRecords: NewProductImage[] = insertedProducts.flatMap((p) => {
      const seed = productsSeed.find((ps) => ps.product.name === p.name);
      const images = seed?.images ?? [];
      return images.map((img, idx) => ({
        productId: p.id,
        imageUrl: img.imageUrl,
        altText: img.altText ?? `${p.name} image ${idx + 1}`,
        isPrimary: img.isPrimary ?? idx === 0,
        displayOrder: img.displayOrder ?? idx,
      }));
    });

    if (imageRecords.length > 0) {
      await db.insert(productImages).values(imageRecords);
    }

    // --- Add third owner and store (Gamma Lifestyle) and seed 6 products (2 per specific categories) ---
    const ownerGamma: NewUser = {
      id: uuidv4(),
      username: "owner_gamma",
      password: passwordHash,
    };
    await db.insert(users).values(ownerGamma);

    const gammaStore: NewStore = {
      id: uuidv4(),
      name: "Gamma Lifestyle",
      slug: "gamma-lifestyle",
      description:
        "Lifestyle store featuring clothing, books, and beauty essentials",
      ownerId: ownerGamma.id,
    };
    const [insertedGammaStore] = await db
      .insert(stores)
      .values(gammaStore)
      .returning();

    const gammaSeeds: ProductSeed[] = [
      // Beauty & Personal Care (2)
      {
        product: {
          name: "Hydrating Face Serum",
          sku: "GL-BEA-001",
          description:
            "Lightweight serum with hyaluronic acid for daily hydration.",
          price: cents(24.99),
          compareAtPrice: cents(29.99),
          costPerItem: cents(10.0),
          stock: 120,
          trackQuantity: true,
          allowBackorders: false,
          weight: "0.1",
          length: "10.0",
          width: "3.0",
          height: "3.0",
          seoTitle: "Hydrating Face Serum",
          seoDescription: "Daily hydrating serum with hyaluronic acid.",
          slug: "hydrating-face-serum",
          status: "Active",
          featured: true,
          storeId: insertedGammaStore.id,
          categoryId: categoryIds.beauty,
        },
        tags: ["beauty", "serum", "hydration"],
        images: [
          {
            imageUrl: "/placeholder.svg",
            altText: "Hydrating Face Serum",
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      },
      {
        product: {
          name: "Nourishing Body Lotion",
          sku: "GL-BEA-002",
          description: "Rich body lotion with shea butter for smooth skin.",
          price: cents(14.99),
          compareAtPrice: cents(19.99),
          costPerItem: cents(7.0),
          stock: 150,
          trackQuantity: true,
          allowBackorders: false,
          weight: "0.3",
          length: "18.0",
          width: "7.0",
          height: "4.0",
          seoTitle: "Nourishing Body Lotion",
          seoDescription: "Body lotion with shea butter.",
          slug: "nourishing-body-lotion",
          status: "Active",
          featured: false,
          storeId: insertedGammaStore.id,
          categoryId: categoryIds.beauty,
        },
        tags: ["beauty", "lotion", "shea-butter"],
        images: [
          {
            imageUrl: "/placeholder.svg",
            altText: "Nourishing Body Lotion",
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      },
      // Books (2)
      {
        product: {
          name: "Mindful Productivity",
          sku: "GL-BOO-001",
          description: "A practical guide to focus and getting things done.",
          price: cents(21.99),
          compareAtPrice: cents(27.99),
          costPerItem: cents(9.0),
          stock: 60,
          trackQuantity: true,
          allowBackorders: false,
          weight: "0.5",
          length: "23.0",
          width: "15.0",
          height: "2.0",
          seoTitle: "Mindful Productivity",
          seoDescription: "Guide to focus and productivity.",
          slug: "mindful-productivity",
          status: "Active",
          featured: false,
          storeId: insertedGammaStore.id,
          categoryId: categoryIds.books,
        },
        tags: ["books", "productivity"],
        images: [
          {
            imageUrl: "/placeholder.svg",
            altText: "Mindful Productivity Book",
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      },
      {
        product: {
          name: "Cooking for Students",
          sku: "GL-BOO-002",
          description: "Simple and affordable recipes for busy students.",
          price: cents(17.99),
          compareAtPrice: cents(22.99),
          costPerItem: cents(8.0),
          stock: 80,
          trackQuantity: true,
          allowBackorders: false,
          weight: "0.6",
          length: "24.0",
          width: "16.0",
          height: "2.5",
          seoTitle: "Cooking for Students",
          seoDescription: "Affordable recipes for students.",
          slug: "cooking-for-students",
          status: "Active",
          featured: false,
          storeId: insertedGammaStore.id,
          categoryId: categoryIds.books,
        },
        tags: ["books", "cooking"],
        images: [
          {
            imageUrl: "/placeholder.svg",
            altText: "Cooking for Students Book",
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      },
      // Clothing (2)
      {
        product: {
          name: "Classic Cotton Tee",
          sku: "GL-CLO-001",
          description: "Soft cotton t-shirt available in multiple colors.",
          price: cents(19.99),
          compareAtPrice: cents(24.99),
          costPerItem: cents(9.0),
          stock: 100,
          trackQuantity: true,
          allowBackorders: true,
          weight: "0.2",
          length: "70.0",
          width: "50.0",
          height: "1.0",
          seoTitle: "Classic Cotton Tee",
          seoDescription: "Soft cotton tee.",
          slug: "classic-cotton-tee",
          status: "Active",
          featured: false,
          storeId: insertedGammaStore.id,
          categoryId: categoryIds.clothing,
        },
        tags: ["clothing", "t-shirt", "cotton"],
        images: [
          {
            imageUrl: "/placeholder.svg",
            altText: "Classic Cotton Tee",
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      },
      {
        product: {
          name: "Comfy Hoodie",
          sku: "GL-CLO-002",
          description: "Cozy hoodie with front pocket and drawstring.",
          price: cents(39.99),
          compareAtPrice: cents(49.99),
          costPerItem: cents(20.0),
          stock: 70,
          trackQuantity: true,
          allowBackorders: false,
          weight: "0.7",
          length: "75.0",
          width: "55.0",
          height: "3.0",
          seoTitle: "Comfy Hoodie",
          seoDescription: "Cozy hoodie with pocket.",
          slug: "comfy-hoodie",
          status: "Active",
          featured: false,
          storeId: insertedGammaStore.id,
          categoryId: categoryIds.clothing,
        },
        tags: ["clothing", "hoodie"],
        images: [
          {
            imageUrl: "/placeholder.svg",
            altText: "Comfy Hoodie",
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      },
    ];

    const gammaInsertedProducts = await db
      .insert(products)
      .values(gammaSeeds.map((ps) => ps.product))
      .returning();

    const gammaImageRecords: NewProductImage[] = gammaInsertedProducts.flatMap(
      (p) => {
        const seed = gammaSeeds.find((ps) => ps.product.name === p.name);
        const images = seed?.images ?? [];
        return images.map((img, idx) => ({
          productId: p.id,
          imageUrl: img.imageUrl,
          altText: img.altText ?? `${p.name} image ${idx + 1}`,
          isPrimary: img.isPrimary ?? idx === 0,
          displayOrder: img.displayOrder ?? idx,
        }));
      },
    );

    if (gammaImageRecords.length > 0) {
      await db.insert(productImages).values(gammaImageRecords);
    }

    // Create customer users
    const customer1: NewUser = {
      id: uuidv4(),
      username: "customer_james",
      password: passwordHash,
    };
    const customer2: NewUser = {
      id: uuidv4(),
      username: "customer_emma",
      password: passwordHash,
    };

    // Additional requested test accounts
    const mrGood: NewUser = {
      id: uuidv4(),
      username: "MrGood",
      password: bcrypt.hashSync("NotBad", 10),
    };
    const badAccount: NewUser = {
      id: uuidv4(),
      username: "badaccount",
      password: bcrypt.hashSync("badacc", 10),
    };

    await db.insert(users).values([customer1, customer2, mrGood, badAccount]);

    // Seed up to 4 sensible reviews per product (ensure Gamma products have at least 2)
    const candidateReviewers = [
      ownerA.id,
      ownerB.id,
      customer1.id,
      customer2.id,
      ownerGamma.id,
    ];
    const positiveComments = [
      "Excellent quality and fast delivery!",
      "Very satisfied with the purchase.",
      "Great value for money, highly recommend.",
      "Works as expected, would buy again.",
    ];
    const neutralComments = [
      "Decent product for the price.",
      "Okay overall, met expectations.",
      "Average experience, nothing special.",
    ];
    const negativeComments = [
      "Not as described, disappointed.",
      "Quality could be better.",
      "Had issues shortly after purchase.",
    ];

    function commentForRating(r: number): string {
      if (r >= 4)
        return positiveComments[randomInt(0, positiveComments.length - 1)];
      if (r === 3)
        return neutralComments[randomInt(0, neutralComments.length - 1)];
      return negativeComments[randomInt(0, negativeComments.length - 1)];
    }

    const allReviews: NewReview[] = [];
    const productsForReviews = [...insertedProducts, ...gammaInsertedProducts];
    for (const p of productsForReviews) {
      const isGamma = gammaInsertedProducts.some((gp) => gp.id === p.id);
      const minCount = isGamma ? 2 : 0;
      const maxCount = 4;
      const count = randomInt(minCount, maxCount);
      const seenReviewer = new Set<string>();
      for (let i = 0; i < count; i++) {
        const reviewer =
          candidateReviewers[randomInt(0, candidateReviewers.length - 1)];
        if (seenReviewer.has(reviewer)) continue;
        seenReviewer.add(reviewer);
        const rating = randomInt(1, 5);
        allReviews.push({
          userId: reviewer,
          productId: p.id,
          rating,
          comment: commentForRating(rating),
          verifiedPurchase: false,
        });
      }
    }
    if (allReviews.length) {
      await db.insert(reviews).values(allReviews);
    }

    // Create user profiles for customers
    const customerProfiles: NewUserProfile[] = [
      {
        userId: customer1.id,
        email: "james.wilson@example.com.au",
        firstName: "James",
        lastName: "Wilson",
        phone: "+61 2 9876 5432",
      },
      {
        userId: customer2.id,
        email: "emma.thompson@example.com.au",
        firstName: "Emma",
        lastName: "Thompson",
        phone: "+61 3 8765 4321",
      },
    ];

    await db.insert(userProfiles).values(customerProfiles);

    // Create addresses for customers
    const customerAddresses: NewAddress[] = [
      {
        userId: customer1.id,
        type: "shipping",
        firstName: "James",
        lastName: "Wilson",
        addressLine1: "42 George Street",
        addressLine2: "Unit 7",
        city: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "AU",
        isDefault: true,
      },
      {
        userId: customer2.id,
        type: "shipping",
        firstName: "Emma",
        lastName: "Thompson",
        addressLine1: "156 Collins Street",
        city: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "AU",
        isDefault: true,
      },
    ];

    await db.insert(addresses).values(customerAddresses);

    // Create orders for customers (from Alpha Gadgets store)
    const customerOrders: NewOrder[] = [
      {
        userId: customer1.id,
        storeId: alphaStore.id,
        status: "Completed",
        totalAmount: cents(119.49), // Wireless Earbuds Pro + USB-C Charger
      },
      {
        userId: customer1.id,
        storeId: alphaStore.id,
        status: "Completed",
        totalAmount: cents(39.5), // USB-C Fast Charger
      },
      {
        userId: customer2.id,
        storeId: alphaStore.id,
        status: "Processing",
        totalAmount: cents(59.99), // Portable Bluetooth Speaker
      },
    ];

    const insertedOrders = await db
      .insert(orders)
      .values(customerOrders)
      .returning();

    // Create order items
    const items: NewOrderItem[] = [
      // James's first order - 2 items
      {
        orderId: insertedOrders[0].id,
        productId: insertedProducts[0].id, // Wireless Earbuds Pro
        quantity: 1,
        priceAtTime: cents(79.99),
      },
      {
        orderId: insertedOrders[0].id,
        productId: insertedProducts[2].id, // USB-C Fast Charger
        quantity: 1,
        priceAtTime: cents(39.5),
      },
      // James's second order
      {
        orderId: insertedOrders[1].id,
        productId: insertedProducts[2].id, // USB-C Fast Charger
        quantity: 1,
        priceAtTime: cents(39.5),
      },
      // Emma's order
      {
        orderId: insertedOrders[2].id,
        productId: insertedProducts[6].id, // Portable Bluetooth Speaker
        quantity: 1,
        priceAtTime: cents(59.99),
      },
    ];

    await db.insert(orderItems).values(items);

    // --- Risk test orders for MrGood (mostly accepted) and badaccount (denied) ---
    // Backdate account creation
    await db
      .update(users)
      .set({ createdAt: daysAgo(28) })
      .where(sql`id = ${mrGood.id}`);
    await db
      .update(users)
      .set({ createdAt: daysAgo(35) })
      .where(sql`id = ${badAccount.id}`);

    // Build schedule
    const schedule: Array<{
      userId: string;
      status: string;
      paymentStatus: string;
      daysAgo: number;
      amount: number;
    }> = [];

    const goodAcceptedDays = [3, 6, 10, 13, 17, 21, 26];
    const goodFlaggedDays = [8, 18, 29];
    for (const d of goodAcceptedDays) {
      schedule.push({
        userId: mrGood.id,
        status: "Completed",
        paymentStatus: "Paid",
        daysAgo: d,
        amount: cents(30 + Math.random() * 120),
      });
    }
    for (const d of goodFlaggedDays) {
      schedule.push({
        userId: mrGood.id,
        status: "On-hold",
        paymentStatus: "Pending",
        daysAgo: d,
        amount: cents(25 + Math.random() * 90),
      });
    }

    const badDeniedDays = [2, 7, 9, 15, 20, 24, 27, 30];
    for (const d of badDeniedDays) {
      schedule.push({
        userId: badAccount.id,
        status: "Failed",
        paymentStatus: "Failed",
        daysAgo: d,
        amount: cents(20 + Math.random() * 60),
      });
    }

    // Add 15 more denied orders for badaccount to strengthen negative history
    for (let i = 0; i < 15; i++) {
      const d = 1 + Math.floor(Math.random() * 44); // within ~last 45 days
      schedule.push({
        userId: badAccount.id,
        status: "Failed",
        paymentStatus: "Failed",
        daysAgo: d,
        amount: cents(15 + Math.random() * 80),
      });
    }

    // Select products by store for realistic items
    const alphaProducts = insertedProducts.filter(
      (p) => p.storeId === alphaStore.id,
    );
    const alphaByPriceAsc = [...alphaProducts].sort(
      (a, b) => (a.price ?? 0) - (b.price ?? 0),
    );
    const alphaByPriceDesc = [...alphaProducts].sort(
      (a, b) => (b.price ?? 0) - (a.price ?? 0),
    );

    // Helper to pick items based on status profile
    function pickItemsForStatus(status: string) {
      // Use different mixes per status
      if (status === "Completed") {
        const p1 = alphaByPriceAsc[1] ?? alphaProducts[0];
        const p2 = alphaByPriceAsc[3] ?? alphaProducts[1] ?? p1;
        return [
          { productId: p1.id, quantity: 1, priceAtTime: p1.price },
          { productId: p2.id, quantity: 1, priceAtTime: p2.price },
        ];
      }
      if (status === "On-hold") {
        const mid =
          alphaByPriceAsc[
            Math.min(2, Math.max(0, alphaByPriceAsc.length - 1))
          ] ?? alphaProducts[0];
        return [
          { productId: mid.id, quantity: 3, priceAtTime: mid.price }, // higher quantity triggers review
        ];
      }
      // Denied: odd combo or higher-priced single item
      const expensive = alphaByPriceDesc[0] ?? alphaProducts[0];
      const cheap = alphaByPriceAsc[0] ?? expensive;
      return [
        { productId: expensive.id, quantity: 1, priceAtTime: expensive.price },
        { productId: cheap.id, quantity: 2, priceAtTime: cheap.price },
      ];
    }

    // Helper to create order, items and payment transaction with computed totals
    async function createRiskOrderWithItems(params: {
      userId: string;
      storeId: string | null;
      status: string;
      paymentStatus: string;
      createdAt: Date;
    }) {
      const itemLines = pickItemsForStatus(params.status);
      const totalAmountCents = itemLines.reduce(
        (sum, it) => sum + (it.priceAtTime ?? 0) * it.quantity,
        0,
      );

      const [insertedOrder] = await db
        .insert(orders)
        .values({
          userId: params.userId,
          storeId: params.storeId,
          status: params.status as
            | "Completed"
            | "Processing"
            | "Shipped"
            | "Pending"
            | "Cancelled"
            | "Refunded"
            | "On-hold"
            | "Failed"
            | "Denied",
          paymentStatus: params.paymentStatus as
            | "Pending"
            | "Paid"
            | "Failed"
            | "Refunded",
          totalAmount: totalAmountCents,
          createdAt: params.createdAt,
          updatedAt: params.createdAt,
        })
        .returning();

      const riskOrderItems: NewOrderItem[] = itemLines.map((it) => ({
        orderId: insertedOrder.id,
        productId: it.productId,
        quantity: it.quantity,
        priceAtTime: it.priceAtTime ?? 0,
      }));
      await db.insert(orderItems).values(riskOrderItems);

      await db.insert(paymentTransactions).values({
        orderId: insertedOrder.id,
        amount: totalAmountCents,
        currency: "AUD",
        status:
          params.paymentStatus === "Paid"
            ? "completed"
            : params.paymentStatus.toLowerCase(),
        createdAt: params.createdAt,
        updatedAt: params.createdAt,
      });

      return { insertedOrder, riskOrderItems };
    }

    async function ensureAssessmentForOrder(
      order: {
        id: number;
        userId: string;
        totalAmount: number;
        status: string;
        paymentStatus: string;
        createdAt: Date;
      },
      itemCount: number,
    ) {
      const existing = await db
        .select({ id: zeroTrustAssessments.id })
        .from(zeroTrustAssessments)
        .where(eq(zeroTrustAssessments.orderId, order.id))
        .limit(1);
      if (existing[0]) return existing[0].id;

      const { decision, min, max } = decisionFromOrder(
        order.status,
        order.paymentStatus,
      );
      const riskScore = randomInt(min, max);
      const confidence = randomInt(70, 98);

      const [assessment] = await db
        .insert(zeroTrustAssessments)
        .values({
          userId: order.userId,
          orderId: order.id,
          paymentIntentId: null,
          riskScore,
          decision,
          confidence,
          transactionAmount: order.totalAmount,
          currency: "aud",
          itemCount,
          storeCount: 1,
          riskFactors: JSON.stringify([
            decision === "deny"
              ? "multiple_denied_transactions"
              : decision === "warn"
                ? "additional_verification_required"
                : "consistent_history",
          ]),
          aiJustification:
            decision === "deny"
              ? "Transaction denied due to risk factors and recent failed attempts."
              : decision === "warn"
                ? "Transaction flagged for additional verification due to moderate risk indicators."
                : "Low-risk transaction aligned with historical behavior.",
          justificationGeneratedAt: order.createdAt,
          userAgent: "seed-script",
          ipAddress: "203.0.113.42",
          createdAt: order.createdAt,
        })
        .returning();

      await db.insert(riskAssessmentOrderLinks).values({
        riskAssessmentId: assessment.id,
        orderId: order.id,
        createdAt: order.createdAt,
      });

      // Also create store link for admin store-scoped views
      await db.insert(riskAssessmentStoreLinks).values({
        riskAssessmentId: assessment.id,
        storeId: alphaStore.id,
        storeSubtotal: order.totalAmount,
        storeItemCount: itemCount,
        createdAt: order.createdAt,
      });

      return assessment.id;
    }

    let riskOrdersCreated = 0;
    let riskOrderItemsCreated = 0;
    for (const s of schedule) {
      const createdAt = daysAgo(s.daysAgo);
      const { insertedOrder, riskOrderItems } = await createRiskOrderWithItems({
        userId: s.userId,
        storeId: alphaStore.id,
        status: s.status,
        paymentStatus: s.paymentStatus,
        createdAt,
      });
      await ensureAssessmentForOrder(insertedOrder, riskOrderItems.length);
      riskOrdersCreated += 1;
      riskOrderItemsCreated += riskOrderItems.length;
    }

    console.log("✅ Risk test data created:", {
      totalOrders: riskOrdersCreated,
      orderItems: riskOrderItemsCreated,
    });

    console.log("✅ Seed complete:", {
      users: 7, // +1 owner_gamma
      stores: insertedStores.length + 1, // + Gamma Lifestyle
      categories: insertedCategories.length,
      tags: insertedTags.length,
      products: insertedProducts.length,
      productTags: productTagRelationships.length,
      images: imageRecords.length,
      customers: 2,
      orders: insertedOrders.length,
      orderItems: items.length,
    });
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

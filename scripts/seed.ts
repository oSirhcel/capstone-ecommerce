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
} from "../src/server/db/schema";
import { eq, sql, type InferInsertModel } from "drizzle-orm";

type NewUser = InferInsertModel<typeof users>;
type NewStore = InferInsertModel<typeof stores>;
type NewCategory = InferInsertModel<typeof categories>;
type NewProduct = InferInsertModel<typeof products>;
type NewProductImage = InferInsertModel<typeof productImages>;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in environment");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    // Clean existing data using TRUNCATE to satisfy linter and keep FK order
    await db.execute(
      sql`TRUNCATE TABLE "product_images", "products", "stores", "categories" RESTART IDENTITY CASCADE`,
    );

    // Create two store owners
    const passwordHash = bcrypt.hashSync("password123", 10);
    const ownerA: NewUser = {
      id: uuidv4(),
      username: "owner_alpha",
      password: passwordHash,
      userType: "owner",
    };
    const ownerB: NewUser = {
      id: uuidv4(),
      username: "owner_beta",
      password: passwordHash,
      userType: "owner",
    };

    // Upsert-like: insert if not exists by id
    const existingOwnerA = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, ownerA.username));
    if (existingOwnerA.length === 0) {
      await db.insert(users).values(ownerA);
    }
    const existingOwnerB = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, ownerB.username));
    if (existingOwnerB.length === 0) {
      await db.insert(users).values(ownerB);
    }

    // Categories
    const categoryData: NewCategory[] = [
      { name: "Electronics", description: "Gadgets and digital devices" },
      { name: "Handmade", description: "Crafted with care" },
      { name: "Home & Living", description: "Home essentials and decor" },
      { name: "Accessories", description: "Wearables and add-ons" },
    ];
    const insertedCategories = await db
      .insert(categories)
      .values(categoryData)
      .returning();

    const categoryMap = new Map(insertedCategories.map((c) => [c.name, c]));
    const categoryIds = {
      electronics: categoryMap.get("Electronics")!.id,
      handmade: categoryMap.get("Handmade")!.id,
      homeLiving: categoryMap.get("Home & Living")!.id,
      accessories: categoryMap.get("Accessories")!.id,
    };

    // Stores
    const storeA: NewStore = {
      id: uuidv4(),
      name: "Alpha Gadgets",
      description: "Quality electronics and accessories",
      ownerId: ownerA.id,
    };
    const storeB: NewStore = {
      id: uuidv4(),
      name: "Beta Crafts",
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
    };

    const productsSeed: ProductSeed[] = [
      {
        product: {
          name: "Wireless Earbuds",
          description: "Noise-cancelling Bluetooth earbuds with charging case",
          price: cents(79.99),
          stock: 120,
          storeId: alphaStore.id,
          categoryId: categoryIds.electronics,
        },
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/wireless-headphones-1.webp?v=1757144371",
            altText: "Wireless Earbuds image 1",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/wireless-headphones-2.webp?v=1757144374",
            altText: "Wireless Earbuds image 2",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "Smart Home Hub",
          description: "Control lights, thermostats, and more from one hub",
          price: cents(129.0),
          stock: 45,
          storeId: alphaStore.id,
          categoryId: categoryIds.homeLiving,
        },
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/smart-home-hub-1.avif?v=1757144825",
            altText: "Smart Home Hub image 1",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/smart-home-hub-2.jpg?v=1757144831",
            altText: "Smart Home Hub image 2",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "USB-C Fast Charger",
          description: "65W GaN fast charger with USB-C Power Delivery",
          price: cents(39.5),
          stock: 200,
          storeId: alphaStore.id,
          categoryId: categoryIds.accessories,
        },
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/fast-charger-1.jpg?v=1757144919",
            altText: "USB-C Fast Charger image 1",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/smart-charger-2.jpg?v=1757144919",
            altText: "USB-C Fast Charger image 2",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "Handwoven Basket",
          description:
            "Eco-friendly storage basket handwoven from natural fibers",
          price: cents(24.99),
          stock: 80,
          storeId: betaStore.id,
          categoryId: categoryIds.handmade,
        },
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/handwoven-basket-1.avif?v=1757144999",
            altText: "Handwoven Basket image 1",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/handwoven-basket-2.avif?v=1757144998",
            altText: "Handwoven Basket image 2",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "Ceramic Vase",
          description: "Minimalist ceramic vase for modern interiors",
          price: cents(34.99),
          stock: 60,
          storeId: betaStore.id,
          categoryId: categoryIds.homeLiving,
        },
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/ceramic-vase-1.avif?v=1757145065",
            altText: "Ceramic Vase image 1",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/ceramic-vase-2.avif?v=1757145065",
            altText: "Ceramic Vase image 2",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "Leather Keychain",
          description: "Handcrafted leather keychain with brass ring",
          price: cents(14.99),
          stock: 150,
          storeId: betaStore.id,
          categoryId: categoryIds.accessories,
        },
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/leather-keyring-1.webp?v=1757145189",
            altText: "Leather Keychain image 1",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/leather-keyring-2.webp?v=1757145190",
            altText: "Leather Keychain image 2",
            displayOrder: 1,
          },
        ],
      },
      {
        product: {
          name: "Bluetooth Speaker",
          description: "Portable speaker with deep bass and 12-hour battery",
          price: cents(59.99),
          stock: 95,
          storeId: alphaStore.id,
          categoryId: categoryIds.electronics,
        },
        images: [
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/bluetooth-speaker-1.webp?v=1757145189",
            altText: "Bluetooth Speaker image 1",
            isPrimary: true,
            displayOrder: 0,
          },
          {
            imageUrl:
              "https://cdn.shopify.com/s/files/1/0663/3229/5254/files/bluetooth-speaker-2.webp?v=1757145189",
            altText: "Bluetooth Speaker image 2",
            displayOrder: 1,
          },
        ],
      },
    ];

    const insertedProducts = await db
      .insert(products)
      .values(productsSeed.map((ps) => ps.product))
      .returning();

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

    console.log("✅ Seed complete:", {
      users: 2,
      stores: insertedStores.length,
      categories: insertedCategories.length,
      products: insertedProducts.length,
      images: imageRecords.length,
    });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

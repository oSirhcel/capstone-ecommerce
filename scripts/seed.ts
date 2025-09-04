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

    const productsData: NewProduct[] = [
      {
        name: "Wireless Earbuds",
        description: "Noise-cancelling Bluetooth earbuds with charging case",
        price: cents(79.99),
        stock: 120,
        storeId: alphaStore.id,
        categoryId: categoryIds.electronics,
      },
      {
        name: "Smart Home Hub",
        description: "Control lights, thermostats, and more from one hub",
        price: cents(129.0),
        stock: 45,
        storeId: alphaStore.id,
        categoryId: categoryIds.homeLiving,
      },
      {
        name: "USB-C Fast Charger",
        description: "65W GaN fast charger with USB-C Power Delivery",
        price: cents(39.5),
        stock: 200,
        storeId: alphaStore.id,
        categoryId: categoryIds.accessories,
      },
      {
        name: "Handwoven Basket",
        description:
          "Eco-friendly storage basket handwoven from natural fibers",
        price: cents(24.99),
        stock: 80,
        storeId: betaStore.id,
        categoryId: categoryIds.handmade,
      },
      {
        name: "Ceramic Vase",
        description: "Minimalist ceramic vase for modern interiors",
        price: cents(34.99),
        stock: 60,
        storeId: betaStore.id,
        categoryId: categoryIds.homeLiving,
      },
      {
        name: "Leather Keychain",
        description: "Handcrafted leather keychain with brass ring",
        price: cents(14.99),
        stock: 150,
        storeId: betaStore.id,
        categoryId: categoryIds.accessories,
      },
      {
        name: "Bluetooth Speaker",
        description: "Portable speaker with deep bass and 12-hour battery",
        price: cents(59.99),
        stock: 95,
        storeId: alphaStore.id,
        categoryId: categoryIds.electronics,
      },
    ];

    const insertedProducts = await db
      .insert(products)
      .values(productsData)
      .returning();

    // Product images (set first as primary)
    const imageRecords: NewProductImage[] = insertedProducts.flatMap((p) => {
      const baseSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return [
        {
          productId: p.id,
          imageUrl: `/images/${baseSlug}-1.jpg`,
          altText: `${p.name} image 1`,
          isPrimary: true,
          displayOrder: 0,
        },
        {
          productId: p.id,
          imageUrl: `/images/${baseSlug}-2.jpg`,
          altText: `${p.name} image 2`,
          isPrimary: false,
          displayOrder: 1,
        },
      ];
    });

    await db.insert(productImages).values(imageRecords);

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

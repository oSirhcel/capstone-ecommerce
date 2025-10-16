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
  userProfiles,
  orders,
  orderItems,
  addresses,
} from "../src/server/db/schema";
import { sql, type InferInsertModel } from "drizzle-orm";

type NewUser = InferInsertModel<typeof users>;
type NewStore = InferInsertModel<typeof stores>;
type NewCategory = InferInsertModel<typeof categories>;
type NewProduct = InferInsertModel<typeof products>;
type NewProductImage = InferInsertModel<typeof productImages>;
type NewUserProfile = InferInsertModel<typeof userProfiles>;
type NewOrder = InferInsertModel<typeof orders>;
type NewOrderItem = InferInsertModel<typeof orderItems>;
type NewAddress = InferInsertModel<typeof addresses>;

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
        "product_images", 
        "order_items", 
        "orders", 
        "addresses", 
        "user_profiles", 
        "products", 
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
          status: "active",
          featured: true,
          tags: JSON.stringify([
            "wireless",
            "bluetooth",
            "earbuds",
            "noise-cancelling",
            "premium",
          ]),
          storeId: alphaStore.id,
          categoryId: categoryIds.electronics,
        },
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
          status: "active",
          featured: false,
          tags: JSON.stringify(["smart-home", "hub", "automation", "iot"]),
          storeId: alphaStore.id,
          categoryId: categoryIds.homeLiving,
        },
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
          status: "active",
          featured: false,
          tags: JSON.stringify([
            "charger",
            "usb-c",
            "fast-charging",
            "gan",
            "65w",
          ]),
          storeId: alphaStore.id,
          categoryId: categoryIds.accessories,
        },
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
          status: "active",
          featured: true,
          tags: JSON.stringify([
            "handmade",
            "basket",
            "storage",
            "eco-friendly",
            "seagrass",
          ]),
          storeId: betaStore.id,
          categoryId: categoryIds.handmade,
        },
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
          status: "active",
          featured: false,
          tags: JSON.stringify([
            "ceramic",
            "vase",
            "minimalist",
            "handmade",
            "decor",
          ]),
          storeId: betaStore.id,
          categoryId: categoryIds.homeLiving,
        },
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
          status: "active",
          featured: false,
          tags: JSON.stringify([
            "leather",
            "keychain",
            "handmade",
            "brass",
            "accessories",
          ]),
          storeId: betaStore.id,
          categoryId: categoryIds.accessories,
        },
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
          status: "active",
          featured: true,
          tags: JSON.stringify([
            "speaker",
            "bluetooth",
            "portable",
            "waterproof",
            "bass",
          ]),
          storeId: alphaStore.id,
          categoryId: categoryIds.electronics,
        },
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
          status: "active",
          featured: false,
          tags: JSON.stringify([
            "cotton",
            "organic",
            "t-shirt",
            "sustainable",
            "clothing",
          ]),
          storeId: betaStore.id,
          categoryId: categoryIds.clothing,
        },
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
          status: "draft",
          featured: false,
          tags: JSON.stringify([
            "yoga",
            "mat",
            "fitness",
            "non-slip",
            "premium",
          ]),
          storeId: alphaStore.id,
          categoryId: categoryIds.sports,
        },
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
          status: "active",
          featured: false,
          tags: JSON.stringify([
            "book",
            "programming",
            "education",
            "coding",
            "fundamentals",
          ]),
          storeId: alphaStore.id,
          categoryId: categoryIds.books,
        },
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

    await db.insert(users).values([customer1, customer2]);

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
        postalCode: "2000",
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
        postalCode: "3000",
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
        status: "completed",
        totalAmount: cents(119.49), // Wireless Earbuds Pro + USB-C Charger
      },
      {
        userId: customer1.id,
        storeId: alphaStore.id,
        status: "completed",
        totalAmount: cents(39.5), // USB-C Fast Charger
      },
      {
        userId: customer2.id,
        storeId: alphaStore.id,
        status: "processing",
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

    console.log("✅ Seed complete:", {
      users: 4, // 2 owners + 2 customers
      stores: insertedStores.length,
      categories: insertedCategories.length,
      products: insertedProducts.length,
      images: imageRecords.length,
      customers: 2,
      orders: insertedOrders.length,
      orderItems: items.length,
    });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

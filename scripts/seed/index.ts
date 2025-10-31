import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

import { seedUsers } from "./users";
import { seedStores } from "./stores";
import { seedCategories } from "./categories";
import { seedTags } from "./tags";
import { seedProducts } from "./products";
import { seedAddresses } from "./addresses";
import { seedReviews } from "./reviews";

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
        "zero_trust_verifications",
        "risk_assessment_store_links",
        "risk_assessment_order_links",
        "zero_trust_assessments",
        "payment_transactions",
        "order_shipping",
        "inventory_logs",
        "order_discounts",
        "discounts",
        "store_payment_providers",
        "payment_methods",
        "shipping_methods",
        "order_addresses",
        "addresses",
        "wishlists",
        "reviews",
        "order_items",
        "orders",
        "cart_items",
        "carts",
        "product_tags",
        "tags",
        "product_images",
        "products",
        "store_settings",
        "stores",
        "categories",
        "store_customer_profiles",
        "user_profiles",
        "users"
        RESTART IDENTITY CASCADE`,
    );

    console.log("✅ Database reset complete\n");

    // Seed data in order
    const users = await seedUsers(db);
    console.log();

    const stores = await seedStores(db, users);
    console.log();

    const categories = await seedCategories(db);
    console.log();

    const tags = await seedTags(db);
    console.log();

    const products = await seedProducts(db, stores, categories, tags);
    console.log();

    const addresses = await seedAddresses(db, users);
    console.log();

    const reviews = await seedReviews(db, users, products);
    console.log();

    console.log("🎉 Seed complete!");
    console.log("\n📊 Summary:");
    console.log(`   Users:      ${users.length}`);
    console.log(`   Stores:     ${stores.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Tags:       ${tags.length}`);
    console.log(`   Products:   ${products.length}`);
    console.log(`   Addresses:  ${addresses.length}`);
    console.log(`   Reviews:    ${reviews.length}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

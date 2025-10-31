import { v4 as uuidv4 } from "uuid";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { stores, storeSettings } from "../../src/server/db/schema";
import type { InferInsertModel } from "drizzle-orm";
import { generateSlug, daysAgo } from "./utils";
import type { SeededUser } from "./users";

type NewStore = InferInsertModel<typeof stores>;
type NewStoreSettings = InferInsertModel<typeof storeSettings>;

export interface SeededStore {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  categoryFocus: string[];
}

const storeData = [
  // Single category stores (specialized)
  {
    name: "Alpha Gadgets",
    description: "Premium electronics and tech accessories for modern living",
    focus: ["Electronics"],
  },
  {
    name: "Beta Crafts",
    description: "Handmade goods and artisan crafts",
    focus: ["Handmade"],
  },
  {
    name: "Theta Book Haven",
    description: "Discover your next great read from our curated collection",
    focus: ["Books"],
  },
  {
    name: "Pure Electronics",
    description: "Your one-stop shop for cutting-edge electronics",
    focus: ["Electronics"],
  },
  {
    name: "Clothing Central",
    description: "Fashion-forward clothing for every style",
    focus: ["Clothing"],
  },
  {
    name: "Home Essentials",
    description: "Transform your space with quality home essentials",
    focus: ["Home & Living"],
  },
  {
    name: "Outdoor Pro",
    description: "Premium outdoor gear for nature enthusiasts",
    focus: ["Sports & Outdoors"],
  },
  {
    name: "Beauty Palace",
    description: "Natural and effective beauty products for glowing skin",
    focus: ["Beauty & Personal Care"],
  },
  {
    name: "Accessory World",
    description: "Complete your look with our accessory collection",
    focus: ["Accessories"],
  },
  {
    name: "Electronics Direct",
    description: "Direct from manufacturer electronics",
    focus: ["Electronics"],
  },
  {
    name: "Fashion Forward",
    description: "Trendsetting clothing for the modern wardrobe",
    focus: ["Clothing"],
  },

  // Two category stores (focused specialists)
  {
    name: "Delta Electronics Hub",
    description: "Electronics and tech accessories",
    focus: ["Electronics", "Accessories"],
  },
  {
    name: "Zeta Fashion Boutique",
    description: "Sustainable and stylish clothing for every occasion",
    focus: ["Clothing", "Accessories"],
  },
  {
    name: "Eta Sports & Outdoors",
    description: "Gear up for adventure with premium sports equipment",
    focus: ["Sports & Outdoors", "Accessories"],
  },
  {
    name: "Iota Beauty Bar",
    description: "Beauty products and personal care essentials",
    focus: ["Beauty & Personal Care", "Accessories"],
  },
  {
    name: "Epsilon Home & Living",
    description: "Home essentials and handmade decor",
    focus: ["Home & Living", "Handmade"],
  },
  {
    name: "Kappa Outdoor Adventures",
    description: "Outdoor gear and sports equipment",
    focus: ["Sports & Outdoors", "Accessories"],
  },
  {
    name: "Lambda Tech Solutions",
    description: "Technology and smart home devices",
    focus: ["Electronics", "Home & Living"],
  },
  {
    name: "Mu Home Decor",
    description: "Elegant decor pieces to personalize your space",
    focus: ["Home & Living", "Handmade"],
  },
  {
    name: "Nu Wellness Essentials",
    description: "Holistic wellness products for mind and body",
    focus: ["Beauty & Personal Care", "Sports & Outdoors"],
  },
  {
    name: "Xi Garden & Outdoor",
    description: "Everything you need for a beautiful garden",
    focus: ["Home & Living", "Sports & Outdoors"],
  },

  // Three or more category stores (generalists)
  {
    name: "Gamma Lifestyle",
    description:
      "Curated lifestyle essentials for beauty, fashion, and wellness",
    focus: ["Beauty & Personal Care", "Clothing", "Books"],
  },
  {
    name: "Omicron Kids Corner",
    description: "Quality products for children and families",
    focus: ["Clothing", "Books", "Accessories"],
  },
  {
    name: "Mega Mart",
    description: "Everything you need in one place",
    focus: ["Electronics", "Clothing", "Home & Living", "Accessories"],
  },
  {
    name: "The Emporium",
    description: "A diverse collection of quality products",
    focus: ["Electronics", "Clothing", "Books", "Beauty & Personal Care"],
  },
  {
    name: "Universal Store",
    description: "Your one-stop shop for all categories",
    focus: [
      "Electronics",
      "Clothing",
      "Home & Living",
      "Sports & Outdoors",
      "Accessories",
    ],
  },
];

export async function seedStores(
  db: NodePgDatabase<Record<string, never>>,
  users: SeededUser[],
): Promise<SeededStore[]> {
  console.log("🌱 Seeding stores...");

  const storeOwners = users.filter((u) => u.role === "store_owner");

  if (storeOwners.length < storeData.length) {
    throw new Error(
      `Expected at least ${storeData.length} store owners, got ${storeOwners.length}`,
    );
  }

  const seededStores: SeededStore[] = [];
  const storeInserts: NewStore[] = [];
  const settingsInserts: NewStoreSettings[] = [];

  for (let i = 0; i < storeData.length; i++) {
    const data = storeData[i];
    const owner = storeOwners[i];

    const id = i === 0 ? "default-store-id" : uuidv4();
    const slug = generateSlug(data.name);

    storeInserts.push({
      id,
      name: data.name,
      slug,
      description: data.description,
      ownerId: owner.id,
      createdAt: daysAgo(Math.floor(Math.random() * 300) + 90),
    });

    // GST rate is 10% in Australia
    settingsInserts.push({
      storeId: id,
      currency: "AUD",
      taxRate: "0.1000",
      gstRegistered: true,
      businessName: `${data.name} Pty Ltd`,
      contactEmail: `contact@${slug.replace(/\s+/g, "")}.com.au`,
    });

    seededStores.push({
      id,
      name: data.name,
      slug,
      ownerId: owner.id,
      categoryFocus: data.focus,
    });
  }

  // Create a store for at least one test user
  const testUsers = users.filter((u) => u.role === "test_account");
  if (testUsers.length > 0) {
    const testUser = testUsers[0]; // Use first test user
    const testStoreData = {
      name: "Test Store",
      description: "A test store with products for testing purposes",
      focus: ["Electronics", "Accessories"],
    };

    const id = uuidv4();
    const slug = generateSlug(testStoreData.name);

    storeInserts.push({
      id,
      name: testStoreData.name,
      slug,
      description: testStoreData.description,
      ownerId: testUser.id,
      createdAt: daysAgo(Math.floor(Math.random() * 300) + 90),
    });

    settingsInserts.push({
      storeId: id,
      currency: "AUD",
      taxRate: "0.1000",
      gstRegistered: true,
      businessName: `${testStoreData.name} Pty Ltd`,
      contactEmail: `contact@${slug.replace(/\s+/g, "")}.com.au`,
    });

    seededStores.push({
      id,
      name: testStoreData.name,
      slug,
      ownerId: testUser.id,
      categoryFocus: testStoreData.focus,
    });

    console.log(`  Created store for test user: ${testUser.username}`);
  }

  await db.insert(stores).values(storeInserts);
  await db.insert(storeSettings).values(settingsInserts);

  console.log(`✅ Created ${seededStores.length} stores with settings`);

  return seededStores;
}

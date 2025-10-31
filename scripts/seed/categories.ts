import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { categories } from "../../src/server/db/schema";

export interface SeededCategory {
  id: number;
  name: string;
  description: string;
}

const categoryData = [
  {
    name: "Electronics",
    description: "Gadgets, devices, and electronic accessories",
    image: "/images/categories/electronics.jpg",
  },
  {
    name: "Fashion & Clothing",
    description: "Fashion and apparel for all occasions",
    image: "/images/categories/fashion.jpg",
  },
  {
    name: "Home & Living",
    description: "Home essentials, furniture, and decor",
    image: "/images/categories/home.jpg",
  },
  {
    name: "Sports & Outdoors",
    description: "Sports equipment and outdoor adventure gear",
    image: "/images/categories/sports.jpg",
  },
  {
    name: "Beauty & Personal Care",
    description: "Beauty products and personal care essentials",
    image: "/images/categories/beauty.jpg",
  },
  {
    name: "Handmade",
    description: "Artisan crafts and handmade goods",
    image: "/images/categories/handmade.jpg",
  },
];

export async function seedCategories(
  db: NodePgDatabase<Record<string, never>>,
): Promise<SeededCategory[]> {
  console.log("🌱 Seeding categories...");

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData)
    .returning();

  console.log(`✅ Created ${insertedCategories.length} categories`);

  return insertedCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description ?? "",
  }));
}

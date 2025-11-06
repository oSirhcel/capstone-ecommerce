import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { categories } from "../../src/server/db/schema";

export interface SeededCategory {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
}

const categoryData = [
  {
    name: "Electronics",
    description: "Gadgets, devices, and electronic accessories",
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6Reoe6vhU3JSsFgCZf945QNd2ntW8DyKYic0AV",
  },
  {
    name: "Fashion & Clothing",
    description: "Fashion and apparel for all occasions",
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RGPxgQyiLEQ4ijtCv3WVFlocBkSarzOZKYuhg",
  },
  {
    name: "Home & Living",
    description: "Home essentials, furniture, and decor",
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RzOM1k9b8OKfwAQacmV1IPECbnL3kuNBhjXtM",
  },
  {
    name: "Sports & Outdoors",
    description: "Sports equipment and outdoor adventure gear",
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RaThm28RI5Cg86dUKrxTfqiA2PMylo3YFOajW",
  },
  {
    name: "Beauty & Personal Care",
    description: "Beauty products and personal care essentials",
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RfpuQHv1wBiIN2kxE3aJ4c6Ry8FDW0Qhuov7z",
  },
  {
    name: "Handmade",
    description: "Artisan crafts and handmade goods",
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RZkOh7FJIuVa36ps1olRkw5vgTnOzPyMFBL9N",
  },
];

export async function seedCategories(
  db: NeonHttpDatabase<Record<string, never>>,
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
    imageUrl: cat.imageUrl,
  }));
}

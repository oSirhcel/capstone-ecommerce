import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { tags } from "../../src/server/db/schema";
import type { InferInsertModel } from "drizzle-orm";
import { generateSlug } from "./utils";

type NewTag = InferInsertModel<typeof tags>;

export interface SeededTag {
  id: number;
  name: string;
  slug: string;
}

const tagNames = [
  // Electronics
  "wireless",
  "bluetooth",
  "usb-c",
  "smart-home",
  "portable",
  "rechargeable",
  "waterproof",
  "noise-cancelling",
  "4k",
  "hd",

  // Fashion & Clothing
  "cotton",
  "organic",
  "sustainable",
  "casual",
  "formal",
  "unisex",
  "plus-size",
  "vintage",
  "designer",

  // Home & Living
  "eco-friendly",
  "minimalist",
  "modern",
  "rustic",
  "handwoven",
  "ceramic",
  "wooden",
  "metal",
  "glass",

  // Sports & Outdoors
  "fitness",
  "yoga",
  "camping",
  "hiking",
  "water-sports",
  "cycling",
  "running",

  // Beauty
  "natural",
  "vegan",
  "cruelty-free",
  "hypoallergenic",
  "anti-aging",
  "moisturizing",
  "spf",

  // General
  "premium",
  "budget-friendly",
  "bestseller",
  "new-arrival",
  "limited-edition",
  "handmade",
  "imported",
  "australian-made",
  "gift-idea",
  "sale",
];

export async function seedTags(
  db: NeonHttpDatabase<Record<string, never>>,
): Promise<SeededTag[]> {
  console.log("🌱 Seeding tags...");

  const tagData: NewTag[] = tagNames.map((name) => ({
    name,
    slug: generateSlug(name),
  }));

  const insertedTags = await db.insert(tags).values(tagData).returning();

  console.log(`✅ Created ${insertedTags.length} tags`);

  return insertedTags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  }));
}

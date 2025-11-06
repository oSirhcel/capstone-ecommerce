import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { reviews } from "../../src/server/db/schema";
import type { InferInsertModel } from "drizzle-orm";
import type { SeededUser } from "./users";
import type { SeededProduct } from "./products";
import { randomInt, daysAgo } from "./utils";

type NewReview = InferInsertModel<typeof reviews>;

export interface SeededReview {
  id: number;
  productId: number;
  userId: string;
  rating: number;
}

const positiveComments = [
  "Excellent quality and fast delivery!",
  "Very satisfied with this purchase.",
  "Great value for money, highly recommend.",
  "Works perfectly, exactly as described.",
  "Love it! Will definitely buy again.",
  "Outstanding product, exceeded expectations.",
  "Fantastic quality, very happy.",
  "Best purchase I've made this year!",
  "Amazing product, highly recommended.",
  "Perfect! Just what I was looking for.",
];

const neutralComments = [
  "Decent product for the price.",
  "Okay overall, met expectations.",
  "Average experience, nothing special.",
  "It's fine, does what it says.",
  "Good enough, serves its purpose.",
  "Fair quality, reasonable price.",
  "Not bad, meets basic requirements.",
];

const negativeComments = [
  "Not as described, disappointed.",
  "Quality could be better for the price.",
  "Had issues shortly after purchase.",
  "Expected more for the cost.",
  "Not quite what I was hoping for.",
  "Needs improvement in quality.",
];

function getCommentForRating(rating: number): string {
  if (rating >= 4) {
    return positiveComments[randomInt(0, positiveComments.length - 1)];
  } else if (rating === 3) {
    return neutralComments[randomInt(0, neutralComments.length - 1)];
  } else {
    return negativeComments[randomInt(0, negativeComments.length - 1)];
  }
}

export async function seedReviews(
  db: NeonHttpDatabase<Record<string, never>>,
  users: SeededUser[],
  products: SeededProduct[],
): Promise<SeededReview[]> {
  console.log("🌱 Seeding reviews...");

  const reviewers = users.filter((u) => u.role !== "store_owner");
  const seededReviews: SeededReview[] = [];

  // Each product gets 0-6 reviews
  // Distribution: 10% no reviews, 30% 1-2 reviews, 40% 3-4 reviews, 20% 5-6 reviews
  const reviewInserts: NewReview[] = [];

  for (const product of products) {
    const rand = Math.random();
    let reviewCount: number;

    if (rand < 0.1) {
      reviewCount = 0; // No reviews
    } else if (rand < 0.4) {
      reviewCount = randomInt(1, 2); // Few reviews
    } else if (rand < 0.8) {
      reviewCount = randomInt(3, 4); // Moderate reviews
    } else {
      reviewCount = randomInt(5, 6); // Many reviews
    }

    if (reviewCount === 0) continue;

    // Select random reviewers (no duplicates per product)
    const selectedReviewers = new Set<string>();
    const shuffledReviewers = [...reviewers].sort(() => 0.5 - Math.random());

    for (let i = 0; i < reviewCount && i < shuffledReviewers.length; i++) {
      const reviewer = shuffledReviewers[i];
      if (selectedReviewers.has(reviewer.id)) continue;
      selectedReviewers.add(reviewer.id);

      // Rating distribution: skewed towards positive
      // 50% = 5 stars, 30% = 4 stars, 15% = 3 stars, 5% = 1-2 stars
      const ratingRand = Math.random();
      let rating: number;

      if (ratingRand < 0.5) {
        rating = 5;
      } else if (ratingRand < 0.8) {
        rating = 4;
      } else if (ratingRand < 0.95) {
        rating = 3;
      } else {
        rating = randomInt(1, 2);
      }

      reviewInserts.push({
        userId: reviewer.id,
        productId: product.id,
        rating,
        comment: getCommentForRating(rating),
        verifiedPurchase: Math.random() < 0.7, // 70% verified
        createdAt: daysAgo(randomInt(1, 120)),
      });
    }
  }

  // Batch insert reviews
  const batchSize = 200;
  for (let i = 0; i < reviewInserts.length; i += batchSize) {
    const batch = reviewInserts.slice(i, i + batchSize);
    const inserted = await db.insert(reviews).values(batch).returning();

    for (const review of inserted) {
      seededReviews.push({
        id: review.id,
        productId: review.productId,
        userId: review.userId,
        rating: review.rating,
      });
    }
  }

  console.log(`✅ Created ${seededReviews.length} reviews`);
  console.log(
    `   - Average ${(seededReviews.length / products.length).toFixed(1)} reviews per product`,
  );

  return seededReviews;
}

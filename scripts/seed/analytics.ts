import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { pageViews, cartEvents } from "../../src/server/db/schema";
import type { InferInsertModel } from "drizzle-orm";
import type { SeededUser } from "./users";
import type { SeededStore } from "./stores";
import type { SeededProduct } from "./products";
import { daysAgo, hoursAgo, randomInt, randomItem } from "./utils";

type NewPageView = InferInsertModel<typeof pageViews>;
type NewCartEvent = InferInsertModel<typeof cartEvents>;

const referrers = [
  null, // Direct traffic
  "https://www.google.com/search?q=",
  "https://www.google.com.au/search?q=",
  "https://www.bing.com/search?q=",
  "https://duckduckgo.com/?q=",
  "https://www.facebook.com/",
  "https://www.instagram.com/",
  "https://twitter.com/",
  "https://www.pinterest.com/",
  "https://www.youtube.com/",
  "https://www.reddit.com/",
  "https://www.amazon.com.au/",
  "https://www.ebay.com.au/",
];

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
];

function generateIPAddress(): string {
  // Generate realistic Australian IP addresses
  const ranges = [
    "1.0.0", // 1.0.0.0/8
    "14.0.0", // 14.0.0.0/8
    "27.0.0", // 27.0.0.0/8
    "36.0.0", // 36.0.0.0/8
    "39.0.0", // 39.0.0.0/8
    "42.0.0", // 42.0.0.0/8
    "49.0.0", // 49.0.0.0/8
    "58.0.0", // 58.0.0.0/8
    "59.0.0", // 59.0.0.0/8
    "101.0.0", // 101.0.0.0/8
    "103.0.0", // 103.0.0.0/8
    "106.0.0", // 106.0.0.0/8
    "110.0.0", // 110.0.0.0/8
    "111.0.0", // 111.0.0.0/8
    "112.0.0", // 112.0.0.0/8
    "113.0.0", // 113.0.0.0/8
    "114.0.0", // 114.0.0.0/8
    "115.0.0", // 115.0.0.0/8
    "116.0.0", // 116.0.0.0/8
    "117.0.0", // 117.0.0.0/8
    "118.0.0", // 118.0.0.0/8
    "119.0.0", // 119.0.0.0/8
    "120.0.0", // 120.0.0.0/8
    "121.0.0", // 121.0.0.0/8
    "122.0.0", // 122.0.0.0/8
    "123.0.0", // 123.0.0.0/8
    "124.0.0", // 124.0.0.0/8
    "125.0.0", // 125.0.0.0/8
    "139.0.0", // 139.0.0.0/8
    "150.0.0", // 150.0.0.0/8
    "153.0.0", // 153.0.0.0/8
    "180.0.0", // 180.0.0.0/8
    "202.0.0", // 202.0.0.0/8
    "203.0.0", // 203.0.0.0/8
    "210.0.0", // 210.0.0.0/8
    "218.0.0", // 218.0.0.0/8
    "220.0.0", // 220.0.0.0/8
    "222.0.0", // 222.0.0.0/8
    "223.0.0", // 223.0.0.0/8
  ];

  const base = randomItem(ranges);
  const parts = base.split(".");
  parts[1] = String(randomInt(0, 255));
  parts[2] = String(randomInt(0, 255));
  parts[3] = String(randomInt(1, 254));
  return parts.join(".");
}

export async function seedAnalytics(
  db: NodePgDatabase<Record<string, never>>,
  users: SeededUser[],
  stores: SeededStore[],
  products: SeededProduct[],
): Promise<void> {
  console.log("🌱 Seeding analytics...");

  // Filter customers only (excluding store owners for most analytics)
  const customers = users.filter(
    (u) => u.role === "customer" || u.role === "test_account",
  );
  const activeProducts = products.filter((p) => p.status === "Active");

  // 1. Generate page views (90 days of data)
  console.log("  Creating page views...");
  const pageViewBatches: NewPageView[] = [];
  const totalPageViews = 15000; // ~167 views per day on average
  const batchSize = 1000;

  for (let i = 0; i < totalPageViews; i++) {
    // 70% product views, 20% store views, 10% other pages
    const viewType = Math.random();
    const isProductView = viewType < 0.7;
    const isStoreView = viewType >= 0.7 && viewType < 0.9;

    const userId = Math.random() < 0.6 ? randomItem(customers).id : null; // 60% logged in
    const productId = isProductView ? randomItem(activeProducts).id : null;
    const storeId = isStoreView
      ? randomItem(stores).id
      : productId
        ? products.find((p) => p.id === productId)?.storeId
        : randomItem(stores).id;

    // More recent views are more common (exponential decay)
    const daysAgoValue = Math.floor(Math.random() ** 2 * 90);
    const hoursOffset = randomInt(0, 23);
    const minutesOffset = randomInt(0, 59);
    const createdAt = new Date(daysAgo(daysAgoValue));
    createdAt.setHours(hoursOffset, minutesOffset, 0, 0);

    const referrer = randomItem(referrers);
    const userAgent = randomItem(userAgents);
    const ipAddress = generateIPAddress();

    pageViewBatches.push({
      userId: userId ?? undefined,
      productId: productId ?? undefined,
      storeId: storeId ?? undefined,
      referrer: referrer ?? undefined,
      userAgent: userAgent ?? undefined,
      ipAddress: ipAddress ?? undefined,
      createdAt,
    });

    if (pageViewBatches.length >= batchSize) {
      await db.insert(pageViews).values(pageViewBatches);
      pageViewBatches.length = 0;
    }
  }

  if (pageViewBatches.length > 0) {
    await db.insert(pageViews).values(pageViewBatches);
  }

  console.log(`✅ Created ${totalPageViews} page views`);

  // 2. Generate cart events (90 days of data)
  console.log("  Creating cart events...");
  const cartEventBatches: NewCartEvent[] = [];
  const totalCartEvents = 8000; // ~89 events per day on average

  // Event type distribution: view (40%), add (35%), remove (15%), checkout (10%)
  const eventTypeWeights = [
    { type: "view" as const, weight: 0.4 },
    { type: "add" as const, weight: 0.35 },
    { type: "remove" as const, weight: 0.15 },
    { type: "checkout" as const, weight: 0.1 },
  ];

  function getRandomEventType(): "view" | "add" | "remove" | "checkout" {
    const rand = Math.random();
    let cumulative = 0;
    for (const { type, weight } of eventTypeWeights) {
      cumulative += weight;
      if (rand <= cumulative) {
        return type;
      }
    }
    return "view";
  }

  for (let i = 0; i < totalCartEvents; i++) {
    const userId = randomItem(customers).id; // Cart events require logged-in users
    const product = randomItem(activeProducts);
    const storeId = product.storeId;
    const eventType = getRandomEventType();
    const quantity =
      eventType === "add"
        ? randomInt(1, 5)
        : eventType === "remove"
          ? randomInt(1, 3)
          : 1;

    // More recent events are more common
    const daysAgoValue = Math.floor(Math.random() ** 2 * 90);
    const hoursOffset = randomInt(0, 23);
    const minutesOffset = randomInt(0, 59);
    const createdAt = new Date(daysAgo(daysAgoValue));
    createdAt.setHours(hoursOffset, minutesOffset, 0, 0);

    cartEventBatches.push({
      userId,
      productId: product.id,
      storeId,
      eventType,
      quantity,
      createdAt,
    });

    if (cartEventBatches.length >= batchSize) {
      await db.insert(cartEvents).values(cartEventBatches);
      cartEventBatches.length = 0;
    }
  }

  if (cartEventBatches.length > 0) {
    await db.insert(cartEvents).values(cartEventBatches);
  }

  console.log(`✅ Created ${totalCartEvents} cart events`);

  console.log("✅ Analytics seeding complete");
  console.log(`   - ${totalPageViews} page views`);
  console.log(`   - ${totalCartEvents} cart events`);
}

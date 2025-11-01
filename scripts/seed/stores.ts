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
  imageUrl: string;
  ownerId: string;
  categoryFocus: string[];
}

const storeData = [
  // Single category stores (specialized)

  {
    name: "Alpha Gadgets",
    description:
      "Premium electronics and tech accessories for modern living. Discover the latest smartphones, laptops, smart home devices, and innovative gadgets from top brands.",
    focus: ["Electronics"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RZyRcMcJIuVa36ps1olRkw5vgTnOzPyMFBL9N",
  },

  {
    name: "Beta Crafts",
    description:
      "Artisan handmade goods crafted with passion. Browse unique, one-of-a-kind items from talented makers including home decor, jewelry, and decorative pieces.",
    focus: ["Handmade"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6R0A6z6hVOHMjAyZJgXwNVsKDl3YCWb8cFqp4t",
  },

  {
    name: "Pure Electronics",
    description:
      "Your trusted destination for cutting-edge electronics and computing devices. We offer a curated selection of premium tech products at competitive prices.",
    focus: ["Electronics"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RlsoeK2TtKVQx6Oj9Xmgrz1SbdRn8iuNGYJCf",
  },

  {
    name: "Clothing Central",
    description:
      "Fashion-forward clothing for every style and occasion. From casual everyday wear to elegant evening attire, find your perfect wardrobe essentials.",
    focus: ["Fashion & Clothing"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6Rx4R2YGFP2n5dTl7LfaNOGy34RqMV9Az0tEJC",
  },

  {
    name: "Home Essentials",
    description:
      "Transform your living space with quality home essentials and furnishings. Discover everything you need for a comfortable, stylish home from furniture to décor.",
    focus: ["Home & Living"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RHe1tQNy3y5uLXDeqmTcQGkjS4V1vtnbfNzIp",
  },

  {
    name: "Outdoor Pro",
    description:
      "Premium outdoor gear for nature enthusiasts and adventurers. Equip yourself with high-quality equipment for camping, hiking, and outdoor exploration.",
    focus: ["Sports & Outdoors"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RxnZataFP2n5dTl7LfaNOGy34RqMV9Az0tEJC",
  },

  {
    name: "Beauty Palace",
    description:
      "Natural and effective beauty products for glowing, radiant skin. Experience our carefully selected skincare, cosmetics, and wellness products.",
    focus: ["Beauty & Personal Care"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RIolPZYXNy3rD5wJmZdqIhobL84MH9PUTl6Fi",
  },

  {
    name: "Accessory World",
    description:
      "Complete your look with our curated collection of fashion accessories and stylish add-ons. From bags to shoes, find the perfect finishing touch to any outfit.",
    focus: ["Fashion & Clothing"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RD6MBZwqE7Y6V2nLszhJB4OWwbydNgZAFTMSD",
  },

  {
    name: "Electronics Direct",
    description:
      "Direct from manufacturer electronics at factory prices. Quality gadgets, components, and devices sourced straight from leading manufacturers.",
    focus: ["Electronics"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RViojsS7y0x5X169EMzCZsPIWFpGQcafbUHlo",
  },

  {
    name: "Fashion Forward",
    description:
      "Trendsetting clothing for the modern wardrobe. Stay ahead of fashion with our curated selection of contemporary styles and seasonal collections.",
    focus: ["Fashion & Clothing"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6ROkPkvnpsFU4fv0ASWjZGqCl8Izc7w5nQxkLm",
  },

  // Two category stores (focused specialists)

  {
    name: "Delta Electronics Hub",
    description:
      "Electronics and cutting-edge tech solutions for work and play. From computing devices to innovative smart home technology that enhances your lifestyle.",
    focus: ["Electronics", "Home & Living"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RH5jOcIy3y5uLXDeqmTcQGkjS4V1vtnbfNzIp",
  },

  {
    name: "Zeta Fashion Boutique",
    description:
      "Sustainable and stylish fashion for every occasion. Explore eco-conscious clothing collections paired with beauty products that align with your values.",
    focus: ["Fashion & Clothing", "Beauty & Personal Care"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6Rxc3hrxFP2n5dTl7LfaNOGy34RqMV9Az0tEJC",
  },

  {
    name: "Eta Sports & Outdoors",
    description:
      "Gear up for adventure with premium sports equipment and outdoor essentials. Whether you're a casual enthusiast or serious athlete, find what you need.",
    focus: ["Sports & Outdoors"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RY9KknRwmPJwVBFXrajcst6oH8dMhRUIlqzYn",
  },

  {
    name: "Iota Beauty Bar",
    description:
      "Premium beauty and personal care essentials for your complete grooming routine. Discover trusted brands and professional-grade products.",
    focus: ["Beauty & Personal Care"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RZYKeQadJIuVa36ps1olRkw5vgTnOzPyMFBL9",
  },

  {
    name: "Epsilon Home & Living",
    description:
      "Thoughtfully curated home essentials and handmade décor pieces. Create a unique living space with quality furnishings and artisan decorative items.",
    focus: ["Home & Living", "Handmade"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6Rzq0U36b8OKfwAQacmV1IPECbnL3kuNBhjXtM",
  },

  {
    name: "Kappa Outdoor Adventures",
    description:
      "Complete outdoor gear and sports equipment for your next adventure. From hiking and camping to water sports, we have everything you need.",
    focus: ["Sports & Outdoors"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RKV09xiYHamk0o9bcWGXU12jfNtMKSwCPJVFh",
  },

  {
    name: "Lambda Tech Solutions",
    description:
      "Technology and smart home devices that modernize your living space. Explore innovative solutions for connected, intelligent homes.",
    focus: ["Electronics", "Home & Living"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RehND6LhU3JSsFgCZf945QNd2ntW8DyKYic0A",
  },

  {
    name: "Mu Home Decor",
    description:
      "Elegant handcrafted decor pieces to personalize your space. Discover unique artisan items and stylish furnishings that reflect your personality.",
    focus: ["Home & Living", "Handmade"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6R0oULeDVOHMjAyZJgXwNVsKDl3YCWb8cFqp4t",
  },

  {
    name: "Nu Wellness Essentials",
    description:
      "Holistic wellness products for mind, body, and spirit. From fitness equipment to beauty and self-care items that support your healthy lifestyle.",
    focus: ["Beauty & Personal Care", "Sports & Outdoors"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RrPlucvSqnwy6b1LKshdxp4ASEINU9ZcekozX",
  },

  {
    name: "Xi Garden & Outdoor",
    description:
      "Everything you need for a beautiful garden and outdoor living. Quality tools, plants, furniture, and sports equipment for outdoor enthusiasts.",
    focus: ["Home & Living", "Sports & Outdoors"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6Rad2UWeRI5Cg86dUKrxTfqiA2PMylo3YFOajW",
  },

  // Three or more category stores (generalists)

  {
    name: "Gamma Lifestyle",
    description:
      "Curated lifestyle essentials for beauty, fashion, and wellness. Discover a thoughtful collection of products that complement a stylish, healthy lifestyle.",
    focus: ["Beauty & Personal Care", "Fashion & Clothing"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6R1NlOVHEsOQlBuv0jaY2ZrEVhcWi8FXtCM4HG",
  },

  {
    name: "Omicron Kids Corner",
    description:
      "Quality products for children and families that support growth and play. Find clothing, toys, furniture, and essentials for every stage of childhood.",
    focus: ["Fashion & Clothing", "Home & Living"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6Ro0mNUMlNTrZ2Wvp4Liy3D1G6QFKzsgmnleI9",
  },

  {
    name: "Mega Mart",
    description:
      "Everything you need in one convenient place. Shop our diverse selection of electronics, fashion, home goods, and more at great prices.",
    focus: ["Electronics", "Fashion & Clothing", "Home & Living"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RUWoukjUneWIdfEAgxqRZ4uhCQT2oVzbX5rML",
  },

  {
    name: "The Emporium",
    description:
      "A diverse collection of quality products across multiple categories. From tech to fashion to beauty, find premium items from trusted brands.",
    focus: ["Electronics", "Fashion & Clothing", "Beauty & Personal Care"],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RSuRJD7HkLrZqA9JPp63iweKxnmDWF72gBN1V",
  },

  {
    name: "Universal Store",
    description:
      "Your ultimate one-stop shop for all your lifestyle needs. Browse thousands of products across every major category with expert curation.",
    focus: [
      "Electronics",
      "Fashion & Clothing",
      "Home & Living",
      "Sports & Outdoors",
    ],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RfZWQwF1wBiIN2kxE3aJ4c6Ry8FDW0Qhuov7z",
  },
  {
    name: "Theta Goodies Haven",
    description:
      "Discover your next great find from our expertly curated collection of quality products. Shop electronics, fashion, home décor, and outdoor gear.",
    focus: [
      "Electronics",
      "Fashion & Clothing",
      "Home & Living",
      "Sports & Outdoors",
    ],
    imageUrl:
      "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RY9KknRwmPJwVBFXrajcst6oH8dMhRUIlqzYn",
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
      imageUrl: data.imageUrl,
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
      imageUrl: data.imageUrl,
      ownerId: owner.id,
      categoryFocus: data.focus,
    });
  }

  // Create a store for at least one test user
  const testUsers = users.filter((u) => u.role === "test_account");
  if (testUsers.length > 0) {
    const testUser = testUsers[0]; // Use first test user
    const testStoreData = {
      name: "Mr Good's Electronics Store",
      description: "Not bad quality electronics and accessories",
      focus: ["Electronics"],
      imageUrl:
        "https://3lyyn5rnxe.ufs.sh/f/R2Adv7ZpLu6RQlbUQuDhE9DBN6Xybm3cHzjIW4Cvg5s2uV1d",
    };

    const id = uuidv4();
    const slug = generateSlug(testStoreData.name);

    storeInserts.push({
      id,
      name: testStoreData.name,
      slug,
      imageUrl: testStoreData.imageUrl,
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
      imageUrl: testStoreData.imageUrl,
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

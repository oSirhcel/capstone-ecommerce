import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { addresses, userProfiles } from "../../src/server/db/schema";
import { inArray, type InferInsertModel } from "drizzle-orm";
import type { SeededUser } from "./users";
import { randomInt } from "./utils";

type NewAddress = InferInsertModel<typeof addresses>;

export interface SeededAddress {
  id: number;
  userId: string;
  type: string;
  isDefault: boolean;
}

const streetNames = [
  "George Street",
  "Collins Street",
  "Elizabeth Street",
  "Bourke Street",
  "Queen Street",
  "King Street",
  "Pitt Street",
  "Sussex Street",
  "York Street",
  "Clarence Street",
  "Kent Street",
  "Market Street",
  "Park Street",
  "Liverpool Street",
  "Oxford Street",
  "Crown Street",
  "William Street",
  "Castlereagh Street",
  "Macquarie Street",
  "Phillip Street",
];

const australianCities = [
  { city: "Sydney", state: "NSW", postcodes: ["2000", "2006", "2010", "2060"] },
  {
    city: "Melbourne",
    state: "VIC",
    postcodes: ["3000", "3006", "3053", "3121"],
  },
  {
    city: "Brisbane",
    state: "QLD",
    postcodes: ["4000", "4006", "4101", "4170"],
  },
  { city: "Perth", state: "WA", postcodes: ["6000", "6004", "6050", "6100"] },
  {
    city: "Adelaide",
    state: "SA",
    postcodes: ["5000", "5006", "5034", "5061"],
  },
  {
    city: "Canberra",
    state: "ACT",
    postcodes: ["2600", "2601", "2602", "2900"],
  },
  { city: "Hobart", state: "TAS", postcodes: ["7000", "7004", "7008", "7010"] },
];

function generateAddress(
  userId: string,
  firstName: string,
  lastName: string,
  isDefault = true,
): NewAddress {
  const location = australianCities[randomInt(0, australianCities.length - 1)];
  const streetNumber = randomInt(1, 999);
  const streetName = streetNames[randomInt(0, streetNames.length - 1)];
  const postcode =
    location.postcodes[randomInt(0, location.postcodes.length - 1)];

  // 30% chance to have unit/apartment
  const hasUnit = Math.random() < 0.3;
  const addressLine2 = hasUnit ? `Unit ${randomInt(1, 150)}` : undefined;

  return {
    userId,
    type: "shipping",
    firstName,
    lastName,
    addressLine1: `${streetNumber} ${streetName}`,
    addressLine2,
    city: location.city,
    state: location.state,
    postcode,
    country: "AU",
    isDefault,
  };
}

export async function seedAddresses(
  db: NeonHttpDatabase<Record<string, never>>,
  users: SeededUser[],
): Promise<SeededAddress[]> {
  console.log("🌱 Seeding addresses...");

  // Only create addresses for customers (not store owners)
  const customers = users.filter((u) => u.role === "customer");

  // Get user profiles to get names
  const userProfilesData = await db
    .select()
    .from(userProfiles)
    .where(
      inArray(
        userProfiles.userId,
        customers.map((c) => c.id),
      ),
    );

  const profileMap = new Map(
    userProfilesData.map((p) => [
      p.userId,
      { firstName: p.firstName ?? "John", lastName: p.lastName ?? "Doe" },
    ]),
  );

  const addressInserts: NewAddress[] = [];
  const seededAddresses: SeededAddress[] = [];

  // 70% of customers have addresses
  const customersWithAddresses = customers.slice(
    0,
    Math.floor(customers.length * 0.7),
  );

  for (const customer of customersWithAddresses) {
    const profile = profileMap.get(customer.id);
    if (!profile) continue;

    // Each customer gets 1-2 addresses
    const addressCount = randomInt(1, 2);

    for (let i = 0; i < addressCount; i++) {
      const address = generateAddress(
        customer.id,
        profile.firstName,
        profile.lastName,
        i === 0, // First address is default
      );
      addressInserts.push(address);
    }
  }

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < addressInserts.length; i += batchSize) {
    const batch = addressInserts.slice(i, i + batchSize);
    const inserted = await db.insert(addresses).values(batch).returning();

    for (const addr of inserted) {
      seededAddresses.push({
        id: addr.id,
        userId: addr.userId,
        type: addr.type,
        isDefault: addr.isDefault,
      });
    }
  }

  console.log(`✅ Created ${seededAddresses.length} addresses`);
  console.log(`   - For ${customersWithAddresses.length} customers`);

  return seededAddresses;
}

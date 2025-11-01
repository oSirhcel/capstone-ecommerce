import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { users, userProfiles } from "../../src/server/db/schema";
import type { InferInsertModel } from "drizzle-orm";
import { daysAgo, randomInt } from "./utils";

type NewUser = InferInsertModel<typeof users>;
type NewUserProfile = InferInsertModel<typeof userProfiles>;

export interface SeededUser {
  id: string;
  username: string;
  role: "store_owner" | "customer" | "test_account";
}

const firstNames = [
  "James",
  "Emma",
  "Oliver",
  "Charlotte",
  "William",
  "Ava",
  "Lucas",
  "Sophia",
  "Henry",
  "Amelia",
  "Jack",
  "Mia",
  "Alexander",
  "Isabella",
  "Ethan",
  "Harper",
  "Noah",
  "Evelyn",
  "Liam",
  "Abigail",
  "Mason",
  "Emily",
  "Logan",
  "Ella",
  "Benjamin",
  "Scarlett",
  "Samuel",
  "Grace",
  "Daniel",
  "Chloe",
];

const lastNames = [
  "Smith",
  "Jones",
  "Williams",
  "Brown",
  "Wilson",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
  "Garcia",
  "Martinez",
  "Robinson",
  "Clark",
  "Rodriguez",
  "Lewis",
  "Lee",
  "Walker",
  "Hall",
  "Allen",
  "Young",
  "King",
  "Wright",
  "Lopez",
  "Hill",
  "Scott",
  "Green",
];

function generateEmail(firstName: string, lastName: string): string {
  const domain = [
    "gmail.com",
    "outlook.com",
    "yahoo.com.au",
    "bigpond.com",
    "optusnet.com.au",
  ];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain[randomInt(0, domain.length - 1)]}`;
}

function generatePhone(): string {
  const areaCode = ["02", "03", "07", "08"];
  const area = areaCode[randomInt(0, areaCode.length - 1)];
  const first = String(randomInt(1000, 9999));
  const second = String(randomInt(1000, 9999));
  return `+61 ${area} ${first} ${second}`;
}

export async function seedUsers(
  db: NodePgDatabase<Record<string, never>>,
): Promise<SeededUser[]> {
  console.log("🌱 Seeding users...");

  const passwordHash = bcrypt.hashSync("Test123", 10);
  const seededUsers: SeededUser[] = [];

  // 1. Create store owners (26 owners)
  console.log("  Creating store owners...");
  const ownerUsers: NewUser[] = [];
  const ownerProfiles: NewUserProfile[] = [];

  const storeOwnerNames = [
    "alpha_gadgets",
    "beta_crafts",
    "gamma_lifestyle",
    "delta_electronics",
    "epsilon_home",
    "zeta_fashion",
    "eta_sports",
    "theta_books",
    "iota_beauty",
    "kappa_outdoor",
    "lambda_tech",
    "mu_decor",
    "nu_wellness",
    "xi_garden",
    "omicron_kids",
    "pi_electronics",
    "rho_clothing",
    "sigma_mega",
    "tau_specialty",
    "upsilon_boutique",
    "phi_emporium",
    "chi_depot",
    "psi_marketplace",
    "omega_general",
    "zeta_plus",
    "alpha_plus",
  ];

  for (let i = 0; i < 26; i++) {
    const id = i === 0 ? "default-store-id" : uuidv4();
    const username = storeOwnerNames[i];
    const firstName = firstNames[randomInt(0, firstNames.length - 1)];
    const lastName = lastNames[randomInt(0, lastNames.length - 1)];

    ownerUsers.push({
      id,
      username,
      password: passwordHash,
      createdAt: daysAgo(randomInt(180, 365)),
    });

    ownerProfiles.push({
      userId: id,
      email: generateEmail(firstName, lastName),
      firstName,
      lastName,
      phone: generatePhone(),
    });

    seededUsers.push({
      id,
      username,
      role: "store_owner",
    });
  }

  await db.insert(users).values(ownerUsers);
  await db.insert(userProfiles).values(ownerProfiles);

  // 2. Create regular customers (180 customers)
  console.log("  Creating customers...");
  const customerBatches = 6; // Create in batches of 30
  const customersPerBatch = 30;

  for (let batch = 0; batch < customerBatches; batch++) {
    const customerUsers: NewUser[] = [];
    const customerProfiles: NewUserProfile[] = [];

    for (let i = 0; i < customersPerBatch; i++) {
      const id = uuidv4();
      const firstName = firstNames[randomInt(0, firstNames.length - 1)];
      const lastName = lastNames[randomInt(0, lastNames.length - 1)];
      const username = `customer_${firstName.toLowerCase()}_${lastName.toLowerCase()}_${batch * customersPerBatch + i}`;

      customerUsers.push({
        id,
        username,
        password: passwordHash,
        createdAt: daysAgo(randomInt(30, 365)),
      });

      customerProfiles.push({
        userId: id,
        email: generateEmail(firstName, lastName),
        firstName,
        lastName,
        phone: generatePhone(),
      });

      seededUsers.push({
        id,
        username,
        role: "customer",
      });
    }

    await db.insert(users).values(customerUsers);
    await db.insert(userProfiles).values(customerProfiles);
  }

  // 3. Create test accounts (5 special test accounts)
  console.log("  Creating test accounts...");
  const testAccounts: Array<{
    username: string;
    password: string;
    createdDaysAgo: number;
  }> = [
    { username: "Test123", password: "Test123", createdDaysAgo: 28 },
    { username: "badaccount", password: "badacc", createdDaysAgo: 35 },
    { username: "test_buyer", password: "Test123", createdDaysAgo: 45 },
    { username: "verified_user", password: "Test123", createdDaysAgo: 60 },
    { username: "new_user", password: "Test123", createdDaysAgo: 3 },
  ];

  const testUsers: NewUser[] = [];
  const testProfiles: NewUserProfile[] = [];

  for (const account of testAccounts) {
    const id = uuidv4();
    const firstName = firstNames[randomInt(0, firstNames.length - 1)];
    const lastName = lastNames[randomInt(0, lastNames.length - 1)];

    testUsers.push({
      id,
      username: account.username,
      password: bcrypt.hashSync(account.password, 10),
      createdAt: daysAgo(account.createdDaysAgo),
    });

    testProfiles.push({
      userId: id,
      email: generateEmail(firstName, lastName),
      firstName,
      lastName,
      phone: generatePhone(),
    });

    seededUsers.push({
      id,
      username: account.username,
      role: "test_account",
    });
  }

  await db.insert(users).values(testUsers);
  await db.insert(userProfiles).values(testProfiles);

  console.log(`✅ Created ${seededUsers.length} users`);
  console.log(`   - ${ownerUsers.length} store owners`);
  console.log(`   - ${customerBatches * customersPerBatch} customers`);
  console.log(`   - ${testUsers.length} test accounts`);

  return seededUsers;
}

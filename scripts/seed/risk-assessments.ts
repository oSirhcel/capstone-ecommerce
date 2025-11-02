import { v4 as uuidv4 } from "uuid";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  zeroTrustAssessments,
  riskAssessmentStoreLinks,
  riskAssessmentOrderLinks,
  orders,
  orderItems,
  products,
  addresses,
  userProfiles,
  orderAddresses,
} from "../../src/server/db/schema";
import type { InferInsertModel } from "drizzle-orm";
import { eq, inArray } from "drizzle-orm";
import type { SeededUser } from "./users";
import type { SeededStore } from "./stores";
import type { SeededOrder } from "./orders";
import { daysAgo, randomInt, cents } from "./utils";

type NewRiskAssessment = InferInsertModel<typeof zeroTrustAssessments>;
type NewStoreLink = InferInsertModel<typeof riskAssessmentStoreLinks>;
type NewOrderLink = InferInsertModel<typeof riskAssessmentOrderLinks>;

interface RiskAssessmentData {
  assessment: NewRiskAssessment;
  storeLinks: NewStoreLink[];
  orderLink?: NewOrderLink;
}

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
];

const australianIPs = [
  "1.0.0.0",
  "14.0.0.0",
  "27.0.0.0",
  "36.0.0.0",
  "49.0.0.0",
  "58.0.0.0",
  "101.0.0.0",
  "103.0.0.0",
  "106.0.0.0",
  "110.0.0.0",
  "120.0.0.0",
  "124.0.0.0",
  "139.0.0.0",
  "180.0.0.0",
  "203.0.0.0",
  "220.0.0.0",
];

function generateIPAddress(): string {
  const base = australianIPs[randomInt(0, australianIPs.length - 1)];
  const parts = base.split(".");
  parts[1] = String(randomInt(0, 255));
  parts[2] = String(randomInt(0, 255));
  parts[3] = String(randomInt(1, 254));
  return parts.join(".");
}

function randomItem<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

interface RiskFactorsFactor {
  factor: string;
  impact: number;
  description: string;
}

function generateRiskFactors(decision: "allow" | "warn" | "deny"): string {
  const factors: RiskFactorsFactor[] = [];

  if (decision === "deny") {
    // High-risk factors for denied transactions
    const denyFactors = [
      {
        factor: "Suspicious payment method",
        impact: 35,
        description:
          "Payment method used has been associated with fraudulent activity",
      },
      {
        factor: "High transaction value",
        impact: 25,
        description: "Transaction amount significantly exceeds user's typical spending",
      },
      {
        factor: "Multiple failed attempts",
        impact: 30,
        description: "Several failed payment attempts detected recently",
      },
      {
        factor: "Unusual device location",
        impact: 20,
        description: "Transaction originated from unrecognized device/location",
      },
      {
        factor: "Velocity check failed",
        impact: 40,
        description: "Transaction frequency exceeds normal patterns",
      },
      {
        factor: "Account verification issues",
        impact: 45,
        description: "Account details cannot be verified",
      },
    ];
    // Add 3-4 random deny factors
    const shuffled = [...denyFactors].sort(() => 0.5 - Math.random());
    factors.push(...shuffled.slice(0, randomInt(3, 4)));
  } else if (decision === "warn") {
    // Moderate-risk factors for warnings
    const warnFactors = [
      {
        factor: "New shipping address",
        impact: 15,
        description: "Shipping to address not previously used",
      },
      {
        factor: "Large order size",
        impact: 10,
        description: "Higher than average item count for this user",
      },
      {
        factor: "Cross-border transaction",
        impact: 20,
        description: "Transaction involves international shipping",
      },
      {
        factor: "Rapid purchase behavior",
        impact: 15,
        description: "Multiple orders within short time frame",
      },
      {
        factor: "Unusual time of day",
        impact: 10,
        description: "Transaction outside typical purchasing hours",
      },
    ];
    // Add 2-3 random warn factors
    const shuffled = [...warnFactors].sort(() => 0.5 - Math.random());
    factors.push(...shuffled.slice(0, randomInt(2, 3)));
  } else {
    // Low/no risk factors for allowed transactions
    const allowFactors = [
      {
        factor: "Verified purchase history",
        impact: -5,
        description: "Customer has established positive transaction history",
      },
      {
        factor: "Account age validation",
        impact: -10,
        description: "Account has been active for extended period",
      },
      {
        factor: "Device authentication",
        impact: -8,
        description: "Transaction from recognized device",
      },
      {
        factor: "Address verification",
        impact: -5,
        description: "Shipping and billing addresses match records",
      },
    ];
    // Add 2-3 random allow factors
    const shuffled = [...allowFactors].sort(() => 0.5 - Math.random());
    factors.push(...shuffled.slice(0, randomInt(2, 3)));
  }

  return JSON.stringify(factors);
}

function generateAIJustification(
  decision: "allow" | "warn" | "deny",
  riskScore: number,
): string {
  if (decision === "deny") {
    const templates = [
      `Transaction denied with a risk score of ${riskScore}. The payment method appears to be associated with fraudulent activity, and multiple verification attempts have failed. Additionally, the transaction frequency exceeds normal patterns, raising concerns about account security.`,
      `High-risk transaction detected (score: ${riskScore}). Analysis indicates suspicious payment behavior with unusually high transaction value compared to user history. Multiple failed attempts and velocity check failures suggest potential fraud.`,
      `Transaction rejected due to elevated risk score of ${riskScore}. Account verification issues combined with unrecognized device activity and velocity pattern anomalies indicate potential compromise of payment credentials.`,
    ];
    return templates[randomInt(0, templates.length - 1)];
  } else if (decision === "warn") {
    const templates = [
      `Moderate risk assessment (score: ${riskScore}). Customer is shipping to a new address with higher-than-typical order value. Additional verification recommended to ensure transaction legitimacy.`,
      `Caution advised (risk score: ${riskScore}). Unusual purchase pattern detected with rapid transaction velocity. While likely legitimate, manual review suggested.`,
      `Flagged for review (score: ${riskScore}). Cross-border transaction combined with unusual timing warrants additional customer verification before processing.`,
    ];
    return templates[randomInt(0, templates.length - 1)];
  } else {
    const templates = [
      `Low-risk transaction approved (score: ${riskScore}). Customer has established purchase history with verified payment methods and consistent shipping patterns. Transaction cleared for processing.`,
      `Approved with confidence (risk score: ${riskScore}). Account verification successful, device recognized, and transaction patterns align with typical customer behavior.`,
      `Transaction cleared (score: ${riskScore}). Comprehensive analysis indicates legitimate purchase with verified billing information and secure payment method.`,
    ];
    return templates[randomInt(0, templates.length - 1)];
  }
}

export async function seedRiskAssessments(
  db: NodePgDatabase<Record<string, never>>,
  users: SeededUser[],
  stores: SeededStore[],
  seededOrders: SeededOrder[],
): Promise<number> {
  console.log("🌱 Seeding risk assessments...");

  // Find specific test users
  const badAccount = users.find((u) => u.username === "badaccount");
  // MrGood is the test_buyer account
  const mrGood = users.find((u) => u.username === "test_buyer");

  // Get test users with "test_" prefix or any test accounts, excluding badaccount
  const testUsers = users.filter(
    (u) =>
      (u.role === "test_account" || u.username.startsWith("test_")) &&
      u.username !== "badaccount" &&
      u.username !== "test_buyer", // Exclude test_buyer as it's "MrGood"
  );

  // Get regular customers
  const regularCustomers = users.filter((u) => u.role === "customer");

  // Create risk assessments data
  const assessmentsData: RiskAssessmentData[] = [];

  // 1. Create denied assessments for badaccount
  if (badAccount) {
    console.log("  Creating denied assessments for badaccount...");
    // Find badaccount's orders
    const badAccountOrders = seededOrders.filter((o) => o.userId === badAccount.id);
    
    // If badaccount has no orders, use any order (for test purposes)
    const ordersToUse = badAccountOrders.length > 0 
      ? badAccountOrders 
      : seededOrders.slice(0, Math.min(8, seededOrders.length));

    for (let i = 0; i < 8; i++) {
      const order = ordersToUse[i % ordersToUse.length];
      if (!order) continue;

      const riskScore = randomInt(75, 95);
      const decision: "deny" = "deny";
      const confidence = randomInt(80, 95);
      const createdDaysAgo = randomInt(30, 120);

      // Find the store for this order
      const store = stores.find((s) => s.id === order.storeId);
      if (!store) continue;

      // Fetch order items to get accurate counts
      const orderItemsData = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      const itemCount = orderItemsData.length;
      const transactionAmount = order.totalAmount;

      assessmentsData.push({
        assessment: {
          userId: badAccount.id,
          orderId: order.id,
          paymentIntentId: `pi_dummy_bad_${uuidv4().substring(0, 10)}`,
          riskScore,
          decision,
          confidence,
          transactionAmount,
          currency: "AUD",
          itemCount,
          storeCount: 1,
          riskFactors: generateRiskFactors(decision),
          aiJustification: generateAIJustification(decision, riskScore),
          justificationGeneratedAt: daysAgo(createdDaysAgo - randomInt(0, 2)),
          userAgent: randomItem(userAgents),
          ipAddress: generateIPAddress(),
          shippingCountry: "AU",
          shippingState: "NSW",
          shippingCity: "Sydney",
          createdAt: daysAgo(createdDaysAgo),
        },
        storeLinks: [
          {
            riskAssessmentId: 0, // Will be replaced after insert
            storeId: store.id,
            storeOrderId: order.id,
            storeSubtotal: transactionAmount,
            storeItemCount: itemCount,
            createdAt: daysAgo(createdDaysAgo),
          },
        ],
        orderLink: {
          riskAssessmentId: 0, // Will be replaced after insert
          orderId: order.id,
          createdAt: daysAgo(createdDaysAgo),
        },
      });
    }
  }

  // 2. Create allowed assessments for MrGood
  if (mrGood) {
    console.log("  Creating allowed assessments for MrGood...");
    // Find MrGood's orders
    const mrGoodOrders = seededOrders.filter((o) => o.userId === mrGood.id);
    
    // If mrGood has no orders, use any order (for test purposes)
    const ordersToUse = mrGoodOrders.length > 0 
      ? mrGoodOrders 
      : seededOrders.slice(0, Math.min(10, seededOrders.length));

    for (let i = 0; i < 10; i++) {
      const order = ordersToUse[i % ordersToUse.length];
      if (!order) continue;

      const riskScore = randomInt(10, 35);
      const decision: "allow" = "allow";
      const confidence = randomInt(85, 98);
      const createdDaysAgo = randomInt(1, 90);

      // Find the store for this order
      const store = stores.find((s) => s.id === order.storeId);
      if (!store) continue;

      // Fetch order items to get accurate counts
      const orderItemsData = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      const itemCount = orderItemsData.length;
      const transactionAmount = order.totalAmount;

      assessmentsData.push({
        assessment: {
          userId: mrGood.id,
          orderId: order.id,
          paymentIntentId: `pi_dummy_good_${uuidv4().substring(0, 10)}`,
          riskScore,
          decision,
          confidence,
          transactionAmount,
          currency: "AUD",
          itemCount,
          storeCount: 1,
          riskFactors: generateRiskFactors(decision),
          aiJustification: generateAIJustification(decision, riskScore),
          justificationGeneratedAt: daysAgo(createdDaysAgo - randomInt(0, 2)),
          userAgent: randomItem(userAgents),
          ipAddress: generateIPAddress(),
          shippingCountry: "AU",
          shippingState: "NSW",
          shippingCity: "Sydney",
          createdAt: daysAgo(createdDaysAgo),
        },
        storeLinks: [
          {
            riskAssessmentId: 0, // Will be replaced after insert
            storeId: store.id,
            storeOrderId: order.id,
            storeSubtotal: transactionAmount,
            storeItemCount: itemCount,
            createdAt: daysAgo(createdDaysAgo),
          },
        ],
        orderLink: {
          riskAssessmentId: 0, // Will be replaced after insert
          orderId: order.id,
          createdAt: daysAgo(createdDaysAgo),
        },
      });
    }
  }

  // 2.5. Create specific orders and assessments for alpha_gadgets and beta_crafts
  console.log("  Creating orders and assessments for alpha_gadgets and beta_crafts...");
  
  const alphaGadgets = stores.find((s) => s.name === "Alpha Gadgets");
  const betaCrafts = stores.find((s) => s.name === "Beta Crafts");
  
  if (alphaGadgets && betaCrafts && badAccount && mrGood) {
    // Get products from these stores
    const alphaProducts = await db
      .select()
      .from(products)
      .where(eq(products.storeId, alphaGadgets.id))
      .limit(10);
    
    const betaProducts = await db
      .select()
      .from(products)
      .where(eq(products.storeId, betaCrafts.id))
      .limit(10);
    
    // Get user profiles for addresses
    const testUserProfiles = await db
      .select()
      .from(userProfiles)
      .where(inArray(userProfiles.userId, [badAccount.id, mrGood.id]));
    
    const badAccountProfile = testUserProfiles.find((p) => p.userId === badAccount.id);
    const mrGoodProfile = testUserProfiles.find((p) => p.userId === mrGood.id);
    
    // Create addresses if they don't exist
    const existingAddresses = await db
      .select()
      .from(addresses)
      .where(inArray(addresses.userId, [badAccount.id, mrGood.id]));
    
    const badAccountAddress = existingAddresses.find((a) => a.userId === badAccount.id);
    const mrGoodAddress = existingAddresses.find((a) => a.userId === mrGood.id);
    
    let badAccountAddressId = badAccountAddress?.id;
    let mrGoodAddressId = mrGoodAddress?.id;
    
    // Create addresses if needed
    if (!badAccountAddressId && badAccountProfile) {
      const [newAddress] = await db
        .insert(addresses)
        .values({
          userId: badAccount.id,
          type: "shipping",
          firstName: badAccountProfile.firstName ?? "Bad",
          lastName: badAccountProfile.lastName ?? "Account",
          addressLine1: "123 Suspicious Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "AU",
          isDefault: true,
        })
        .returning();
      badAccountAddressId = newAddress.id;
    }
    
    if (!mrGoodAddressId && mrGoodProfile) {
      const [newAddress] = await db
        .insert(addresses)
        .values({
          userId: mrGood.id,
          type: "shipping",
          firstName: mrGoodProfile.firstName ?? "Good",
          lastName: mrGoodProfile.lastName ?? "Buyer",
          addressLine1: "456 Trustworthy Avenue",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "AU",
          isDefault: true,
        })
        .returning();
      mrGoodAddressId = newAddress.id;
    }
    
    // Create 5 denied orders for badaccount at alpha_gadgets
    for (let i = 0; i < 5; i++) {
      if (alphaProducts.length === 0) continue;
      
      const selectedProducts = alphaProducts.slice(0, randomInt(1, 3));
      let totalAmount = 0;
      const itemsData: Array<{ productId: number; quantity: number; priceAtTime: number }> = [];
      
      for (const product of selectedProducts) {
        const quantity = randomInt(1, 3);
        const priceAtTime = product.price ?? 0;
        totalAmount += priceAtTime * quantity;
        itemsData.push({ productId: product.id, quantity, priceAtTime });
      }
      
      totalAmount += cents(randomInt(5, 15)); // Add shipping
      
      const createdDaysAgo = randomInt(20, 90);
      const createdAt = daysAgo(createdDaysAgo);
      
      // Create order
      const [newOrder] = await db
        .insert(orders)
        .values({
          userId: badAccount.id,
          storeId: alphaGadgets.id,
          status: "Denied",
          paymentStatus: "Failed",
          totalAmount,
          createdAt,
          updatedAt: createdAt,
        })
        .returning();
      
      const orderId = newOrder!.id;
      
      // Create order items
      for (const item of itemsData) {
        await db.insert(orderItems).values({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
        });
      }
      
      // Create order address if we have an address
      if (badAccountAddressId && badAccountProfile) {
        await db.insert(orderAddresses).values({
          orderId,
          type: "shipping",
          firstName: badAccountProfile.firstName ?? "Bad",
          lastName: badAccountProfile.lastName ?? "Account",
          addressLine1: "123 Suspicious Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "AU",
          createdAt,
        });
      }
      
      // Create risk assessment
      const riskScore = randomInt(80, 98);
      const decision: "deny" = "deny";
      const confidence = randomInt(85, 98);
      
      assessmentsData.push({
        assessment: {
          userId: badAccount.id,
          orderId,
          paymentIntentId: `pi_alpha_bad_${uuidv4().substring(0, 10)}`,
          riskScore,
          decision,
          confidence,
          transactionAmount: totalAmount,
          currency: "AUD",
          itemCount: itemsData.length,
          storeCount: 1,
          riskFactors: generateRiskFactors(decision),
          aiJustification: generateAIJustification(decision, riskScore),
          justificationGeneratedAt: daysAgo(createdDaysAgo - randomInt(0, 2)),
          userAgent: randomItem(userAgents),
          ipAddress: generateIPAddress(),
          shippingCountry: "AU",
          shippingState: "NSW",
          shippingCity: "Sydney",
          createdAt,
        },
        storeLinks: [
          {
            riskAssessmentId: 0,
            storeId: alphaGadgets.id,
            storeOrderId: orderId,
            storeSubtotal: totalAmount,
            storeItemCount: itemsData.length,
            createdAt,
          },
        ],
        orderLink: {
          riskAssessmentId: 0,
          orderId,
          createdAt,
        },
      });
    }
    
    // Create 5 denied orders for badaccount at beta_crafts
    for (let i = 0; i < 5; i++) {
      if (betaProducts.length === 0) continue;
      
      const selectedProducts = betaProducts.slice(0, randomInt(1, 3));
      let totalAmount = 0;
      const itemsData: Array<{ productId: number; quantity: number; priceAtTime: number }> = [];
      
      for (const product of selectedProducts) {
        const quantity = randomInt(1, 2);
        const priceAtTime = product.price ?? 0;
        totalAmount += priceAtTime * quantity;
        itemsData.push({ productId: product.id, quantity, priceAtTime });
      }
      
      totalAmount += cents(randomInt(5, 15)); // Add shipping
      
      const createdDaysAgo = randomInt(25, 100);
      const createdAt = daysAgo(createdDaysAgo);
      
      // Create order
      const [newOrder] = await db
        .insert(orders)
        .values({
          userId: badAccount.id,
          storeId: betaCrafts.id,
          status: "Denied",
          paymentStatus: "Failed",
          totalAmount,
          createdAt,
          updatedAt: createdAt,
        })
        .returning();
      
      const orderId = newOrder!.id;
      
      // Create order items
      for (const item of itemsData) {
        await db.insert(orderItems).values({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
        });
      }
      
      // Create order address
      if (badAccountAddressId && badAccountProfile) {
        await db.insert(orderAddresses).values({
          orderId,
          type: "shipping",
          firstName: badAccountProfile.firstName ?? "Bad",
          lastName: badAccountProfile.lastName ?? "Account",
          addressLine1: "123 Suspicious Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "AU",
          createdAt,
        });
      }
      
      // Create risk assessment
      const riskScore = randomInt(78, 96);
      const decision: "deny" = "deny";
      const confidence = randomInt(82, 96);
      
      assessmentsData.push({
        assessment: {
          userId: badAccount.id,
          orderId,
          paymentIntentId: `pi_beta_bad_${uuidv4().substring(0, 10)}`,
          riskScore,
          decision,
          confidence,
          transactionAmount: totalAmount,
          currency: "AUD",
          itemCount: itemsData.length,
          storeCount: 1,
          riskFactors: generateRiskFactors(decision),
          aiJustification: generateAIJustification(decision, riskScore),
          justificationGeneratedAt: daysAgo(createdDaysAgo - randomInt(0, 2)),
          userAgent: randomItem(userAgents),
          ipAddress: generateIPAddress(),
          shippingCountry: "AU",
          shippingState: "NSW",
          shippingCity: "Sydney",
          createdAt,
        },
        storeLinks: [
          {
            riskAssessmentId: 0,
            storeId: betaCrafts.id,
            storeOrderId: orderId,
            storeSubtotal: totalAmount,
            storeItemCount: itemsData.length,
            createdAt,
          },
        ],
        orderLink: {
          riskAssessmentId: 0,
          orderId,
          createdAt,
        },
      });
    }
    
    // Create 6 allowed orders for test_buyer at alpha_gadgets
    for (let i = 0; i < 6; i++) {
      if (alphaProducts.length === 0) continue;
      
      const selectedProducts = alphaProducts.slice(0, randomInt(1, 4));
      let totalAmount = 0;
      const itemsData: Array<{ productId: number; quantity: number; priceAtTime: number }> = [];
      
      for (const product of selectedProducts) {
        const quantity = randomInt(1, 2);
        const priceAtTime = product.price ?? 0;
        totalAmount += priceAtTime * quantity;
        itemsData.push({ productId: product.id, quantity, priceAtTime });
      }
      
      totalAmount += cents(randomInt(5, 15)); // Add shipping
      
      const createdDaysAgo = randomInt(5, 60);
      const createdAt = daysAgo(createdDaysAgo);
      
      // Create order
      const [newOrder] = await db
        .insert(orders)
        .values({
          userId: mrGood.id,
          storeId: alphaGadgets.id,
          status: "Completed",
          paymentStatus: "Paid",
          totalAmount,
          createdAt,
          updatedAt: createdAt,
        })
        .returning();
      
      const orderId = newOrder!.id;
      
      // Create order items
      for (const item of itemsData) {
        await db.insert(orderItems).values({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
        });
      }
      
      // Create order address
      if (mrGoodAddressId && mrGoodProfile) {
        await db.insert(orderAddresses).values({
          orderId,
          type: "shipping",
          firstName: mrGoodProfile.firstName ?? "Good",
          lastName: mrGoodProfile.lastName ?? "Buyer",
          addressLine1: "456 Trustworthy Avenue",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "AU",
          createdAt,
        });
      }
      
      // Create risk assessment
      const riskScore = randomInt(8, 28);
      const decision: "allow" = "allow";
      const confidence = randomInt(88, 99);
      
      assessmentsData.push({
        assessment: {
          userId: mrGood.id,
          orderId,
          paymentIntentId: `pi_alpha_good_${uuidv4().substring(0, 10)}`,
          riskScore,
          decision,
          confidence,
          transactionAmount: totalAmount,
          currency: "AUD",
          itemCount: itemsData.length,
          storeCount: 1,
          riskFactors: generateRiskFactors(decision),
          aiJustification: generateAIJustification(decision, riskScore),
          justificationGeneratedAt: daysAgo(createdDaysAgo - randomInt(0, 2)),
          userAgent: randomItem(userAgents),
          ipAddress: generateIPAddress(),
          shippingCountry: "AU",
          shippingState: "VIC",
          shippingCity: "Melbourne",
          createdAt,
        },
        storeLinks: [
          {
            riskAssessmentId: 0,
            storeId: alphaGadgets.id,
            storeOrderId: orderId,
            storeSubtotal: totalAmount,
            storeItemCount: itemsData.length,
            createdAt,
          },
        ],
        orderLink: {
          riskAssessmentId: 0,
          orderId,
          createdAt,
        },
      });
    }
    
    // Create 6 allowed orders for test_buyer at beta_crafts
    for (let i = 0; i < 6; i++) {
      if (betaProducts.length === 0) continue;
      
      const selectedProducts = betaProducts.slice(0, randomInt(1, 3));
      let totalAmount = 0;
      const itemsData: Array<{ productId: number; quantity: number; priceAtTime: number }> = [];
      
      for (const product of selectedProducts) {
        const quantity = randomInt(1, 2);
        const priceAtTime = product.price ?? 0;
        totalAmount += priceAtTime * quantity;
        itemsData.push({ productId: product.id, quantity, priceAtTime });
      }
      
      totalAmount += cents(randomInt(5, 15)); // Add shipping
      
      const createdDaysAgo = randomInt(10, 70);
      const createdAt = daysAgo(createdDaysAgo);
      
      // Create order
      const [newOrder] = await db
        .insert(orders)
        .values({
          userId: mrGood.id,
          storeId: betaCrafts.id,
          status: "Completed",
          paymentStatus: "Paid",
          totalAmount,
          createdAt,
          updatedAt: createdAt,
        })
        .returning();
      
      const orderId = newOrder!.id;
      
      // Create order items
      for (const item of itemsData) {
        await db.insert(orderItems).values({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
        });
      }
      
      // Create order address
      if (mrGoodAddressId && mrGoodProfile) {
        await db.insert(orderAddresses).values({
          orderId,
          type: "shipping",
          firstName: mrGoodProfile.firstName ?? "Good",
          lastName: mrGoodProfile.lastName ?? "Buyer",
          addressLine1: "456 Trustworthy Avenue",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "AU",
          createdAt,
        });
      }
      
      // Create risk assessment
      const riskScore = randomInt(5, 25);
      const decision: "allow" = "allow";
      const confidence = randomInt(90, 99);
      
      assessmentsData.push({
        assessment: {
          userId: mrGood.id,
          orderId,
          paymentIntentId: `pi_beta_good_${uuidv4().substring(0, 10)}`,
          riskScore,
          decision,
          confidence,
          transactionAmount: totalAmount,
          currency: "AUD",
          itemCount: itemsData.length,
          storeCount: 1,
          riskFactors: generateRiskFactors(decision),
          aiJustification: generateAIJustification(decision, riskScore),
          justificationGeneratedAt: daysAgo(createdDaysAgo - randomInt(0, 2)),
          userAgent: randomItem(userAgents),
          ipAddress: generateIPAddress(),
          shippingCountry: "AU",
          shippingState: "VIC",
          shippingCity: "Melbourne",
          createdAt,
        },
        storeLinks: [
          {
            riskAssessmentId: 0,
            storeId: betaCrafts.id,
            storeOrderId: orderId,
            storeSubtotal: totalAmount,
            storeItemCount: itemsData.length,
            createdAt,
          },
        ],
        orderLink: {
          riskAssessmentId: 0,
          orderId,
          createdAt,
        },
      });
    }
  }

  // 3. Create mixed assessments for test users (excluding badaccount and mrgood)
  const testUsersWithoutSpecial = testUsers.filter(
    (u) => u.username !== "badaccount" && u.username !== "MrGood",
  );

  for (const testUser of testUsersWithoutSpecial) {
    const testUserOrders = seededOrders.filter((o) => o.userId === testUser.id);
    if (testUserOrders.length === 0) continue;

    const assessmentCount = randomInt(3, 6);
    for (let i = 0; i < assessmentCount; i++) {
      const order = testUserOrders[i % testUserOrders.length];
      const store = stores.find((s) => s.id === order.storeId);
      if (!store) continue;

      // Fetch order items
      const orderItemsData = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      const itemCount = orderItemsData.length;
      const transactionAmount = order.totalAmount;

      // Random decision with skewed distribution
      const decisionRand = Math.random();
      let decision: "allow" | "warn" | "deny";
      let riskScore: number;
      let confidence: number;

      if (decisionRand < 0.05) {
        // 5% deny
        decision = "deny";
        riskScore = randomInt(70, 95);
        confidence = randomInt(70, 90);
      } else if (decisionRand < 0.25) {
        // 20% warn
        decision = "warn";
        riskScore = randomInt(45, 70);
        confidence = randomInt(75, 90);
      } else {
        // 75% allow
        decision = "allow";
        riskScore = randomInt(10, 40);
        confidence = randomInt(85, 98);
      }

      const createdDaysAgo = randomInt(5, 60);

      assessmentsData.push({
        assessment: {
          userId: testUser.id,
          orderId: order.id,
          paymentIntentId: `pi_dummy_${uuidv4().substring(0, 10)}`,
          riskScore,
          decision,
          confidence,
          transactionAmount,
          currency: "AUD",
          itemCount,
          storeCount: 1,
          riskFactors: generateRiskFactors(decision),
          aiJustification: generateAIJustification(decision, riskScore),
          justificationGeneratedAt: daysAgo(createdDaysAgo - randomInt(0, 2)),
          userAgent: randomItem(userAgents),
          ipAddress: generateIPAddress(),
          shippingCountry: "AU",
          shippingState: randomItem(["NSW", "VIC", "QLD", "WA", "SA"]),
          shippingCity: randomItem([
            "Sydney",
            "Melbourne",
            "Brisbane",
            "Perth",
            "Adelaide",
          ]),
          createdAt: daysAgo(createdDaysAgo),
        },
        storeLinks: [
          {
            riskAssessmentId: 0,
            storeId: store.id,
            storeOrderId: order.id,
            storeSubtotal: transactionAmount,
            storeItemCount: itemCount,
            createdAt: daysAgo(createdDaysAgo),
          },
        ],
        orderLink: {
          riskAssessmentId: 0,
          orderId: order.id,
          createdAt: daysAgo(createdDaysAgo),
        },
      });
    }
  }

  // 4. Create a few assessments for regular customers
  console.log("  Creating assessments for regular customers...");
  const selectedCustomers = regularCustomers.slice(0, 50);

  for (const customer of selectedCustomers) {
    const customerOrders = seededOrders.filter((o) => o.userId === customer.id);
    if (customerOrders.length === 0) continue;

    const assessmentCount = randomInt(1, 3);
    for (let i = 0; i < assessmentCount; i++) {
      const order = customerOrders[i % customerOrders.length];
      const store = stores.find((s) => s.id === order.storeId);
      if (!store) continue;

      const orderItemsData = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      const itemCount = orderItemsData.length;
      const transactionAmount = order.totalAmount;

      // Most regular customers get allowed transactions
      const decisionRand = Math.random();
      let decision: "allow" | "warn" | "deny";
      let riskScore: number;
      let confidence: number;

      if (decisionRand < 0.02) {
        decision = "deny";
        riskScore = randomInt(75, 92);
        confidence = randomInt(75, 90);
      } else if (decisionRand < 0.15) {
        decision = "warn";
        riskScore = randomInt(45, 68);
        confidence = randomInt(78, 92);
      } else {
        decision = "allow";
        riskScore = randomInt(8, 35);
        confidence = randomInt(88, 98);
      }

      const createdDaysAgo = randomInt(10, 120);

      assessmentsData.push({
        assessment: {
          userId: customer.id,
          orderId: order.id,
          paymentIntentId: `pi_dummy_cust_${uuidv4().substring(0, 10)}`,
          riskScore,
          decision,
          confidence,
          transactionAmount,
          currency: "AUD",
          itemCount,
          storeCount: 1,
          riskFactors: generateRiskFactors(decision),
          aiJustification: generateAIJustification(decision, riskScore),
          justificationGeneratedAt: daysAgo(createdDaysAgo - randomInt(0, 2)),
          userAgent: randomItem(userAgents),
          ipAddress: generateIPAddress(),
          shippingCountry: "AU",
          shippingState: randomItem(["NSW", "VIC", "QLD", "WA", "SA", "TAS"]),
          shippingCity: randomItem([
            "Sydney",
            "Melbourne",
            "Brisbane",
            "Perth",
            "Adelaide",
            "Canberra",
          ]),
          createdAt: daysAgo(createdDaysAgo),
        },
        storeLinks: [
          {
            riskAssessmentId: 0,
            storeId: store.id,
            storeOrderId: order.id,
            storeSubtotal: transactionAmount,
            storeItemCount: itemCount,
            createdAt: daysAgo(createdDaysAgo),
          },
        ],
        orderLink: {
          riskAssessmentId: 0,
          orderId: order.id,
          createdAt: daysAgo(createdDaysAgo),
        },
      });
    }
  }

  // Now insert all assessments
  console.log(`  Inserting ${assessmentsData.length} risk assessments...`);

  for (const data of assessmentsData) {
    // Insert the assessment
    const [inserted] = await db
      .insert(zeroTrustAssessments)
      .values(data.assessment)
      .returning();

    if (!inserted) continue;

    const assessmentId = inserted.id;

    // Insert store links
    const storeLinks = data.storeLinks.map((link) => ({
      ...link,
      riskAssessmentId: assessmentId,
    }));
    await db.insert(riskAssessmentStoreLinks).values(storeLinks);

    // Insert order link if present
    if (data.orderLink) {
      const orderLink = {
        ...data.orderLink,
        riskAssessmentId: assessmentId,
      };
      await db.insert(riskAssessmentOrderLinks).values(orderLink);
    }
  }

  // Count by decision
  const deniedCount = assessmentsData.filter((d) => d.assessment.decision === "deny").length;
  const warnedCount = assessmentsData.filter((d) => d.assessment.decision === "warn").length;
  const allowedCount = assessmentsData.filter((d) => d.assessment.decision === "allow").length;

  console.log(`✅ Created ${assessmentsData.length} risk assessments`);
  console.log(`   - Denied: ${deniedCount}`);
  console.log(`   - Warnings: ${warnedCount}`);
  console.log(`   - Allowed: ${allowedCount}`);
  console.log(`   - With store links and order links`);
  
  return assessmentsData.length;
}


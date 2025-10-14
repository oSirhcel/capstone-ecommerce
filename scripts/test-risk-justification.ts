/**
 * Test script for AI Risk Justification
 * Run with: npx tsx scripts/test-risk-justification.ts
 */

// Load environment variables from .env
import { config } from "dotenv";
config();

import { generateRiskJustification, generateShortSummary } from "@/lib/ai/risk-justification";
import type { RiskScore, RiskPayload } from "@/lib/zeroTrustMiddleware";

// Sample high-risk scenario
const highRiskScenario: RiskScore = {
  score: 75,
  decision: "deny",
  confidence: 0.85,
  factors: [
    {
      factor: "EXTREME_ITEM_COUNT",
      impact: 50,
      description: "Extremely high quantity (85 items) indicates potential fraud or reselling"
    },
    {
      factor: "NEW_ACCOUNT",
      impact: 15,
      description: "Account is only 2 day(s) old"
    },
    {
      factor: "RECENT_TRANSACTION_FAILURES",
      impact: 10,
      description: "3 failed transactions in last hour (card testing suspected)"
    }
  ]
};

const highRiskPayload: RiskPayload = {
  userId: "test-user-123",
  userEmail: "test@example.com",
  userType: "customer",
  totalAmount: 45000, // $450
  currency: "aud",
  itemCount: 85,
  uniqueItemCount: 3,
  items: [
    {
      productId: "prod-1",
      name: "iPhone 15 Pro",
      price: 1499,
      quantity: 30,
      storeId: "store-1",
      storeName: "Tech Electronics"
    },
    {
      productId: "prod-2",
      name: "AirPods Pro",
      price: 399,
      quantity: 50,
      storeId: "store-1",
      storeName: "Tech Electronics"
    },
    {
      productId: "prod-3",
      name: "USB-C Cable",
      price: 29,
      quantity: 5,
      storeId: "store-2",
      storeName: "Accessories Plus"
    }
  ],
  orderId: 12345,
  paymentMethodId: "pm_test123",
  savePaymentMethod: false,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  ipAddress: "203.123.45.67",
  timestamp: new Date().toISOString(),
  uniqueStoreCount: 2,
  storeDistribution: [
    {
      storeId: "store-1",
      storeName: "Tech Electronics",
      itemCount: 80,
      subtotal: 44970
    },
    {
      storeId: "store-2",
      storeName: "Accessories Plus",
      itemCount: 5,
      subtotal: 145
    }
  ],
  accountAge: 172800, // 2 days in seconds
  accountRole: "customer",
  totalPastTransactions: 3,
  successfulPastTransactions: 0,
  transactionSuccessRate: 0,
  recentTransactionFailures: 3,
  sessionPaymentMethodCount: 2
};

// Sample moderate-risk scenario
const moderateRiskScenario: RiskScore = {
  score: 35,
  decision: "warn",
  confidence: 0.72,
  factors: [
    {
      factor: "UNUSUAL_ITEM_COUNT",
      impact: 25,
      description: "High total quantity (12 items) may indicate bulk purchasing"
    },
    {
      factor: "NEW_PAYMENT_METHOD",
      impact: 20,
      description: "Using new/unsaved payment method"
    },
    {
      factor: "GOOD_TRANSACTION_HISTORY",
      impact: -10,
      description: "Excellent transaction history: 95.5% success rate over 22 transactions"
    }
  ]
};

const moderateRiskPayload: RiskPayload = {
  userId: "user-456",
  userEmail: "regular@customer.com",
  userType: "customer",
  totalAmount: 23450, // $234.50
  currency: "aud",
  itemCount: 12,
  uniqueItemCount: 5,
  items: [
    {
      productId: "prod-10",
      name: "Organic Coffee Beans",
      price: 1899,
      quantity: 6,
      storeId: "store-5",
      storeName: "Gourmet Foods"
    },
    {
      productId: "prod-11",
      name: "Ceramic Travel Mug",
      price: 3499,
      quantity: 3,
      storeId: "store-6",
      storeName: "Eco Living"
    },
    {
      productId: "prod-12",
      name: "Coffee Grinder",
      price: 8995,
      quantity: 1,
      storeId: "store-5",
      storeName: "Gourmet Foods"
    },
    {
      productId: "prod-13",
      name: "Reusable Filters",
      price: 1299,
      quantity: 2,
      storeId: "store-5",
      storeName: "Gourmet Foods"
    }
  ],
  orderId: 12346,
  paymentMethodId: "pm_new456",
  savePaymentMethod: false,
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  ipAddress: "203.45.67.89",
  timestamp: new Date().toISOString(),
  uniqueStoreCount: 2,
  storeDistribution: [
    {
      storeId: "store-5",
      storeName: "Gourmet Foods",
      itemCount: 9,
      subtotal: 20293
    },
    {
      storeId: "store-6",
      storeName: "Eco Living",
      itemCount: 3,
      subtotal: 10497
    }
  ],
  accountAge: 7776000, // 90 days
  accountRole: "customer",
  totalPastTransactions: 22,
  successfulPastTransactions: 21,
  transactionSuccessRate: 95.5,
  recentTransactionFailures: 0
};

async function testJustification() {
  console.log("🧪 Testing AI Risk Justification Service\n");
  console.log("=" .repeat(80));
  
  // Test 1: High Risk Scenario
  console.log("\n📊 TEST 1: HIGH RISK SCENARIO");
  console.log("-".repeat(80));
  console.log(`Score: ${highRiskScenario.score}/100 | Decision: ${highRiskScenario.decision.toUpperCase()}`);
  console.log(`Short Summary: ${generateShortSummary(highRiskScenario)}\n`);
  
  try {
    console.log("Generating AI justification...\n");
    const justification1 = await generateRiskJustification(highRiskScenario, highRiskPayload);
    console.log("📝 AI JUSTIFICATION:");
    console.log(justification1);
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  console.log("\n" + "=".repeat(80));
  
  // Test 2: Moderate Risk Scenario
  console.log("\n📊 TEST 2: MODERATE RISK SCENARIO");
  console.log("-".repeat(80));
  console.log(`Score: ${moderateRiskScenario.score}/100 | Decision: ${moderateRiskScenario.decision.toUpperCase()}`);
  console.log(`Short Summary: ${generateShortSummary(moderateRiskScenario)}\n`);
  
  try {
    console.log("Generating AI justification...\n");
    const justification2 = await generateRiskJustification(moderateRiskScenario, moderateRiskPayload);
    console.log("📝 AI JUSTIFICATION:");
    console.log(justification2);
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("\n✅ Test completed!");
}

// Run the test
testJustification().catch(console.error);



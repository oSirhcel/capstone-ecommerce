import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { zeroTrustAssessments, orders, users } from "@/server/db/schema";
import { auth } from "@/lib/auth";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user to create test data for them
    const currentUserId = session.user.id;

    // Create some test risk assessments with null orderIds (these will show up when "All Stores" is enabled)
    const testData = [
      {
        userId: currentUserId,
        orderId: null, // No order association - will show in "All Stores" view
        paymentIntentId: "pi_test_warn_1",
        riskScore: 65,
        decision: "warn",
        confidence: 75,
        transactionAmount: 15000, // $150
        currency: "aud",
        itemCount: 3,
        storeCount: 1,
        riskFactors: JSON.stringify([
          { factor: "HIGH_AMOUNT", impact: 20, description: "Transaction amount is above normal threshold" },
          { factor: "NEW_USER", impact: 15, description: "User account is relatively new" }
        ]),
        userAgent: "Mozilla/5.0 (Test Browser)",
        ipAddress: "192.168.1.100",
      },
      {
        userId: currentUserId, 
        orderId: null, // No order association - will show in "All Stores" view
        paymentIntentId: "pi_test_deny_1",
        riskScore: 85,
        decision: "deny",
        confidence: 90,
        transactionAmount: 50000, // $500
        currency: "aud",
        itemCount: 10,
        storeCount: 3,
        riskFactors: JSON.stringify([
          { factor: "VERY_HIGH_AMOUNT", impact: 40, description: "Transaction amount is extremely high" },
          { factor: "MULTIPLE_STORES", impact: 25, description: "Items from multiple stores in single transaction" },
          { factor: "SUSPICIOUS_IP", impact: 20, description: "IP address flagged as suspicious" }
        ]),
        userAgent: "Mozilla/5.0 (Suspicious Browser)",
        ipAddress: "10.0.0.1",
      },
      {
        userId: currentUserId,
        orderId: null, // No order association - will show in "All Stores" view
        paymentIntentId: "pi_test_warn_2",
        riskScore: 55,
        decision: "warn",
        confidence: 65,
        transactionAmount: 8000, // $80
        currency: "aud",
        itemCount: 2,
        storeCount: 1,
        riskFactors: JSON.stringify([
          { factor: "UNUSUAL_TIME", impact: 15, description: "Transaction at unusual hour" },
          { factor: "VELOCITY", impact: 10, description: "Multiple transactions in short time" }
        ]),
        userAgent: "Mozilla/5.0 (Mobile Browser)",
        ipAddress: "203.45.67.89",
      },
      {
        userId: currentUserId,
        orderId: null, // No order association - will show in "All Stores" view
        paymentIntentId: "pi_test_deny_2", 
        riskScore: 95,
        decision: "deny",
        confidence: 95,
        transactionAmount: 75000, // $750
        currency: "aud",
        itemCount: 15,
        storeCount: 5,
        riskFactors: JSON.stringify([
          { factor: "EXTREMELY_HIGH_AMOUNT", impact: 50, description: "Transaction amount is extremely suspicious" },
          { factor: "TOO_MANY_STORES", impact: 30, description: "Items from too many different stores" },
          { factor: "BLACKLISTED_IP", impact: 15, description: "IP address is blacklisted" }
        ]),
        userAgent: "Mozilla/5.0 (Malicious Browser)",
        ipAddress: "1.2.3.4",
      }
    ];

    const inserted = await db.insert(zeroTrustAssessments).values(testData).returning({ id: zeroTrustAssessments.id });

    return NextResponse.json({ 
      message: "Test data created successfully", 
      insertedIds: inserted.map(r => r.id)
    });
  } catch (error) {
    console.error("Error seeding test data:", error);
    return NextResponse.json({ error: "Failed to create test data" }, { status: 500 });
  }
}

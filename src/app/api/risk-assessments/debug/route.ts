import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { zeroTrustAssessments } from "@/server/db/schema";

export async function GET() {
  try {
    // Get count by decision type
    const decisionCounts = await db
      .select({
        decision: zeroTrustAssessments.decision,
        count: sql<number>`count(*)`,
      })
      .from(zeroTrustAssessments)
      .groupBy(zeroTrustAssessments.decision);

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(zeroTrustAssessments);

    // Get sample records
    const samples = await db
      .select({
        id: zeroTrustAssessments.id,
        decision: zeroTrustAssessments.decision,
        riskScore: zeroTrustAssessments.riskScore,
        createdAt: zeroTrustAssessments.createdAt,
      })
      .from(zeroTrustAssessments)
      .limit(10);

    return NextResponse.json({
      decisionCounts,
      totalCount: totalCount[0]?.count ?? 0,
      samples,
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json({ error: "Failed to fetch debug info" }, { status: 500 });
  }
}

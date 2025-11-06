import { type NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, inArray, or, sql, asc } from "drizzle-orm";
import { db } from "@/server/db";
import {
  users,
  userProfiles,
  zeroTrustAssessments,
  riskAssessmentStoreLinks,
} from "@/server/db/schema";
import type { SQL } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET /api/risk-assessments
// Query params:
// - decision: comma-separated values of decisions to include (e.g., warn,deny)
// - storeId: optional; if provided limits to orders for the store owner's products
// - search: optional; matches userId or ipAddress
// - page, limit: pagination
// - sortBy: column to sort by (e.g., createdAt, riskScore, decision, transactionAmount)
// - sortOrder: asc or desc
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const decisionParam = searchParams.get("decision");
    const storeIdParam =
      searchParams.get("storeId") ?? session.store?.id ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "20", 10),
      100,
    );
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    // decisions filter defaults to warn,deny for this endpoint
    const decisions = (decisionParam?.split(",").filter(Boolean) as Array<
      "allow" | "warn" | "deny"
    >) ?? ["warn", "deny"];
    const filteredDecisions =
      decisions.length > 0 ? decisions : ["warn", "deny"];

    // Create order by clause based on sortBy and sortOrder
    const getOrderBy = () => {
      let column;
      switch (sortBy) {
        case "riskScore":
          column = zeroTrustAssessments.riskScore;
          break;
        case "decision":
          column = zeroTrustAssessments.decision;
          break;
        case "transactionAmount":
          column = zeroTrustAssessments.transactionAmount;
          break;
        case "createdAt":
        default:
          column = zeroTrustAssessments.createdAt;
          break;
      }
      return sortOrder === "asc" ? asc(column) : desc(column);
    };

    // Build where clause
    const conditions: SQL[] = [
      inArray(zeroTrustAssessments.decision, filteredDecisions),
    ];

    if (search) {
      // Simple search against userId and ipAddress
      const searchCondition = or(
        ilike(zeroTrustAssessments.userId, `%${search}%`),
        ilike(zeroTrustAssessments.ipAddress, `%${search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // If store scoping is set (store owner), use the efficient riskAssessmentStoreLinks table
    let results;
    let totalCount = 0;

    if (storeIdParam) {
      // Use riskAssessmentStoreLinks for direct store filtering
      // This includes both single-store and multi-store transaction assessments
      const storeConditions = [
        ...conditions,
        eq(riskAssessmentStoreLinks.storeId, storeIdParam),
      ];

      const base = db
        .select({
          id: zeroTrustAssessments.id,
          userId: zeroTrustAssessments.userId,
          orderId: zeroTrustAssessments.orderId,
          paymentIntentId: zeroTrustAssessments.paymentIntentId,
          riskScore: zeroTrustAssessments.riskScore,
          decision: zeroTrustAssessments.decision,
          confidence: zeroTrustAssessments.confidence,
          transactionAmount: zeroTrustAssessments.transactionAmount,
          currency: zeroTrustAssessments.currency,
          itemCount: zeroTrustAssessments.itemCount,
          storeCount: zeroTrustAssessments.storeCount,
          riskFactors: zeroTrustAssessments.riskFactors,
          aiJustification: zeroTrustAssessments.aiJustification,
          justificationGeneratedAt:
            zeroTrustAssessments.justificationGeneratedAt,
          userAgent: zeroTrustAssessments.userAgent,
          ipAddress: zeroTrustAssessments.ipAddress,
          createdAt: zeroTrustAssessments.createdAt,
          userEmail: userProfiles.email,
          userName: userProfiles.firstName,
          userLastName: userProfiles.lastName,
          username: users.username,
          // Include store-specific data from the link table
          storeSubtotal: riskAssessmentStoreLinks.storeSubtotal,
          storeItemCount: riskAssessmentStoreLinks.storeItemCount,
        })
        .from(zeroTrustAssessments)
        .innerJoin(
          riskAssessmentStoreLinks,
          eq(
            zeroTrustAssessments.id,
            riskAssessmentStoreLinks.riskAssessmentId,
          ),
        )
        .leftJoin(users, eq(zeroTrustAssessments.userId, users.id))
        .leftJoin(
          userProfiles,
          eq(zeroTrustAssessments.userId, userProfiles.userId),
        )
        .where(and(...storeConditions))
        .orderBy(getOrderBy())
        .limit(limit)
        .offset(offset);

      results = await base;

      // Count total with store filter
      const countRows = await db
        .select({
          count: sql<number>`count(DISTINCT ${zeroTrustAssessments.id})`,
        })
        .from(zeroTrustAssessments)
        .innerJoin(
          riskAssessmentStoreLinks,
          eq(
            zeroTrustAssessments.id,
            riskAssessmentStoreLinks.riskAssessmentId,
          ),
        )
        .where(and(...storeConditions));
      totalCount = Number(countRows[0]?.count ?? 0);
    } else {
      // Global admin view: return all
      const base = db
        .select({
          id: zeroTrustAssessments.id,
          userId: zeroTrustAssessments.userId,
          orderId: zeroTrustAssessments.orderId,
          paymentIntentId: zeroTrustAssessments.paymentIntentId,
          riskScore: zeroTrustAssessments.riskScore,
          decision: zeroTrustAssessments.decision,
          confidence: zeroTrustAssessments.confidence,
          transactionAmount: zeroTrustAssessments.transactionAmount,
          currency: zeroTrustAssessments.currency,
          itemCount: zeroTrustAssessments.itemCount,
          storeCount: zeroTrustAssessments.storeCount,
          riskFactors: zeroTrustAssessments.riskFactors,
          aiJustification: zeroTrustAssessments.aiJustification,
          justificationGeneratedAt:
            zeroTrustAssessments.justificationGeneratedAt,
          userAgent: zeroTrustAssessments.userAgent,
          ipAddress: zeroTrustAssessments.ipAddress,
          createdAt: zeroTrustAssessments.createdAt,
          userEmail: userProfiles.email,
          userName: userProfiles.firstName,
          userLastName: userProfiles.lastName,
          username: users.username,
        })
        .from(zeroTrustAssessments)
        .leftJoin(users, eq(zeroTrustAssessments.userId, users.id))
        .leftJoin(
          userProfiles,
          eq(zeroTrustAssessments.userId, userProfiles.userId),
        )
        .where(and(...conditions))
        .orderBy(getOrderBy())
        .limit(limit)
        .offset(offset);

      results = await base;
      const countRows = await db
        .select({ count: sql<number>`count(*)` })
        .from(zeroTrustAssessments)
        .where(and(...conditions));
      totalCount = Number(countRows[0]?.count ?? 0);
    }

    // Parse risk factors for client consumption
    const parsed = results.map((r) => ({
      ...r,
      riskFactors: r.riskFactors
        ? (() => {
            try {
              return JSON.parse(r.riskFactors) as unknown[];
            } catch {
              return [];
            }
          })()
        : ([] as unknown[]),
    }));

    return NextResponse.json({
      assessments: parsed,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching risk assessments:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk assessments" },
      { status: 500 },
    );
  }
}

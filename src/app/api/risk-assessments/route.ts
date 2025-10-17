import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { orders, products, stores, users, zeroTrustAssessments } from "@/server/db/schema";
import { auth } from "@/lib/auth";

// GET /api/risk-assessments
// Query params:
// - decision: comma-separated values of decisions to include (e.g., warn,deny)
// - storeId: optional; if provided limits to orders for the store owner's products
// - search: optional; matches userId or ipAddress
// - page, limit: pagination
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const decisionParam = searchParams.get("decision");
    const storeIdParam = searchParams.get("storeId") ?? session.store?.id ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const offset = (page - 1) * limit;

    // decisions filter defaults to warn,deny for this endpoint
    const decisions = (decisionParam?.split(",").filter(Boolean) as Array<"allow"|"warn"|"deny">) ?? ["warn", "deny"];
    const filteredDecisions = decisions.length > 0 ? decisions : ["warn", "deny"];

    console.log("🔍 Risk assessments API debug:");
    console.log("  - decisionParam:", decisionParam);
    console.log("  - parsed decisions:", decisions);
    console.log("  - filteredDecisions:", filteredDecisions);
    console.log("  - storeIdParam:", storeIdParam);
    console.log("  - search:", search);

    // Build where clause
    const conditions: any[] = [inArray(zeroTrustAssessments.decision, filteredDecisions)];

    if (search) {
      // Simple search against userId and ipAddress
      conditions.push(
        or(
          ilike(zeroTrustAssessments.userId, `%${search}%`),
          ilike(zeroTrustAssessments.ipAddress, `%${search}%`),
        )
      );
    }

    // If store scoping is set (store owner), join through orders->order_items->products to limit to their store
    let results;
    let totalCount: number = 0;

    if (storeIdParam) {
      // We will filter by assessments where order has items from this store
      // Since assessments store only orderId, we match orderId exists and at least one order_item.product.storeId = storeIdParam
      // Simpler approach: fetch assessments by decision then post-filter by store ownership with a subquery
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
          justificationGeneratedAt: zeroTrustAssessments.justificationGeneratedAt,
          userAgent: zeroTrustAssessments.userAgent,
          ipAddress: zeroTrustAssessments.ipAddress,
          createdAt: zeroTrustAssessments.createdAt,
        })
        .from(zeroTrustAssessments)
        .where(and(...conditions))
        .orderBy(desc(zeroTrustAssessments.createdAt))
        .limit(limit)
        .offset(offset);

      const rows = await base;

      // Count total
      const countRows = await db
        .select({ count: sql<number>`count(*)` })
        .from(zeroTrustAssessments)
        .where(and(...conditions));
      totalCount = Number(countRows[0]?.count ?? 0);

      // Fetch orderIds and determine which belong to this store
      const orderIds = rows.map((r) => r.orderId).filter((id): id is number => typeof id === "number");

      console.log("🏪 Store filtering debug:");
      console.log("  - Found orderIds:", orderIds);
      console.log("  - Filtering for storeId:", storeIdParam);

      let orderIdForStore = new Set<number>();
      if (orderIds.length > 0) {
        // Join order_items -> products to get store ownership
        const orderItemsTable = (await import("@/server/db/schema")).orderItems;
        const productRows = await db
          .select({ orderId: orderItemsTable.orderId })
          .from(orderItemsTable)
          .leftJoin(products, eq(orderItemsTable.productId, products.id))
          .where(and(inArray(orderItemsTable.orderId, orderIds), eq(products.storeId, storeIdParam)));
        orderIdForStore = new Set(productRows.map((r) => r.orderId).filter(Boolean) as number[]);
        console.log("  - Orders belonging to store:", Array.from(orderIdForStore));
      }

      // For store filtering: include assessments with null orderId (they're not tied to specific orders)
      // and assessments with orderIds that belong to this store
      results = rows.filter((r) => {
        if (r.orderId === null) {
          // Include assessments with no order association (they're general risk assessments)
          return true;
        }
        return orderIdForStore.has(r.orderId);
      });
      console.log("  - Results after store filtering:", results.length);
      console.log("  - Filtered results decisions:", results.map(r => ({ id: r.id, decision: r.decision, orderId: r.orderId })));
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
          justificationGeneratedAt: zeroTrustAssessments.justificationGeneratedAt,
          userAgent: zeroTrustAssessments.userAgent,
          ipAddress: zeroTrustAssessments.ipAddress,
          createdAt: zeroTrustAssessments.createdAt,
        })
        .from(zeroTrustAssessments)
        .where(and(...conditions))
        .orderBy(desc(zeroTrustAssessments.createdAt))
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
      riskFactors: r.riskFactors ? (() => { try { return JSON.parse(r.riskFactors as unknown as string); } catch { return []; } })() : [],
    }));

    console.log("📊 Query results:");
    console.log("  - Total count:", totalCount);
    console.log("  - Results found:", results.length);
    console.log("  - Sample decisions:", results.slice(0, 5).map(r => ({ id: r.id, decision: r.decision, score: r.riskScore })));

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
    return NextResponse.json({ error: "Failed to fetch risk assessments" }, { status: 500 });
  }
}



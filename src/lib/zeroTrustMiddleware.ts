import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  orderItems,
  products,
  cartItems,
  carts,
  zeroTrustAssessments,
  users,
  stores,
  riskAssessmentStoreLinks,
} from "@/server/db/schema";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { generateJustificationBackground } from "@/lib/api/risk-justification-server";

export type RiskDecision = "allow" | "deny" | "warn";

// Input types for the zero trust check - flexible to handle different request types
export interface PaymentRequestBody {
  amount: number;
  currency?: string;
  items?: PaymentItem[]; // Optional since payment API doesn't include items
  orderId?: number;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
  auth?: {
    user?: {
      id?: string;
      email?: string;
      userType?: string;
    };
  };
  shippingData?: {
    country?: string;
    state?: string;
    city?: string;
  };
}

export interface PaymentItem {
  id?: string;
  productId?: string;
  name?: string;
  price?: number;
  quantity?: number;
  storeId?: string;
  storeName?: string;
}

export interface RiskPayload {
  // User information
  userId: string | null;
  userEmail: string | null;
  userType: string | null;

  // Transaction details
  totalAmount: number; // in cents
  currency: string;
  itemCount: number; // Total quantity of all items
  uniqueItemCount: number; // Number of unique products
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    storeId: string;
    storeName: string;
  }>;

  // Order information
  orderId?: number;
  paymentMethodId?: string;
  savePaymentMethod: boolean;

  // Request metadata
  userAgent: string | null;
  ipAddress: string | null;
  timestamp: string;

  // Store distribution (multi-vendor risk)
  uniqueStoreCount: number;
  storeDistribution: Array<{
    storeId: string;
    storeName: string;
    itemCount: number;
    subtotal: number;
  }>;

  // Session & account security factors (NEW)
  sessionTokenAge?: number; // Age of session token in seconds
  concurrentSessions?: number; // Number of active sessions for this user
  failedLoginAttempts?: number; // Recent failed login attempts (last 24h)
  accountAge?: number; // Age of account in seconds
  accountRole?: string; // 'customer', 'vendor', 'admin'

  // Transaction history factors (NEW)
  totalPastTransactions?: number; // Total transactions user has made
  successfulPastTransactions?: number; // Number of successful transactions
  transactionSuccessRate?: number; // Percentage (0-100)

  // Recent activity factors (NEW)
  recentTransactionFailures?: number; // Failed transactions in last hour
  sessionPaymentMethodCount?: number; // Number of different payment methods tried in this session
}

export interface RiskScore {
  score: number; // 0-100, higher = more risky
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  decision: RiskDecision;
  confidence: number; // 0-1
}

// Risk scoring thresholds (configurable) - More aggressive thresholds
const RISK_THRESHOLDS = {
  ALLOW_MAX: 20, // 0-20: Allow (lower threshold)
  WARN_MAX: 50, // 21-50: Warn (lower threshold)
  DENY_MIN: 51, // 51-100: Deny (much lower threshold)
};

// Risk factors and their maximum impact scores - Enhanced session & behavioral scoring
const RISK_FACTORS = {
  // Transaction-based factors
  HIGH_AMOUNT: { max: 30, threshold: 30000 }, // $300+ AUD in cents
  UNUSUAL_ITEM_COUNT: { max: 35, threshold: 4 }, // 5+ items
  EXTREME_ITEM_COUNT: { max: 50, threshold: 16 }, // 30+ items - immediate high risk
  BULK_SINGLE_ITEM: { max: 40, threshold: 7 }, // 10+ of single item
  EXTREME_BULK_SINGLE: { max: 45, threshold: 20 }, // 50+ of single item - extreme risk
  MULTIPLE_STORES: { max: 25, threshold: 2 }, // 2+ stores in single transaction

  // Technical/session factors
  SUSPICIOUS_USER_AGENT: { max: 15 },
  NEW_PAYMENT_METHOD: { max: 20 },
  OLD_SESSION_TOKEN: { max: 20, threshold: 172800 }, // 48+ hours old (in seconds)
  AGED_SESSION_TOKEN: { max: 10, threshold: 86400 }, // 24-48 hours old (in seconds)

  // Account security factors
  CONCURRENT_SESSIONS: { max: 25, threshold: 4 }, // 4+ active sessions
  MODERATE_CONCURRENT_SESSIONS: { max: 10, threshold: 3 }, // 3 active sessions
  FAILED_LOGIN_ATTEMPTS: { max: 30, threshold: 6 }, // 6+ recent failed logins
  SOME_FAILED_LOGINS: { max: 15, threshold: 3 }, // 3-5 failed logins
  FEW_FAILED_LOGINS: { max: 5, threshold: 1 }, // 1-2 failed logins

  // Transaction history factors
  FIRST_TIME_BUYER: { max: 15 }, // No transaction history (higher risk for first-time buyer)
  LIMITED_HISTORY_POOR: { max: 20, threshold: 50 }, // 1-4 transactions, <50% success rate
  LIMITED_HISTORY_MODERATE: { max: 8, threshold: 70 }, // 1-4 transactions, 50-70% success rate
  LIMITED_HISTORY_GOOD: { bonus: -5, threshold: 90 }, // 1-4 transactions, 90%+ success (small trust bonus)
  POOR_TRANSACTION_HISTORY: { max: 25, threshold: 50 }, // 5+ transactions, <50% success rate
  MODERATE_TRANSACTION_HISTORY: { max: 10, threshold: 70 }, // 5+ transactions, 50-70% success rate
  GOOD_TRANSACTION_HISTORY: { bonus: -15, threshold: 90 }, // 5+ transactions, 90%+ success rate (reduces risk)
  EXCELLENT_HISTORY: { bonus: -20, threshold: 95 }, // 10+ transactions, 95%+ success rate (significant trust)

  // Recent activity factors
  RECENT_TRANSACTION_FAILURES: { max: 40, threshold: 5 }, // 5+ failures in last hour
  MULTIPLE_TRANSACTION_FAILURES: { max: 25, threshold: 3 }, // 3-4 failures in last hour
  SINGLE_TRANSACTION_FAILURE: { max: 10, threshold: 1 }, // 1-2 failures in last hour

  // Payment behavior factors
  MULTIPLE_PAYMENT_METHODS: { max: 25, threshold: 3 }, // 3+ different payment methods in session
  TWO_PAYMENT_METHODS: { max: 10, threshold: 2 }, // 2 payment methods in session

  // Role-based factors
  NEW_ACCOUNT: { max: 10, threshold: 604800 }, // Account < 7 days old (in seconds)
  TRUSTED_ROLE: { bonus: -10 }, // Vendor/admin accounts (negative = reduces risk)
};

/*
    Zero Trust Check - Analyzes payment requests for fraud risk
    Returns risk score and decision (allow/warn/deny)
*/
// Type for checkout session data
interface CheckoutSessionItem {
  productId: string | number;
  price: number;
  quantity: number;
}

interface CheckoutSessionData {
  items: CheckoutSessionItem[];
}

export async function zeroTrustCheck(
  req: NextRequest,
  body: PaymentRequestBody,
  session?: {
    user?: { id?: string; email?: string | null; userType?: string };
  },
  checkoutSessionData?: CheckoutSessionData, // Complete checkout session data for multi-store analysis
): Promise<NextResponse> {
  try {
    // Extract and validate basic payment data
    const {
      amount,
      currency = "aud",
      items = [],
      orderId,
      paymentMethodId,
      savePaymentMethod = false,
    } = body;
    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 },
      );
    }

    // Extract user information from session parameter or body
    const userId = session?.user?.id ?? body.auth?.user?.id ?? null;
    const userEmail = session?.user?.email ?? body.auth?.user?.email ?? null;
    const userType =
      session?.user?.userType ?? body.auth?.user?.userType ?? null;

    // Prioritize complete checkout session data for multi-store analysis
    let enrichedItems: PaymentItem[] = items;

    // Use complete checkout session data if available (for multi-store analysis)
    if (
      checkoutSessionData?.items &&
      Array.isArray(checkoutSessionData.items)
    ) {
      console.log(
        `Zero Trust: Using complete checkout session data with ${checkoutSessionData.items.length} items`,
      );

      // Enrich checkout session data with product and store information
      try {
        const productIds = checkoutSessionData.items
          .map((item: CheckoutSessionItem) => item.productId)
          .filter((id: string | number) => id != null)
          .map((id: string | number) => Number(id))
          .filter((id: number) => !isNaN(id));

        if (productIds.length > 0) {
          const productData = await db
            .select({
              id: products.id,
              name: products.name,
              price: products.price,
              storeId: products.storeId,
              storeName: stores.name,
            })
            .from(products)
            .leftJoin(stores, eq(products.storeId, stores.id))
            .where(inArray(products.id, productIds));

          // Create a lookup map for product data
          const productMap = new Map(productData.map((p) => [p.id, p]));

          enrichedItems = checkoutSessionData.items.map(
            (item: CheckoutSessionItem) => {
              const productInfo = productMap.get(Number(item.productId));
              return {
                id: item.productId?.toString() ?? "unknown",
                productId: item.productId?.toString() ?? "unknown",
                name: productInfo?.name ?? "Unknown Product",
                price: item.price ?? 0,
                quantity: item.quantity ?? 1,
                storeId: productInfo?.storeId?.toString() ?? "unknown",
                storeName: productInfo?.storeName ?? "Unknown Store",
              };
            },
          );

          console.log(
            `Zero Trust: Enriched ${enrichedItems.length} items with product and store data`,
          );
        } else {
          // Fallback if no valid product IDs
          enrichedItems = checkoutSessionData.items.map(
            (item: CheckoutSessionItem) => ({
              id: item.productId?.toString() ?? "unknown",
              productId: item.productId?.toString() ?? "unknown",
              name: "Unknown Product",
              price: item.price ?? 0,
              quantity: item.quantity ?? 1,
              storeId: "unknown",
              storeName: "Unknown Store",
            }),
          );
        }
      } catch (error) {
        console.error("Failed to enrich checkout session data:", error);
        // Fallback to basic mapping
        enrichedItems = checkoutSessionData.items.map(
          (item: CheckoutSessionItem) => ({
            id: item.productId?.toString() ?? "unknown",
            productId: item.productId?.toString() ?? "unknown",
            name: "Unknown Product",
            price: item.price ?? 0,
            quantity: item.quantity ?? 1,
            storeId: "unknown",
            storeName: "Unknown Store",
          }),
        );
      }
    } else if (items.length === 0 && orderId && userId) {
      // Fetch order items from database
      try {
        const orderData = await db
          .select({
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            price: orderItems.priceAtTime,
            name: products.name,
            storeId: products.storeId,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, orderId));

        enrichedItems = orderData.map((item) => ({
          id: item.productId.toString(),
          productId: item.productId.toString(),
          name: item.name,
          price: item.price / 100, // Convert from cents
          quantity: item.quantity,
          storeId: item.storeId?.toString() ?? "unknown",
          storeName: "Unknown Store", // We'd need to join stores table for this
        }));

        console.log(
          `Zero Trust: Fetched ${enrichedItems.length} items from order ${orderId}`,
        );
      } catch (error) {
        console.error(
          "Failed to fetch order items for zero trust check:",
          error,
        );
      }
    }

    if (enrichedItems.length === 0 && userId) {
      // Fallback: fetch current cart items
      try {
        const cartData = await db
          .select({
            productId: cartItems.productId,
            quantity: cartItems.quantity,
            name: products.name,
            price: products.price,
            storeId: products.storeId,
          })
          .from(cartItems)
          .innerJoin(products, eq(cartItems.productId, products.id))
          .innerJoin(carts, eq(cartItems.cartId, carts.id))
          .where(eq(carts.userId, userId));

        enrichedItems = cartData.map((item) => ({
          id: item.productId.toString(),
          productId: item.productId.toString(),
          name: item.name,
          price: (item.price ?? 0) / 100, // Convert from cents
          quantity: item.quantity,
          storeId: item.storeId?.toString() ?? "unknown",
          storeName: "Unknown Store",
        }));

        console.log(
          `Zero Trust: Fetched ${enrichedItems.length} items from user cart`,
        );
      } catch (error) {
        console.error(
          "Failed to fetch cart items for zero trust check:",
          error,
        );
      }
    }

    // NEW: Collect session and account security metrics
    let sessionTokenAge: number | undefined;
    let concurrentSessions: number | undefined;
    let failedLoginAttempts: number | undefined;
    let accountAge: number | undefined;
    let accountRole: string | undefined;
    let totalPastTransactions: number | undefined;
    let successfulPastTransactions: number | undefined;
    let transactionSuccessRate: number | undefined;
    let recentTransactionFailures: number | undefined;
    let sessionPaymentMethodCount: number | undefined;

    if (userId) {
      try {
        // Get user account details
        const [user] = await db
          .select({
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user) {
          // Calculate account age in seconds
          accountAge = Math.floor(
            (Date.now() - user.createdAt.getTime()) / 1000,
          );
        }

        // Determine account role (check if user owns a store = vendor)
        const [store] = await db
          .select()
          .from(stores)
          .where(eq(stores.ownerId, userId))
          .limit(1);

        accountRole = store ? "vendor" : "customer";

        // Calculate transaction success rate based on risk assessment decisions
        // A transaction is considered successful if the risk assessment decision was 'allow'
        const riskStats = await db
          .select({
            total: sql<number>`count(*)`,
            successful: sql<number>`count(case when ${zeroTrustAssessments.decision} = 'allow' then 1 end)`,
          })
          .from(zeroTrustAssessments)
          .where(eq(zeroTrustAssessments.userId, userId));

        if (riskStats.length > 0 && riskStats[0].total > 0) {
          totalPastTransactions = riskStats[0].total;
          successfulPastTransactions = riskStats[0].successful;
          transactionSuccessRate =
            (successfulPastTransactions / totalPastTransactions) * 100;
        }

        // Count recent failed transactions (last hour) based on risk assessment decisions
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const failedTransactions = await db
          .select({ count: sql<number>`count(*)` })
          .from(zeroTrustAssessments)
          .where(
            and(
              eq(zeroTrustAssessments.userId, userId),
              eq(zeroTrustAssessments.decision, "deny"),
              sql`${zeroTrustAssessments.createdAt} >= ${oneHourAgo}`,
            ),
          );

        if (failedTransactions.length > 0) {
          recentTransactionFailures = failedTransactions[0].count;
        }

        // TODO: Implement session token age calculation
        // This would require JWT decoding to get 'iat' (issued at) claim
        // Example: sessionTokenAge = Math.floor(Date.now() / 1000) - session.iat;

        // TODO: Implement concurrent sessions tracking
        // This would require a sessions table to track active sessions
        // Example: SELECT COUNT(*) FROM sessions WHERE userId = ? AND expiresAt > NOW()

        // TODO: Implement failed login attempts tracking
        // This would require a login_attempts table
        // Example: SELECT COUNT(*) FROM login_attempts WHERE userId = ? AND success = false AND createdAt > NOW() - INTERVAL '24 hours'

        // TODO: Implement session payment method count
        // This could be tracked in session storage or a temporary table
        // Example: Track payment method IDs tried in this session
      } catch (error) {
        console.error(
          "Failed to collect session/account metrics for zero trust:",
          error,
        );
        // Continue without these metrics rather than failing the whole check
      }
    }

    // Calculate store distribution using enriched items
    const storeMap = new Map<
      string,
      {
        storeId: string;
        storeName: string;
        itemCount: number;
        subtotal: number;
      }
    >();

    enrichedItems.forEach((item: PaymentItem) => {
      const storeId = item.storeId ?? "unknown";
      const storeName = item.storeName ?? "Unknown Store";
      const quantity = item.quantity ?? 1;
      const price = item.price ?? 0;

      if (storeMap.has(storeId)) {
        const store = storeMap.get(storeId)!;
        store.itemCount += quantity;
        store.subtotal += price * quantity;
      } else {
        storeMap.set(storeId, {
          storeId,
          storeName,
          itemCount: quantity,
          subtotal: price * quantity,
        });
      }
    });

    const storeDistribution = Array.from(storeMap.values());

    // Calculate total quantity across all items
    const totalQuantity = enrichedItems.reduce(
      (sum, item) => sum + (item.quantity ?? 1),
      0,
    );

    // Prepare comprehensive risk payload
    const riskPayload: RiskPayload = {
      // User information
      userId,
      userEmail,
      userType,

      // Transaction details
      totalAmount: numericAmount,
      currency,
      itemCount: totalQuantity, // Total quantity of all items
      uniqueItemCount: enrichedItems.length, // Number of unique products
      items: enrichedItems.map((item: PaymentItem) => ({
        productId: item.productId ?? item.id ?? "unknown",
        name: item.name ?? "Unknown Product",
        price: item.price ?? 0,
        quantity: item.quantity ?? 1,
        storeId: item.storeId ?? "unknown",
        storeName: item.storeName ?? "Unknown Store",
      })),

      // Order information
      orderId,
      paymentMethodId,
      savePaymentMethod,

      // Request metadata
      userAgent: req.headers.get("user-agent"),
      ipAddress:
        req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
      timestamp: new Date().toISOString(),

      // Store distribution
      uniqueStoreCount: storeDistribution.length,
      storeDistribution,

      // Session & account security factors (NEW)
      sessionTokenAge,
      concurrentSessions,
      failedLoginAttempts,
      accountAge,
      accountRole,

      // Transaction history factors (NEW)
      totalPastTransactions,
      successfulPastTransactions,
      transactionSuccessRate,

      // Recent activity factors (NEW)
      recentTransactionFailures,
      sessionPaymentMethodCount,
    };

    // Calculate risk score
    const riskScore = calculateRiskScore(riskPayload);

    // Log the risk assessment to database and get the inserted ID
    // For multi-store transactions, create a single assessment that can be linked to multiple orders
    let assessmentId: number | null = null;
    try {
      // Check for existing recent assessment (within last 3 minutes) with same user and similar characteristics
      // This prevents duplicate assessments during the checkout flow, especially for multi-store race conditions
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
      const transactionAmountCents = Math.round(riskPayload.totalAmount * 100);

      // For multi-store transactions, check for assessments with similar total amounts
      // (within 10% to account for rounding or small differences in split calculations)
      const amountLowerBound = Math.floor(transactionAmountCents * 0.9);
      const amountUpperBound = Math.ceil(transactionAmountCents * 1.1);

      const existingAssessments = await db
        .select()
        .from(zeroTrustAssessments)
        .where(
          and(
            eq(zeroTrustAssessments.userId, riskPayload.userId ?? ""),
            sql`${zeroTrustAssessments.transactionAmount} >= ${amountLowerBound}`,
            sql`${zeroTrustAssessments.transactionAmount} <= ${amountUpperBound}`,
            eq(zeroTrustAssessments.itemCount, riskPayload.itemCount),
            eq(zeroTrustAssessments.storeCount, riskPayload.uniqueStoreCount),
            sql`${zeroTrustAssessments.createdAt} >= ${threeMinutesAgo}`,
          ),
        )
        .orderBy(desc(zeroTrustAssessments.createdAt))
        .limit(1);

      const existingAssessment = existingAssessments[0];

      // If we found a recent matching assessment
      if (existingAssessment) {
        assessmentId = existingAssessment.id;
        console.log(
          `Reusing existing risk assessment ${assessmentId} for user ${riskPayload.userId}`,
        );

        // If the new request has an orderId but the existing assessment doesn't, update it
        if (riskPayload.orderId && !existingAssessment.orderId) {
          await db
            .update(zeroTrustAssessments)
            .set({ orderId: riskPayload.orderId })
            .where(eq(zeroTrustAssessments.id, assessmentId));

          console.log(
            `Updated assessment ${assessmentId} with orderId ${riskPayload.orderId}`,
          );
        }

        // Ensure store links exist for the reused assessment
        // This handles cases where the assessment was created before store links were implemented
        if (riskPayload.storeDistribution.length > 0 && assessmentId !== null) {
          try {
            // Filter out 'unknown' stores (invalid foreign key)
            const validStores = riskPayload.storeDistribution.filter(
              (store) => store.storeId && store.storeId !== "unknown",
            );

            if (validStores.length > 0) {
              const storeLinks = validStores.map((store) => ({
                riskAssessmentId: assessmentId!, // Non-null assertion is safe here due to check above
                storeId: store.storeId,
                storeOrderId: null as number | null,
                storeSubtotal: Math.round(store.subtotal * 100), // Convert to cents
                storeItemCount: store.itemCount,
              }));

              await db
                .insert(riskAssessmentStoreLinks)
                .values(storeLinks)
                .onConflictDoNothing(); // Skip if links already exist

              console.log(
                `Ensured store links exist for reused risk assessment ${assessmentId}`,
              );
            } else {
              console.warn(
                `No valid stores to link for assessment ${assessmentId}`,
              );
            }
          } catch (storeLinkError) {
            console.error(
              `Failed to ensure store links for assessment ${assessmentId}:`,
              storeLinkError,
            );
            // Don't fail the assessment if store linking fails
          }
        }
      } else {
        // Create new assessment if no recent one exists
        const [insertedAssessment] = await db
          .insert(zeroTrustAssessments)
          .values({
            userId: riskPayload.userId,
            orderId: riskPayload.orderId, // This will be null for multi-store transactions initially
            riskScore: riskScore.score,
            decision: riskScore.decision,
            confidence: Math.round(riskScore.confidence * 100),
            transactionAmount: transactionAmountCents,
            currency: riskPayload.currency,
            itemCount: riskPayload.itemCount,
            storeCount: riskPayload.uniqueStoreCount,
            riskFactors: JSON.stringify(riskScore.factors),
            userAgent: riskPayload.userAgent,
            ipAddress: riskPayload.ipAddress,
            createdAt: new Date(), // Explicit timestamp for consistency
          })
          .returning({ id: zeroTrustAssessments.id });

        assessmentId = insertedAssessment?.id ?? null;
        console.log(
          `Created new risk assessment ${assessmentId} for user ${riskPayload.userId}`,
        );

        // Create store links immediately for all decisions (especially deny)
        // This ensures store owners can view denied assessments
        if (assessmentId !== null && riskPayload.storeDistribution.length > 0) {
          try {
            // Filter out 'unknown' stores (invalid foreign key)
            const validStores = riskPayload.storeDistribution.filter(
              (store) => store.storeId && store.storeId !== "unknown",
            );

            if (validStores.length > 0) {
              const nonNullAssessmentId = assessmentId;
              const storeLinks = validStores.map((store) => ({
                riskAssessmentId: nonNullAssessmentId,
                storeId: store.storeId,
                storeOrderId: null as number | null, // No order created yet (may never be for deny)
                storeSubtotal: Math.round(store.subtotal * 100), // Convert to cents
                storeItemCount: store.itemCount,
              }));

              await db
                .insert(riskAssessmentStoreLinks)
                .values(storeLinks)
                .onConflictDoNothing(); // Handle duplicates gracefully

              console.log(
                `Created ${storeLinks.length} store links for risk assessment ${assessmentId}`,
              );
            } else {
              console.warn(
                `No valid stores to link for new assessment ${assessmentId}`,
              );
            }
          } catch (storeLinkError) {
            console.error(
              `Failed to create store links for assessment ${assessmentId}:`,
              storeLinkError,
            );
            // Don't fail the assessment if store linking fails
          }
        }

        // Generate AI justification in the background (non-blocking)
        // This won't slow down the transaction response
        if (assessmentId) {
          generateJustificationBackground(
            assessmentId,
            riskScore,
            riskPayload,
          ).catch((err) => {
            console.error(
              `Background AI generation failed for assessment ${assessmentId}:`,
              err,
            );
          });
        }
      }
    } catch (dbError) {
      console.error(
        "Failed to log zero trust assessment to database:",
        dbError,
      );
    }

    // Log the risk assessment (in production, send to monitoring service)
    console.log("Zero Trust Risk Assessment:", {
      userId: riskPayload.userId,
      amount: riskPayload.totalAmount,
      totalQuantity: riskPayload.itemCount,
      uniqueItems: riskPayload.uniqueItemCount,
      storeCount: riskPayload.uniqueStoreCount,
      score: riskScore.score,
      decision: riskScore.decision,
      factors: riskScore.factors.map((f) => ({
        factor: f.factor,
        impact: f.impact,
      })),
      itemsSource:
        items.length > 0
          ? "provided"
          : enrichedItems.length > 0
            ? "fetched"
            : "none",
    });

    // Return risk assessment with ID for linking to orders
    return NextResponse.json({
      success: true,
      riskAssessment: {
        id: assessmentId,
        decision: riskScore.decision,
        score: riskScore.score,
        confidence: riskScore.confidence,
        factors: riskScore.factors,
        timestamp: riskPayload.timestamp,
      },
    });
  } catch (error) {
    console.error("Zero Trust Check Error:", error);

    // In case of error, default to WARN for safety
    return NextResponse.json({
      success: true,
      riskAssessment: {
        decision: "warn" as RiskDecision,
        score: 50,
        confidence: 0.1,
        factors: [
          {
            factor: "SYSTEM_ERROR",
            impact: 50,
            description: "Risk assessment system encountered an error",
          },
        ],
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/*
    Calculate comprehensive risk score based on multiple factors
    Enhanced with dynamic scoring for better differentiation:
    - Granular scaling for all factors based on severity
    - Compound risk multipliers for dangerous combinations
    - Logarithmic/exponential curves for better score distribution
    - Decimal precision throughout (only round for display)
    - Dynamic confidence based on factor severity and consistency
*/
export function calculateRiskScore(payload: RiskPayload): RiskScore {
  const factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }> = [];
  let totalScore = 0;
  let compoundMultiplier = 1.0;

  // Factor 1: High transaction amount with exponential scaling
  if (payload.totalAmount > RISK_FACTORS.HIGH_AMOUNT.threshold) {
    const amountRatio =
      payload.totalAmount / RISK_FACTORS.HIGH_AMOUNT.threshold;
    // Exponential curve: gentle rise then accelerates
    const scaleFactor =
      Math.pow(Math.min(amountRatio, 5), 1.3) / Math.pow(5, 1.3);
    const impact = Math.round(
      RISK_FACTORS.HIGH_AMOUNT.max *
        scaleFactor *
        (0.5 + (amountRatio - 1) * 0.15),
    );

    factors.push({
      factor: "HIGH_AMOUNT",
      impact,
      description: `Transaction amount $${(payload.totalAmount / 100).toFixed(2)} exceeds normal threshold`,
    });
    totalScore += impact;
  }

  // Factor 2: Unusual total item count with logarithmic scaling
  // Skip this factor for single item purchases unless there's suspicious activity
  const isSingleItemPurchase =
    payload.uniqueItemCount === 1 && payload.itemCount === 1;
  const hasSuspiciousActivity =
    payload.userAgent &&
    /bot|crawler|spider|scraper|curl|wget|python|postman/i.test(
      payload.userAgent,
    );

  if (
    payload.itemCount > RISK_FACTORS.UNUSUAL_ITEM_COUNT.threshold &&
    !(isSingleItemPurchase && !hasSuspiciousActivity)
  ) {
    const countRatio =
      payload.itemCount / RISK_FACTORS.UNUSUAL_ITEM_COUNT.threshold;
    // Logarithmic with fine granularity
    const scaleFactor = Math.log2(countRatio + 1) / Math.log2(4); // Normalized log scale
    const impact = Math.round(
      Math.min(
        RISK_FACTORS.UNUSUAL_ITEM_COUNT.max * scaleFactor,
        RISK_FACTORS.UNUSUAL_ITEM_COUNT.max,
      ),
    );
    factors.push({
      factor: "UNUSUAL_ITEM_COUNT",
      impact,
      description: `High total quantity (${payload.itemCount}) may indicate bulk purchasing`,
    });
    totalScore += impact;
  }

  // Factor 2b: Extreme item count (30+ items) with compounding
  if (
    payload.itemCount > RISK_FACTORS.EXTREME_ITEM_COUNT.threshold &&
    !(isSingleItemPurchase && !hasSuspiciousActivity)
  ) {
    const extremeRatio =
      payload.itemCount / RISK_FACTORS.EXTREME_ITEM_COUNT.threshold;
    // Progressive scaling with more sensitivity
    const scaleFactor = Math.min(Math.sqrt(extremeRatio) * 0.7 + 0.3, 1.5);
    const impact = Math.round(
      Math.min(
        RISK_FACTORS.EXTREME_ITEM_COUNT.max * scaleFactor,
        RISK_FACTORS.EXTREME_ITEM_COUNT.max * 1.2,
      ),
    );
    factors.push({
      factor: "EXTREME_ITEM_COUNT",
      impact,
      description: `Extremely high quantity (${payload.itemCount}) indicates potential fraud or reselling`,
    });
    totalScore += impact;
    compoundMultiplier += 0.08; // Extreme quantities increase overall risk
  }

  // Factor 3: Bulk purchase of single item with refined logarithmic scaling
  const maxSingleItemQuantity = Math.max(
    ...payload.items.map((item) => item.quantity),
  );
  if (maxSingleItemQuantity > RISK_FACTORS.BULK_SINGLE_ITEM.threshold) {
    const bulkRatio =
      maxSingleItemQuantity / RISK_FACTORS.BULK_SINGLE_ITEM.threshold;
    // Logarithmic curve with variable steepness
    const scaleFactor =
      (Math.log2(bulkRatio + 1) / Math.log2(5)) * (0.6 + bulkRatio * 0.05);
    const impact = Math.round(
      Math.min(
        RISK_FACTORS.BULK_SINGLE_ITEM.max * scaleFactor,
        RISK_FACTORS.BULK_SINGLE_ITEM.max,
      ),
    );
    factors.push({
      factor: "BULK_SINGLE_ITEM",
      impact,
      description: `High quantity (${maxSingleItemQuantity}) of single item suggests bulk purchase`,
    });
    totalScore += impact;
  }

  // Factor 3b: Extreme bulk single item (50+ of one item) with compounding
  if (maxSingleItemQuantity > RISK_FACTORS.EXTREME_BULK_SINGLE.threshold) {
    const extremeBulkRatio =
      maxSingleItemQuantity / RISK_FACTORS.EXTREME_BULK_SINGLE.threshold;
    // Non-linear scaling for extreme cases
    const scaleFactor = Math.min(
      0.8 + extremeBulkRatio * 0.15 + Math.log(extremeBulkRatio + 1) * 0.1,
      1.4,
    );
    const impact = Math.round(
      Math.min(
        RISK_FACTORS.EXTREME_BULK_SINGLE.max * scaleFactor,
        RISK_FACTORS.EXTREME_BULK_SINGLE.max * 1.2,
      ),
    );
    factors.push({
      factor: "EXTREME_BULK_SINGLE",
      impact,
      description: `Extremely high quantity (${maxSingleItemQuantity}) of single item indicates potential reselling or fraud`,
    });
    totalScore += impact;
    compoundMultiplier += 0.1; // Extreme bulk increases overall suspicion
  }

  // Factor 4: Multiple stores with progressive scaling
  if (payload.uniqueStoreCount > RISK_FACTORS.MULTIPLE_STORES.threshold) {
    const storeRatio =
      payload.uniqueStoreCount / RISK_FACTORS.MULTIPLE_STORES.threshold;
    // Progressive increase based on store count
    const scaleFactor =
      0.4 + storeRatio * 0.25 + Math.log(storeRatio + 1) * 0.2;
    const impact = Math.round(
      Math.min(
        RISK_FACTORS.MULTIPLE_STORES.max * scaleFactor,
        RISK_FACTORS.MULTIPLE_STORES.max,
      ),
    );
    factors.push({
      factor: "MULTIPLE_STORES",
      impact,
      description: `Transaction spans ${payload.uniqueStoreCount} different stores`,
    });
    totalScore += impact;
  }

  // Factor 5: Session token age with granular scaling (old sessions may be hijacked)
  if (payload.sessionTokenAge !== undefined) {
    if (payload.sessionTokenAge >= RISK_FACTORS.OLD_SESSION_TOKEN.threshold) {
      // Scale based on how old the session is
      const ageRatio =
        payload.sessionTokenAge / RISK_FACTORS.OLD_SESSION_TOKEN.threshold;
      const scaleFactor = Math.min(0.8 + (ageRatio - 1) * 0.3, 1.3);
      const impact = Math.round(
        RISK_FACTORS.OLD_SESSION_TOKEN.max * scaleFactor,
      );
      factors.push({
        factor: "OLD_SESSION_TOKEN",
        impact,
        description: `Session token is ${Math.round(payload.sessionTokenAge / 3600)} hours old (potential hijack risk)`,
      });
      totalScore += impact;
      compoundMultiplier += 0.05; // Old sessions with other factors are more suspicious
    } else if (
      payload.sessionTokenAge >= RISK_FACTORS.AGED_SESSION_TOKEN.threshold
    ) {
      // Variable impact based on exact age
      const ageRatio =
        (payload.sessionTokenAge - RISK_FACTORS.AGED_SESSION_TOKEN.threshold) /
        (RISK_FACTORS.OLD_SESSION_TOKEN.threshold -
          RISK_FACTORS.AGED_SESSION_TOKEN.threshold);
      const impact = Math.round(
        RISK_FACTORS.AGED_SESSION_TOKEN.max * (0.7 + ageRatio * 0.3),
      );
      factors.push({
        factor: "AGED_SESSION_TOKEN",
        impact,
        description: `Session token is ${Math.round(payload.sessionTokenAge / 3600)} hours old`,
      });
      totalScore += impact;
    }
  }

  // Factor 6: Suspicious user agent patterns with severity levels
  if (payload.userAgent) {
    const highRiskPatterns = [/curl/i, /wget/i, /python-requests/i, /scrapy/i];
    const mediumRiskPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /postman/i,
      /python/i,
    ];

    let severity = 0;
    if (highRiskPatterns.some((pattern) => pattern.test(payload.userAgent!))) {
      severity = 1.2; // High severity
    } else if (
      mediumRiskPatterns.some((pattern) => pattern.test(payload.userAgent!))
    ) {
      severity = 0.8; // Medium severity
    }

    if (severity > 0) {
      const impact = Math.round(
        RISK_FACTORS.SUSPICIOUS_USER_AGENT.max * severity,
      );
      factors.push({
        factor: "SUSPICIOUS_USER_AGENT",
        impact,
        description: "User agent suggests automated/non-browser access",
      });
      totalScore += impact;
      compoundMultiplier += 0.07; // Automation with other factors is very suspicious
    }
  }

  // Factor 7: New payment method with transaction amount consideration
  if (!payload.savePaymentMethod && payload.paymentMethodId) {
    // Higher risk for large amounts with new payment methods
    const amountFactor =
      payload.totalAmount > 50000
        ? 1.15
        : payload.totalAmount > 20000
          ? 1.05
          : 0.95;
    const impact = Math.round(
      RISK_FACTORS.NEW_PAYMENT_METHOD.max * amountFactor,
    );
    factors.push({
      factor: "NEW_PAYMENT_METHOD",
      impact,
      description: "Using new/unsaved payment method",
    });
    totalScore += impact;
  }

  // Factor 8: Concurrent sessions with exponential scaling (multiple active logins)
  if (payload.concurrentSessions !== undefined) {
    if (
      payload.concurrentSessions >= RISK_FACTORS.CONCURRENT_SESSIONS.threshold
    ) {
      // Exponential scaling for many sessions
      const sessionRatio =
        payload.concurrentSessions / RISK_FACTORS.CONCURRENT_SESSIONS.threshold;
      const scaleFactor = Math.min(
        0.85 + sessionRatio * 0.2 + Math.pow(sessionRatio - 1, 1.5) * 0.1,
        1.5,
      );
      const impact = Math.round(
        RISK_FACTORS.CONCURRENT_SESSIONS.max * scaleFactor,
      );
      factors.push({
        factor: "CONCURRENT_SESSIONS",
        impact,
        description: `User has ${payload.concurrentSessions} active sessions (possible account compromise)`,
      });
      totalScore += impact;
      compoundMultiplier += 0.08; // Multiple sessions with other factors suggests compromise
    } else if (
      payload.concurrentSessions >=
      RISK_FACTORS.MODERATE_CONCURRENT_SESSIONS.threshold
    ) {
      // Variable impact based on session count
      const extraSessions =
        payload.concurrentSessions -
        RISK_FACTORS.MODERATE_CONCURRENT_SESSIONS.threshold;
      const scaleFactor = 0.8 + extraSessions * 0.15;
      const impact = Math.round(
        RISK_FACTORS.MODERATE_CONCURRENT_SESSIONS.max * scaleFactor,
      );
      factors.push({
        factor: "MODERATE_CONCURRENT_SESSIONS",
        impact,
        description: `User has ${payload.concurrentSessions} active sessions`,
      });
      totalScore += impact;
    }
  }

  // Factor 9: Failed login attempts with progressive scaling (brute force/credential stuffing)
  if (
    payload.failedLoginAttempts !== undefined &&
    payload.failedLoginAttempts > 0
  ) {
    if (
      payload.failedLoginAttempts >=
      RISK_FACTORS.FAILED_LOGIN_ATTEMPTS.threshold
    ) {
      // Exponential increase for many failed attempts
      const attemptRatio =
        payload.failedLoginAttempts /
        RISK_FACTORS.FAILED_LOGIN_ATTEMPTS.threshold;
      const scaleFactor = Math.min(
        0.9 + Math.pow(attemptRatio, 1.4) * 0.25,
        1.6,
      );
      const impact = Math.round(
        RISK_FACTORS.FAILED_LOGIN_ATTEMPTS.max * scaleFactor,
      );
      factors.push({
        factor: "FAILED_LOGIN_ATTEMPTS",
        impact,
        description: `${payload.failedLoginAttempts} failed login attempts in last 24 hours (credential stuffing risk)`,
      });
      totalScore += impact;
      compoundMultiplier += 0.12; // Failed logins are a major red flag with other factors
    } else if (
      payload.failedLoginAttempts >= RISK_FACTORS.SOME_FAILED_LOGINS.threshold
    ) {
      const attemptRatio =
        (payload.failedLoginAttempts -
          RISK_FACTORS.SOME_FAILED_LOGINS.threshold) /
        (RISK_FACTORS.FAILED_LOGIN_ATTEMPTS.threshold -
          RISK_FACTORS.SOME_FAILED_LOGINS.threshold);
      const scaleFactor = 0.75 + attemptRatio * 0.35;
      const impact = Math.round(
        RISK_FACTORS.SOME_FAILED_LOGINS.max * scaleFactor,
      );
      factors.push({
        factor: "SOME_FAILED_LOGINS",
        impact,
        description: `${payload.failedLoginAttempts} failed login attempts in last 24 hours`,
      });
      totalScore += impact;
    } else if (
      payload.failedLoginAttempts >= RISK_FACTORS.FEW_FAILED_LOGINS.threshold
    ) {
      const attemptCount = payload.failedLoginAttempts;
      const scaleFactor = 0.7 + attemptCount * 0.15;
      const impact = Math.round(
        RISK_FACTORS.FEW_FAILED_LOGINS.max * scaleFactor,
      );
      factors.push({
        factor: "FEW_FAILED_LOGINS",
        impact,
        description: `${payload.failedLoginAttempts} failed login attempt(s) in last 24 hours`,
      });
      totalScore += impact;
    }
  }

  // Factor 10: Account age with inverse exponential scaling (new accounts are higher risk)
  if (payload.accountAge !== undefined) {
    if (payload.accountAge < RISK_FACTORS.NEW_ACCOUNT.threshold) {
      const daysOld = Math.round(payload.accountAge / 86400);
      // Newer accounts are riskier - inverse exponential curve
      const ageRatio = payload.accountAge / RISK_FACTORS.NEW_ACCOUNT.threshold;
      const scaleFactor = 1.4 - Math.pow(ageRatio, 0.7) * 0.5; // Higher impact for very new accounts
      const impact = Math.round(RISK_FACTORS.NEW_ACCOUNT.max * scaleFactor);
      factors.push({
        factor: "NEW_ACCOUNT",
        impact,
        description: `Account is only ${daysOld} day(s) old`,
      });
      totalScore += impact;
    }
  }

  // Factor 11: Account role with variable trust bonuses (vendors/admins are more trusted)
  if (payload.accountRole) {
    if (payload.accountRole === "vendor" || payload.accountRole === "admin") {
      // Slightly more bonus for admins, less for new vendors
      const accountAgeDays = payload.accountAge
        ? payload.accountAge / 86400
        : 0;
      let trustMultiplier = 1.0;

      if (payload.accountRole === "admin") {
        trustMultiplier = 1.3; // Admins get more trust
      } else if (accountAgeDays > 30) {
        trustMultiplier = 1.15; // Established vendors get more trust
      } else if (accountAgeDays > 7) {
        trustMultiplier = 0.9; // Newer vendors get less trust
      } else {
        trustMultiplier = 0.6; // Very new vendors get minimal trust
      }

      const impact = Math.round(
        RISK_FACTORS.TRUSTED_ROLE.bonus * trustMultiplier,
      );
      factors.push({
        factor: "TRUSTED_ROLE",
        impact,
        description: `Account has trusted role: ${payload.accountRole}`,
      });
      totalScore += impact; // This is negative, so it reduces risk
    }
  }

  // Factor 12: Comprehensive transaction history analysis
  // Now applies to ALL users, including first-time buyers
  if (payload.totalPastTransactions !== undefined) {
    const transactionCount = payload.totalPastTransactions;
    const successRate = payload.transactionSuccessRate ?? 0;

    if (transactionCount === 0) {
      // First-time buyer - add moderate risk for no transaction history
      // Less risky than suspicious activity, but still a consideration
      let impact = RISK_FACTORS.FIRST_TIME_BUYER.max;

      // Reduce impact slightly for accounts older than 30 days (legitimate but inactive accounts)
      if (payload.accountAge && payload.accountAge > 2592000) {
        // 30 days in seconds
        impact = Math.round(impact * 0.7);
      }

      factors.push({
        factor: "FIRST_TIME_BUYER",
        impact,
        description: "No previous transaction history (first-time buyer)",
      });
      totalScore += impact;
    } else if (transactionCount >= 1 && transactionCount <= 4) {
      // Limited transaction history (1-4 transactions)
      // More volatile, so less trust but also less concern than first-time
      const historyWeight = transactionCount / 4; // 0.25 to 1.0

      if (successRate >= RISK_FACTORS.LIMITED_HISTORY_GOOD.threshold) {
        // Good start, but limited data
        const scaleFactor = 0.6 + historyWeight * 0.4; // Build trust gradually
        const impact = Math.round(
          RISK_FACTORS.LIMITED_HISTORY_GOOD.bonus * scaleFactor,
        );
        factors.push({
          factor: "LIMITED_HISTORY_GOOD",
          impact,
          description: `Limited but positive history: ${successRate.toFixed(1)}% success rate over ${transactionCount} transaction(s)`,
        });
        totalScore += impact; // Negative, reduces risk slightly
      } else if (successRate < RISK_FACTORS.LIMITED_HISTORY_POOR.threshold) {
        // Poor success with limited attempts - red flag
        const failureWeight =
          (RISK_FACTORS.LIMITED_HISTORY_POOR.threshold - successRate) / 50;
        const scaleFactor = 0.8 + failureWeight * 0.4 + historyWeight * 0.15;
        const impact = Math.round(
          RISK_FACTORS.LIMITED_HISTORY_POOR.max * scaleFactor,
        );
        factors.push({
          factor: "LIMITED_HISTORY_POOR",
          impact,
          description: `Poor limited history: only ${successRate.toFixed(1)}% success rate over ${transactionCount} transaction(s)`,
        });
        totalScore += impact;
        compoundMultiplier += 0.07; // Poor early history is concerning
      } else if (
        successRate < RISK_FACTORS.LIMITED_HISTORY_MODERATE.threshold
      ) {
        // Moderate success with limited data
        const rangePosition =
          (RISK_FACTORS.LIMITED_HISTORY_MODERATE.threshold - successRate) / 20;
        const scaleFactor = (0.65 + rangePosition * 0.35) * historyWeight;
        const impact = Math.round(
          RISK_FACTORS.LIMITED_HISTORY_MODERATE.max * scaleFactor,
        );
        factors.push({
          factor: "LIMITED_HISTORY_MODERATE",
          impact,
          description: `Mixed limited history: ${successRate.toFixed(1)}% success rate over ${transactionCount} transaction(s)`,
        });
        totalScore += impact;
      }
    } else if (transactionCount >= 5) {
      // Established transaction history (5+ transactions)
      // More reliable pattern, stronger impact
      const historyConfidence = Math.min(transactionCount / 15, 1.3); // Cap at 15 transactions for established

      // Check for excellent history (10+ transactions with 95%+ success)
      if (
        transactionCount >= 10 &&
        successRate >= RISK_FACTORS.EXCELLENT_HISTORY.threshold
      ) {
        const successExcess =
          (successRate - RISK_FACTORS.EXCELLENT_HISTORY.threshold) / 5;
        const scaleFactor =
          (1.0 + successExcess * 0.2) * Math.min(transactionCount / 20, 1.5);
        const impact = Math.round(
          RISK_FACTORS.EXCELLENT_HISTORY.bonus * scaleFactor,
        );
        factors.push({
          factor: "EXCELLENT_HISTORY",
          impact,
          description: `Excellent transaction history: ${successRate.toFixed(1)}% success rate over ${transactionCount} transactions (highly trusted)`,
        });
        totalScore += impact; // Significant negative, major risk reduction
      } else if (
        successRate >= RISK_FACTORS.GOOD_TRANSACTION_HISTORY.threshold
      ) {
        // Good success rate
        const successExcess =
          (successRate - RISK_FACTORS.GOOD_TRANSACTION_HISTORY.threshold) / 10;
        const scaleFactor = (1.0 + successExcess * 0.15) * historyConfidence;
        const impact = Math.round(
          RISK_FACTORS.GOOD_TRANSACTION_HISTORY.bonus * scaleFactor,
        );
        factors.push({
          factor: "GOOD_TRANSACTION_HISTORY",
          impact,
          description: `Good transaction history: ${successRate.toFixed(1)}% success rate over ${transactionCount} transactions`,
        });
        totalScore += impact; // Negative, reduces risk
      } else if (
        successRate < RISK_FACTORS.POOR_TRANSACTION_HISTORY.threshold
      ) {
        // Poor success rate - major concern
        const failureRatio =
          RISK_FACTORS.POOR_TRANSACTION_HISTORY.threshold /
          Math.max(successRate, 10);
        const scaleFactor =
          Math.min(0.85 + (failureRatio - 1) * 0.45, 1.6) * historyConfidence;
        const impact = Math.round(
          RISK_FACTORS.POOR_TRANSACTION_HISTORY.max * scaleFactor,
        );
        factors.push({
          factor: "POOR_TRANSACTION_HISTORY",
          impact,
          description: `Poor transaction history: only ${successRate.toFixed(1)}% success rate over ${transactionCount} transactions`,
        });
        totalScore += impact;
        compoundMultiplier += 0.09; // Poor established history is very concerning
      } else if (
        successRate < RISK_FACTORS.MODERATE_TRANSACTION_HISTORY.threshold
      ) {
        // Moderate success rate
        const rangePosition =
          (RISK_FACTORS.MODERATE_TRANSACTION_HISTORY.threshold - successRate) /
          (RISK_FACTORS.MODERATE_TRANSACTION_HISTORY.threshold -
            RISK_FACTORS.POOR_TRANSACTION_HISTORY.threshold);
        const scaleFactor = (0.75 + rangePosition * 0.4) * historyConfidence;
        const impact = Math.round(
          RISK_FACTORS.MODERATE_TRANSACTION_HISTORY.max * scaleFactor,
        );
        factors.push({
          factor: "MODERATE_TRANSACTION_HISTORY",
          impact,
          description: `Moderate transaction history: ${successRate.toFixed(1)}% success rate over ${transactionCount} transactions`,
        });
        totalScore += impact;
      }
    }
  } else {
    // No transaction data available at all (shouldn't happen often, but handle it)
    // Treat as first-time buyer with slightly higher risk
    const impact = Math.round(RISK_FACTORS.FIRST_TIME_BUYER.max * 1.1);
    factors.push({
      factor: "FIRST_TIME_BUYER",
      impact,
      description: "No transaction history available",
    });
    totalScore += impact;
  }

  // Factor 13: Recent transaction failures with exponential scaling (card testing)
  if (
    payload.recentTransactionFailures !== undefined &&
    payload.recentTransactionFailures > 0
  ) {
    if (
      payload.recentTransactionFailures >=
      RISK_FACTORS.RECENT_TRANSACTION_FAILURES.threshold
    ) {
      // Exponential increase for many failures (strong indicator of card testing)
      const failureRatio =
        payload.recentTransactionFailures /
        RISK_FACTORS.RECENT_TRANSACTION_FAILURES.threshold;
      const scaleFactor = Math.min(
        0.95 + Math.pow(failureRatio, 1.5) * 0.3,
        1.7,
      );
      const impact = Math.round(
        RISK_FACTORS.RECENT_TRANSACTION_FAILURES.max * scaleFactor,
      );
      factors.push({
        factor: "RECENT_TRANSACTION_FAILURES",
        impact,
        description: `${payload.recentTransactionFailures} failed transactions in last hour (card testing suspected)`,
      });
      totalScore += impact;
      compoundMultiplier += 0.15; // Recent failures are a critical indicator
    } else if (
      payload.recentTransactionFailures >=
      RISK_FACTORS.MULTIPLE_TRANSACTION_FAILURES.threshold
    ) {
      const failureRatio =
        (payload.recentTransactionFailures -
          RISK_FACTORS.MULTIPLE_TRANSACTION_FAILURES.threshold) /
        (RISK_FACTORS.RECENT_TRANSACTION_FAILURES.threshold -
          RISK_FACTORS.MULTIPLE_TRANSACTION_FAILURES.threshold);
      const scaleFactor = 0.8 + failureRatio * 0.35;
      const impact = Math.round(
        RISK_FACTORS.MULTIPLE_TRANSACTION_FAILURES.max * scaleFactor,
      );
      factors.push({
        factor: "MULTIPLE_TRANSACTION_FAILURES",
        impact,
        description: `${payload.recentTransactionFailures} failed transactions in last hour`,
      });
      totalScore += impact;
      compoundMultiplier += 0.05;
    } else if (
      payload.recentTransactionFailures >=
      RISK_FACTORS.SINGLE_TRANSACTION_FAILURE.threshold
    ) {
      const failureCount = payload.recentTransactionFailures;
      const scaleFactor = 0.75 + failureCount * 0.12;
      const impact = Math.round(
        RISK_FACTORS.SINGLE_TRANSACTION_FAILURE.max * scaleFactor,
      );
      factors.push({
        factor: "SINGLE_TRANSACTION_FAILURE",
        impact,
        description: `${payload.recentTransactionFailures} failed transaction(s) in last hour`,
      });
      totalScore += impact;
    }
  }

  // Factor 14: Multiple payment methods with exponential scaling (testing stolen cards)
  if (
    payload.sessionPaymentMethodCount !== undefined &&
    payload.sessionPaymentMethodCount > 1
  ) {
    if (
      payload.sessionPaymentMethodCount >=
      RISK_FACTORS.MULTIPLE_PAYMENT_METHODS.threshold
    ) {
      // Strong indicator of card testing - exponential scaling
      const methodRatio =
        payload.sessionPaymentMethodCount /
        RISK_FACTORS.MULTIPLE_PAYMENT_METHODS.threshold;
      const scaleFactor = Math.min(
        1.0 + Math.pow(methodRatio - 1, 1.6) * 0.4,
        1.8,
      );
      const impact = Math.round(
        RISK_FACTORS.MULTIPLE_PAYMENT_METHODS.max * scaleFactor,
      );
      factors.push({
        factor: "MULTIPLE_PAYMENT_METHODS",
        impact,
        description: `Tried ${payload.sessionPaymentMethodCount} different payment methods in this session (card testing suspected)`,
      });
      totalScore += impact;
      compoundMultiplier += 0.12; // Critical indicator of fraud
    } else if (
      payload.sessionPaymentMethodCount >=
      RISK_FACTORS.TWO_PAYMENT_METHODS.threshold
    ) {
      // Variable impact based on other factors
      const hasOtherRedFlags = factors.length > 2;
      const scaleFactor = hasOtherRedFlags ? 1.15 : 0.85;
      const impact = Math.round(
        RISK_FACTORS.TWO_PAYMENT_METHODS.max * scaleFactor,
      );
      factors.push({
        factor: "TWO_PAYMENT_METHODS",
        impact,
        description: `Tried ${payload.sessionPaymentMethodCount} different payment methods in this session`,
      });
      totalScore += impact;
    }
  }

  // Apply compound risk multiplier for dangerous combinations
  // Only apply if there are multiple risk factors
  if (factors.length >= 2 && compoundMultiplier > 1.0) {
    totalScore = totalScore * compoundMultiplier;
  }

  // Add entropy based on transaction characteristics to prevent identical scores
  // This creates subtle variations while maintaining consistency for identical inputs
  const entropyFactor = Math.round(
    (payload.totalAmount % 100) / 100 +
      (payload.itemCount % 10) / 20 +
      (payload.uniqueStoreCount % 5) / 10,
  );
  totalScore += entropyFactor;

  // Normalize score to 0-100 range and ensure it's an integer
  const normalizedScore = Math.min(Math.round(totalScore), 100);

  // Determine decision based on thresholds
  let decision: RiskDecision;
  if (normalizedScore <= RISK_THRESHOLDS.ALLOW_MAX) {
    decision = "allow";
  } else if (normalizedScore <= RISK_THRESHOLDS.WARN_MAX) {
    decision = "warn";
  } else {
    decision = "deny";
  }

  // Dynamic confidence calculation based on:
  // 1. Number of risk factors (more factors = higher confidence)
  // 2. Factor severity (higher impacts = higher confidence)
  // 3. Factor consistency (similar impacts = higher confidence)
  const avgFactorImpact =
    factors.length > 0
      ? factors.reduce((sum, f) => sum + Math.abs(f.impact), 0) / factors.length
      : 0;

  const impactVariance =
    factors.length > 1
      ? factors.reduce(
          (sum, f) => sum + Math.pow(Math.abs(f.impact) - avgFactorImpact, 2),
          0,
        ) / factors.length
      : 0;

  const factorCountScore = Math.min(factors.length * 0.12, 0.5); // More factors = more confidence
  const severityScore = Math.min(avgFactorImpact / 50, 0.3); // Higher average impact = more confidence
  const consistencyScore = impactVariance < 100 ? 0.15 : 0.05; // Consistent impacts = more confidence
  const baseConfidence = 0.25;

  const confidence = Math.min(
    baseConfidence + factorCountScore + severityScore + consistencyScore,
    0.99,
  );

  return {
    score: normalizedScore,
    factors,
    decision,
    confidence: Math.round(confidence * 100) / 100,
  };
}

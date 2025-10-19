import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { orderItems, products, cartItems, carts, zeroTrustAssessments, users, stores, orders } from "@/server/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
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
    ALLOW_MAX: 20,    // 0-20: Allow (lower threshold)
    WARN_MAX: 50,     // 21-50: Warn (lower threshold)
    DENY_MIN: 51      // 51-100: Deny (much lower threshold)
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
    POOR_TRANSACTION_HISTORY: { max: 25, threshold: 50 }, // <50% success rate
    MODERATE_TRANSACTION_HISTORY: { max: 10, threshold: 70 }, // 50-70% success rate
    GOOD_TRANSACTION_HISTORY: { bonus: -15, threshold: 90 }, // 90%+ success rate (reduces risk)
    
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
export async function zeroTrustCheck(
    req: NextRequest, 
    body: PaymentRequestBody, 
    session?: { user?: { id?: string; email?: string | null; userType?: string } },
    checkoutSessionData?: any // Complete checkout session data for multi-store analysis
): Promise<NextResponse> {
    try {
        // Extract and validate basic payment data
        const { amount, currency = 'aud', items = [], orderId, paymentMethodId, savePaymentMethod = false } = body;
        const numericAmount = Number(amount);

        if (isNaN(numericAmount) || numericAmount <= 0) {
            return NextResponse.json({error: "Invalid payment amount"}, {status: 400});
        }

        // Extract user information from session parameter or body
        const userId = session?.user?.id ?? body.auth?.user?.id ?? null;
        const userEmail = session?.user?.email ?? body.auth?.user?.email ?? null;
        const userType = session?.user?.userType ?? body.auth?.user?.userType ?? null;

        // Prioritize complete checkout session data for multi-store analysis
        let enrichedItems: PaymentItem[] = items;
        
        // Use complete checkout session data if available (for multi-store analysis)
        if (checkoutSessionData?.items && Array.isArray(checkoutSessionData.items)) {
            console.log(`Zero Trust: Using complete checkout session data with ${checkoutSessionData.items.length} items`);
            
            // Enrich checkout session data with product and store information
            try {
                const productIds = checkoutSessionData.items
                    .map((item: any) => item.productId)
                    .filter((id: any) => id != null);
                
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
                    const productMap = new Map(productData.map(p => [p.id, p]));
                    
                    enrichedItems = checkoutSessionData.items.map((item: any) => {
                        const productInfo = productMap.get(item.productId);
                        return {
                            id: item.productId?.toString() ?? 'unknown',
                            productId: item.productId?.toString() ?? 'unknown',
                            name: productInfo?.name ?? 'Unknown Product',
                            price: item.price ?? 0,
                            quantity: item.quantity ?? 1,
                            storeId: productInfo?.storeId?.toString() ?? 'unknown',
                            storeName: productInfo?.storeName ?? 'Unknown Store'
                        };
                    });
                    
                    console.log(`Zero Trust: Enriched ${enrichedItems.length} items with product and store data`);
                } else {
                    // Fallback if no valid product IDs
                    enrichedItems = checkoutSessionData.items.map((item: any) => ({
                        id: item.productId?.toString() ?? 'unknown',
                        productId: item.productId?.toString() ?? 'unknown',
                        name: 'Unknown Product',
                        price: item.price ?? 0,
                        quantity: item.quantity ?? 1,
                        storeId: 'unknown',
                        storeName: 'Unknown Store'
                    }));
                }
            } catch (error) {
                console.error('Failed to enrich checkout session data:', error);
                // Fallback to basic mapping
                enrichedItems = checkoutSessionData.items.map((item: any) => ({
                    id: item.productId?.toString() ?? 'unknown',
                    productId: item.productId?.toString() ?? 'unknown',
                    name: 'Unknown Product',
                    price: item.price ?? 0,
                    quantity: item.quantity ?? 1,
                    storeId: 'unknown',
                    storeName: 'Unknown Store'
                }));
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

                enrichedItems = orderData.map(item => ({
                    id: item.productId.toString(),
                    productId: item.productId.toString(),
                    name: item.name,
                    price: item.price / 100, // Convert from cents
                    quantity: item.quantity,
                    storeId: item.storeId?.toString() ?? 'unknown',
                    storeName: 'Unknown Store' // We'd need to join stores table for this
                }));
                
                console.log(`Zero Trust: Fetched ${enrichedItems.length} items from order ${orderId}`);
            } catch (error) {
                console.error('Failed to fetch order items for zero trust check:', error);
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

                enrichedItems = cartData.map(item => ({
                    id: item.productId.toString(),
                    productId: item.productId.toString(),
                    name: item.name,
                    price: (item.price ?? 0) / 100, // Convert from cents
                    quantity: item.quantity,
                    storeId: item.storeId?.toString() ?? 'unknown',
                    storeName: 'Unknown Store'
                }));
                
                console.log(`Zero Trust: Fetched ${enrichedItems.length} items from user cart`);
            } catch (error) {
                console.error('Failed to fetch cart items for zero trust check:', error);
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
                    accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / 1000);
                }

                // Determine account role (check if user owns a store = vendor)
                const [store] = await db
                    .select()
                    .from(stores)
                    .where(eq(stores.ownerId, userId))
                    .limit(1);
                
                accountRole = store ? 'vendor' : 'customer';

                // Calculate transaction success rate
                const orderStats = await db
                    .select({
                        total: sql<number>`count(*)`,
                        successful: sql<number>`count(case when ${orders.status} = 'completed' then 1 end)`,
                    })
                    .from(orders)
                    .where(eq(orders.userId, userId));

                if (orderStats.length > 0 && orderStats[0].total > 0) {
                    totalPastTransactions = orderStats[0].total;
                    successfulPastTransactions = orderStats[0].successful;
                    transactionSuccessRate = (successfulPastTransactions / totalPastTransactions) * 100;
                }

                // Count recent failed transactions (last hour)
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                const failedTransactions = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(orders)
                    .where(
                        and(
                            eq(orders.userId, userId),
                            eq(orders.status, 'failed'),
                            sql`${orders.createdAt} >= ${oneHourAgo}`
                        )
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
                console.error('Failed to collect session/account metrics for zero trust:', error);
                // Continue without these metrics rather than failing the whole check
            }
        }
        
        // Calculate store distribution using enriched items
        const storeMap = new Map<string, {
            storeId: string;
            storeName: string;
            itemCount: number;
            subtotal: number;
        }>();
        
        enrichedItems.forEach((item: PaymentItem) => {
            const storeId = item.storeId ?? 'unknown';
            const storeName = item.storeName ?? 'Unknown Store';
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
                    subtotal: price * quantity
                });
            }
        });

        const storeDistribution = Array.from(storeMap.values());
        
        // Calculate total quantity across all items
        const totalQuantity = enrichedItems.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
        
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
                productId: item.productId ?? item.id ?? 'unknown',
                name: item.name ?? 'Unknown Product',
                price: item.price ?? 0,
                quantity: item.quantity ?? 1,
                storeId: item.storeId ?? 'unknown',
                storeName: item.storeName ?? 'Unknown Store'
            })),
            
            // Order information
            orderId,
            paymentMethodId,
            savePaymentMethod,
            
            // Request metadata
            userAgent: req.headers.get("user-agent"),
            ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
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
        let assessmentId: number | null = null;
        try {
            const [insertedAssessment] = await db.insert(zeroTrustAssessments).values({
                userId: riskPayload.userId,
                orderId: riskPayload.orderId,
                riskScore: riskScore.score,
                decision: riskScore.decision,
                confidence: Math.round(riskScore.confidence * 100),
                transactionAmount: Math.round(riskPayload.totalAmount * 100), // Convert dollars to cents
                currency: riskPayload.currency,
                itemCount: riskPayload.itemCount,
                storeCount: riskPayload.uniqueStoreCount,
                riskFactors: JSON.stringify(riskScore.factors),
                userAgent: riskPayload.userAgent,
                ipAddress: riskPayload.ipAddress,
            }).returning({ id: zeroTrustAssessments.id });
            
            assessmentId = insertedAssessment?.id ?? null;
            
            // Generate AI justification in the background (non-blocking)
            // This won't slow down the transaction response
            if (assessmentId) {
                generateJustificationBackground(assessmentId, riskScore, riskPayload).catch(err => {
                    console.error(`Background AI generation failed for assessment ${assessmentId}:`, err);
                });
            }
        } catch (dbError) {
            console.error('Failed to log zero trust assessment to database:', dbError);
        }
        
        // Log the risk assessment (in production, send to monitoring service)
        console.log('Zero Trust Risk Assessment:', {
            userId: riskPayload.userId,
            amount: riskPayload.totalAmount,
            totalQuantity: riskPayload.itemCount,
            uniqueItems: riskPayload.uniqueItemCount,
            storeCount: riskPayload.uniqueStoreCount,
            score: riskScore.score,
            decision: riskScore.decision,
            factors: riskScore.factors.map(f => ({ factor: f.factor, impact: f.impact })),
            itemsSource: items.length > 0 ? 'provided' : enrichedItems.length > 0 ? 'fetched' : 'none'
        });

        // Return risk assessment
        return NextResponse.json({
            success: true,
            riskAssessment: {
                decision: riskScore.decision,
                score: riskScore.score,
                confidence: riskScore.confidence,
                factors: riskScore.factors,
                timestamp: riskPayload.timestamp
            }
        });

    } catch (error) {
        console.error('Zero Trust Check Error:', error);
        
        // In case of error, default to WARN for safety
        return NextResponse.json({
            success: true,
            riskAssessment: {
                decision: "warn" as RiskDecision,
                score: 50,
                confidence: 0.1,
                factors: [{
                    factor: "SYSTEM_ERROR",
                    impact: 50,
                    description: "Risk assessment system encountered an error"
                }],
                timestamp: new Date().toISOString()
            }
        });
    }
}

/*
    Calculate comprehensive risk score based on multiple factors
    Updated with more aggressive scoring for high-volume transactions
    - Logarithmic scaling for some factors to handle extreme values
    - Lower thresholds and higher impact scores
    - Multiple tiers (unusual vs extreme) for better granularity
*/
function calculateRiskScore(payload: RiskPayload): RiskScore {
    const factors: Array<{ factor: string; impact: number; description: string }> = [];
    let totalScore = 0;

    // Factor 1: High transaction amount
    if (payload.totalAmount > RISK_FACTORS.HIGH_AMOUNT.threshold) {
        const amountRatio = Math.min(payload.totalAmount / RISK_FACTORS.HIGH_AMOUNT.threshold, 3);
        const impact = Math.min(RISK_FACTORS.HIGH_AMOUNT.max * (amountRatio - 1) / 2, RISK_FACTORS.HIGH_AMOUNT.max);
        factors.push({
            factor: "HIGH_AMOUNT",
            impact: Math.round(impact),
            description: `Transaction amount $${(payload.totalAmount / 100).toFixed(2)} exceeds normal threshold`
        });
        totalScore += impact;
    }

    // Factor 2: Unusual total item count
    // Skip this factor for single item purchases unless there's suspicious activity
    const isSingleItemPurchase = payload.uniqueItemCount === 1 && payload.itemCount === 1;
    const hasSuspiciousActivity = payload.userAgent && 
        /bot|crawler|spider|scraper|curl|wget|python|postman/i.test(payload.userAgent);
    
    if (payload.itemCount > RISK_FACTORS.UNUSUAL_ITEM_COUNT.threshold && 
        !(isSingleItemPurchase && !hasSuspiciousActivity)) {
        const countRatio = payload.itemCount / RISK_FACTORS.UNUSUAL_ITEM_COUNT.threshold;
        const impact = Math.min(RISK_FACTORS.UNUSUAL_ITEM_COUNT.max * Math.log2(countRatio), RISK_FACTORS.UNUSUAL_ITEM_COUNT.max);
        factors.push({
            factor: "UNUSUAL_ITEM_COUNT",
            impact: Math.round(impact),
            description: `High total quantity (${payload.itemCount}) may indicate bulk purchasing`
        });
        totalScore += impact;
    }

    // Factor 2b: Extreme item count (30+ items)
    if (payload.itemCount > RISK_FACTORS.EXTREME_ITEM_COUNT.threshold && 
        !(isSingleItemPurchase && !hasSuspiciousActivity)) {
        const extremeRatio = payload.itemCount / RISK_FACTORS.EXTREME_ITEM_COUNT.threshold;
        const impact = Math.min(RISK_FACTORS.EXTREME_ITEM_COUNT.max * extremeRatio, RISK_FACTORS.EXTREME_ITEM_COUNT.max);
        factors.push({
            factor: "EXTREME_ITEM_COUNT",
            impact: Math.round(impact),
            description: `Extremely high quantity (${payload.itemCount}) indicates potential fraud or reselling`
        });
        totalScore += impact;
    }

    // Factor 3: Bulk purchase of single item
    const maxSingleItemQuantity = Math.max(...payload.items.map(item => item.quantity));
    if (maxSingleItemQuantity > RISK_FACTORS.BULK_SINGLE_ITEM.threshold) {
        const bulkRatio = maxSingleItemQuantity / RISK_FACTORS.BULK_SINGLE_ITEM.threshold;
        const impact = Math.min(RISK_FACTORS.BULK_SINGLE_ITEM.max * Math.log2(bulkRatio), RISK_FACTORS.BULK_SINGLE_ITEM.max);
        factors.push({
            factor: "BULK_SINGLE_ITEM",
            impact: Math.round(impact),
            description: `High quantity (${maxSingleItemQuantity}) of single item suggests bulk purchase`
        });
        totalScore += impact;
    }

    // Factor 3b: Extreme bulk single item (50+ of one item)
    if (maxSingleItemQuantity > RISK_FACTORS.EXTREME_BULK_SINGLE.threshold) {
        const extremeBulkRatio = maxSingleItemQuantity / RISK_FACTORS.EXTREME_BULK_SINGLE.threshold;
        const impact = Math.min(RISK_FACTORS.EXTREME_BULK_SINGLE.max * extremeBulkRatio, RISK_FACTORS.EXTREME_BULK_SINGLE.max);
        factors.push({
            factor: "EXTREME_BULK_SINGLE",
            impact: Math.round(impact),
            description: `Extremely high quantity (${maxSingleItemQuantity}) of single item indicates potential reselling or fraud`
        });
        totalScore += impact;
    }

    // Factor 4: Multiple stores (higher risk in marketplace)
    if (payload.uniqueStoreCount > RISK_FACTORS.MULTIPLE_STORES.threshold) {
        const storeRatio = payload.uniqueStoreCount / RISK_FACTORS.MULTIPLE_STORES.threshold;
        const impact = Math.min(RISK_FACTORS.MULTIPLE_STORES.max * (storeRatio - 1), RISK_FACTORS.MULTIPLE_STORES.max);
        factors.push({
            factor: "MULTIPLE_STORES",
            impact: Math.round(impact),
            description: `Transaction spans ${payload.uniqueStoreCount} different stores`
        });
        totalScore += impact;
    }

    // Factor 5: Session token age (old sessions may be hijacked)
    if (payload.sessionTokenAge !== undefined) {
        if (payload.sessionTokenAge >= RISK_FACTORS.OLD_SESSION_TOKEN.threshold) {
            const impact = RISK_FACTORS.OLD_SESSION_TOKEN.max;
            factors.push({
                factor: "OLD_SESSION_TOKEN",
                impact,
                description: `Session token is ${Math.round(payload.sessionTokenAge / 3600)} hours old (potential hijack risk)`
            });
            totalScore += impact;
        } else if (payload.sessionTokenAge >= RISK_FACTORS.AGED_SESSION_TOKEN.threshold) {
            const impact = RISK_FACTORS.AGED_SESSION_TOKEN.max;
        factors.push({
                factor: "AGED_SESSION_TOKEN",
                impact,
                description: `Session token is ${Math.round(payload.sessionTokenAge / 3600)} hours old`
            });
            totalScore += impact;
        }
    }

    // Factor 6: Suspicious user agent patterns
    if (payload.userAgent) {
        const suspiciousPatterns = [
            /bot/i, /crawler/i, /spider/i, /scraper/i,
            /curl/i, /wget/i, /python/i, /postman/i
        ];
        
        if (suspiciousPatterns.some(pattern => pattern.test(payload.userAgent!))) {
            factors.push({
                factor: "SUSPICIOUS_USER_AGENT",
                impact: RISK_FACTORS.SUSPICIOUS_USER_AGENT.max,
                description: "User agent suggests automated/non-browser access"
            });
            totalScore += RISK_FACTORS.SUSPICIOUS_USER_AGENT.max;
        }
    }

    // Factor 7: New payment method (higher risk)
    if (!payload.savePaymentMethod && payload.paymentMethodId) {
        factors.push({
            factor: "NEW_PAYMENT_METHOD",
            impact: RISK_FACTORS.NEW_PAYMENT_METHOD.max,
            description: "Using new/unsaved payment method"
        });
        totalScore += RISK_FACTORS.NEW_PAYMENT_METHOD.max;
    }

    // Factor 8: Concurrent sessions (multiple active logins)
    if (payload.concurrentSessions !== undefined) {
        if (payload.concurrentSessions >= RISK_FACTORS.CONCURRENT_SESSIONS.threshold) {
            const impact = RISK_FACTORS.CONCURRENT_SESSIONS.max;
            factors.push({
                factor: "CONCURRENT_SESSIONS",
                impact,
                description: `User has ${payload.concurrentSessions} active sessions (possible account compromise)`
            });
            totalScore += impact;
        } else if (payload.concurrentSessions >= RISK_FACTORS.MODERATE_CONCURRENT_SESSIONS.threshold) {
            const impact = RISK_FACTORS.MODERATE_CONCURRENT_SESSIONS.max;
            factors.push({
                factor: "MODERATE_CONCURRENT_SESSIONS",
                impact,
                description: `User has ${payload.concurrentSessions} active sessions`
            });
            totalScore += impact;
        }
    }

    // Factor 9: Failed login attempts (brute force/credential stuffing)
    if (payload.failedLoginAttempts !== undefined && payload.failedLoginAttempts > 0) {
        if (payload.failedLoginAttempts >= RISK_FACTORS.FAILED_LOGIN_ATTEMPTS.threshold) {
            const impact = RISK_FACTORS.FAILED_LOGIN_ATTEMPTS.max;
            factors.push({
                factor: "FAILED_LOGIN_ATTEMPTS",
                impact,
                description: `${payload.failedLoginAttempts} failed login attempts in last 24 hours (credential stuffing risk)`
            });
            totalScore += impact;
        } else if (payload.failedLoginAttempts >= RISK_FACTORS.SOME_FAILED_LOGINS.threshold) {
            const impact = RISK_FACTORS.SOME_FAILED_LOGINS.max;
            factors.push({
                factor: "SOME_FAILED_LOGINS",
                impact,
                description: `${payload.failedLoginAttempts} failed login attempts in last 24 hours`
            });
            totalScore += impact;
        } else if (payload.failedLoginAttempts >= RISK_FACTORS.FEW_FAILED_LOGINS.threshold) {
            const impact = RISK_FACTORS.FEW_FAILED_LOGINS.max;
            factors.push({
                factor: "FEW_FAILED_LOGINS",
                impact,
                description: `${payload.failedLoginAttempts} failed login attempt(s) in last 24 hours`
            });
            totalScore += impact;
        }
    }

    // Factor 10: Account age (new accounts are higher risk)
    if (payload.accountAge !== undefined) {
        if (payload.accountAge < RISK_FACTORS.NEW_ACCOUNT.threshold) {
            const impact = RISK_FACTORS.NEW_ACCOUNT.max;
            const daysOld = Math.round(payload.accountAge / 86400);
            factors.push({
                factor: "NEW_ACCOUNT",
                impact,
                description: `Account is only ${daysOld} day(s) old`
            });
            totalScore += impact;
        }
    }

    // Factor 11: Account role (vendors/admins are more trusted)
    if (payload.accountRole) {
        if (payload.accountRole === 'vendor' || payload.accountRole === 'admin') {
            const impact = RISK_FACTORS.TRUSTED_ROLE.bonus;
            factors.push({
                factor: "TRUSTED_ROLE",
                impact,
                description: `Account has trusted role: ${payload.accountRole}`
            });
            totalScore += impact; // This is negative, so it reduces risk
        }
    }

    // Factor 12: Transaction success rate (trust evolution)
    // Only apply payment history factors if account is not new and has sufficient transaction history
    if (payload.transactionSuccessRate !== undefined && 
        payload.totalPastTransactions !== undefined && 
        payload.totalPastTransactions >= 5 && // Require at least 5 transactions for history analysis
        payload.accountAge !== undefined && 
        payload.accountAge >= RISK_FACTORS.NEW_ACCOUNT.threshold) { // Account must be at least 7 days old
        
        if (payload.transactionSuccessRate >= RISK_FACTORS.GOOD_TRANSACTION_HISTORY.threshold) {
            const impact = RISK_FACTORS.GOOD_TRANSACTION_HISTORY.bonus;
            factors.push({
                factor: "GOOD_TRANSACTION_HISTORY",
                impact,
                description: `Excellent transaction history: ${payload.transactionSuccessRate.toFixed(1)}% success rate over ${payload.totalPastTransactions} transactions`
            });
            totalScore += impact; // This is negative, so it reduces risk
        } else if (payload.transactionSuccessRate < RISK_FACTORS.POOR_TRANSACTION_HISTORY.threshold) {
            const impact = RISK_FACTORS.POOR_TRANSACTION_HISTORY.max;
            factors.push({
                factor: "POOR_TRANSACTION_HISTORY",
                impact,
                description: `Poor transaction history: only ${payload.transactionSuccessRate.toFixed(1)}% success rate over ${payload.totalPastTransactions} transactions`
            });
            totalScore += impact;
        } else if (payload.transactionSuccessRate < RISK_FACTORS.MODERATE_TRANSACTION_HISTORY.threshold) {
            const impact = RISK_FACTORS.MODERATE_TRANSACTION_HISTORY.max;
            factors.push({
                factor: "MODERATE_TRANSACTION_HISTORY",
                impact,
                description: `Moderate transaction history: ${payload.transactionSuccessRate.toFixed(1)}% success rate over ${payload.totalPastTransactions} transactions`
            });
            totalScore += impact;
        }
    }

    // Factor 13: Recent transaction failures (card testing)
    if (payload.recentTransactionFailures !== undefined && payload.recentTransactionFailures > 0) {
        if (payload.recentTransactionFailures >= RISK_FACTORS.RECENT_TRANSACTION_FAILURES.threshold) {
            const impact = RISK_FACTORS.RECENT_TRANSACTION_FAILURES.max;
            factors.push({
                factor: "RECENT_TRANSACTION_FAILURES",
                impact,
                description: `${payload.recentTransactionFailures} failed transactions in last hour (card testing suspected)`
            });
            totalScore += impact;
        } else if (payload.recentTransactionFailures >= RISK_FACTORS.MULTIPLE_TRANSACTION_FAILURES.threshold) {
            const impact = RISK_FACTORS.MULTIPLE_TRANSACTION_FAILURES.max;
            factors.push({
                factor: "MULTIPLE_TRANSACTION_FAILURES",
                impact,
                description: `${payload.recentTransactionFailures} failed transactions in last hour`
            });
            totalScore += impact;
        } else if (payload.recentTransactionFailures >= RISK_FACTORS.SINGLE_TRANSACTION_FAILURE.threshold) {
            const impact = RISK_FACTORS.SINGLE_TRANSACTION_FAILURE.max;
            factors.push({
                factor: "SINGLE_TRANSACTION_FAILURE",
                impact,
                description: `${payload.recentTransactionFailures} failed transaction(s) in last hour`
            });
            totalScore += impact;
        }
    }

    // Factor 14: Multiple payment methods in session (testing stolen cards)
    if (payload.sessionPaymentMethodCount !== undefined && payload.sessionPaymentMethodCount > 1) {
        if (payload.sessionPaymentMethodCount >= RISK_FACTORS.MULTIPLE_PAYMENT_METHODS.threshold) {
            const impact = RISK_FACTORS.MULTIPLE_PAYMENT_METHODS.max;
            factors.push({
                factor: "MULTIPLE_PAYMENT_METHODS",
                impact,
                description: `Tried ${payload.sessionPaymentMethodCount} different payment methods in this session (card testing suspected)`
            });
            totalScore += impact;
        } else if (payload.sessionPaymentMethodCount >= RISK_FACTORS.TWO_PAYMENT_METHODS.threshold) {
            const impact = RISK_FACTORS.TWO_PAYMENT_METHODS.max;
        factors.push({
                factor: "TWO_PAYMENT_METHODS",
                impact,
                description: `Tried ${payload.sessionPaymentMethodCount} different payment methods in this session`
            });
            totalScore += impact;
        }
    }

    // Normalize score to 0-100 range
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

    // Calculate confidence based on number of factors and their consistency
    const confidence = Math.min(0.3 + (factors.length * 0.1) + (normalizedScore > 0 ? 0.3 : 0), 1.0);

    return {
        score: normalizedScore,
        factors,
        decision,
        confidence: Math.round(confidence * 100) / 100
    };
}
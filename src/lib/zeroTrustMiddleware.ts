import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { orderItems, products, cartItems, carts, zeroTrustAssessments } from "@/server/db/schema";
import { eq } from "drizzle-orm";

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
    
    // Geographic/shipping data
    shippingCountry?: string;
    shippingState?: string;
    shippingCity?: string;
    
    // Store distribution (multi-vendor risk)
    uniqueStoreCount: number;
    storeDistribution: Array<{
        storeId: string;
        storeName: string;
        itemCount: number;
        subtotal: number;
    }>;
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

// Risk factors and their maximum impact scores - More aggressive scoring
const RISK_FACTORS = {
    HIGH_AMOUNT: { max: 30, threshold: 30000 }, // $300+ AUD in cents (lowered from $500)
    UNUSUAL_ITEM_COUNT: { max: 35, threshold: 5 }, // 5+ items (lowered from 10, increased impact)
    EXTREME_ITEM_COUNT: { max: 50, threshold: 30 }, // 30+ items - immediate high risk
    BULK_SINGLE_ITEM: { max: 40, threshold: 10 }, // 10+ of single item (lowered from 20, increased impact)
    EXTREME_BULK_SINGLE: { max: 45, threshold: 50 }, // 50+ of single item - extreme risk
    MULTIPLE_STORES: { max: 25, threshold: 2 }, // 2+ stores (lowered from 3)
    SUSPICIOUS_USER_AGENT: { max: 15 },
    NEW_PAYMENT_METHOD: { max: 20 },
    GEOGRAPHIC_MISMATCH: { max: 25 },
    VELOCITY_CHECK: { max: 35 }, // Future: multiple transactions in short time
    ANONYMOUS_USER: { max: 30 }
};

/*
    Zero Trust Check - Analyzes payment requests for fraud risk
    Returns risk score and decision (allow/warn/deny)
*/
export async function zeroTrustCheck(
    req: NextRequest, 
    body: PaymentRequestBody, 
    session?: { user?: { id?: string; email?: string | null; userType?: string } }
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

        // If items are not provided, try to fetch them from database
        let enrichedItems: PaymentItem[] = items;
        
        if (items.length === 0 && orderId && userId) {
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

        // Extract shipping information if available
        const shippingData = body.shippingData ?? {};
        
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
            
            // Geographic/shipping data
            shippingCountry: shippingData.country,
            shippingState: shippingData.state,
            shippingCity: shippingData.city,
            
            // Store distribution
            uniqueStoreCount: storeDistribution.length,
            storeDistribution
        };

        // Calculate risk score
        const riskScore = calculateRiskScore(riskPayload);
        
        // Log the risk assessment to database
        try {
            await db.insert(zeroTrustAssessments).values({
                userId: riskPayload.userId,
                orderId: riskPayload.orderId,
                riskScore: riskScore.score,
                decision: riskScore.decision,
                confidence: Math.round(riskScore.confidence * 100),
                transactionAmount: riskPayload.totalAmount,
                currency: riskPayload.currency,
                itemCount: riskPayload.itemCount,
                storeCount: riskPayload.uniqueStoreCount,
                riskFactors: JSON.stringify(riskScore.factors),
                userAgent: riskPayload.userAgent,
                ipAddress: riskPayload.ipAddress,
                shippingCountry: riskPayload.shippingCountry,
                shippingState: riskPayload.shippingState,
                shippingCity: riskPayload.shippingCity,
            });
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
    if (payload.itemCount > RISK_FACTORS.UNUSUAL_ITEM_COUNT.threshold) {
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
    if (payload.itemCount > RISK_FACTORS.EXTREME_ITEM_COUNT.threshold) {
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

    // Factor 5: Anonymous/unauthenticated user
    if (!payload.userId) {
        factors.push({
            factor: "ANONYMOUS_USER",
            impact: RISK_FACTORS.ANONYMOUS_USER.max,
            description: "Transaction from unauthenticated user"
        });
        totalScore += RISK_FACTORS.ANONYMOUS_USER.max;
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

    // Factor 8: Geographic inconsistencies (basic check)
    if (payload.shippingCountry && payload.shippingCountry !== 'AU') {
        factors.push({
            factor: "GEOGRAPHIC_MISMATCH",
            impact: RISK_FACTORS.GEOGRAPHIC_MISMATCH.max,
            description: `International shipping to ${payload.shippingCountry}`
        });
        totalScore += RISK_FACTORS.GEOGRAPHIC_MISMATCH.max;
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
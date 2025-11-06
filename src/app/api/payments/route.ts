import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  paymentTransactions,
  orders,
  zeroTrustVerifications,
} from "@/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { zeroTrustCheck } from "@/lib/zeroTrustMiddleware";
import {
  createPaymentIntent,
  createOrRetrieveCustomer,
  confirmPaymentIntent,
} from "@/lib/stripe";
import type { PaymentData } from "@/types/api-responses";
import {
  validateStoresHaveProviders,
  getPaymentProvidersForStores,
  getStripeAccountForStore,
} from "@/lib/payment-providers";
import { formatAmountForStripe } from "@/lib/stripe";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

interface CreatePaymentRequest {
  amount: number;
  currency?: string;
  orderId?: number;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
  verificationToken?: string; // required for 'warn' flows
  orderData?: PaymentData["orderData"]; // Complete checkout session data for risk assessment
}

interface ZeroTrustAssessment {
  decision: "allow" | "warn" | "deny";
  score: number;
  confidence: number;
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  timestamp: string;
}

// POST /api/payments - Create payment intent
export async function POST(request: NextRequest) {
  let orderId: number | undefined;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const body = (await request.json()) as CreatePaymentRequest;
    orderId = body.orderId; // Extract early for use in catch block

    // Transform orderData to CheckoutSessionData format if needed
    // Extract items from storeGroups and map to CheckoutSessionItem format
    const checkoutSessionData =
      body.orderData?.storeGroups && body.orderData.storeGroups.length > 0
        ? {
            items: body.orderData.storeGroups.flatMap((group) =>
              group.items.map((item) => ({
                productId: item.id,
                price: item.price,
                quantity: item.quantity,
              })),
            ),
          }
        : undefined;

    // Perform zero trust risk assessment using complete checkout session data
    const zeroTrustResponse = await zeroTrustCheck(
      request,
      body,
      session,
      checkoutSessionData,
    );
    if (zeroTrustResponse.status !== 200) {
      return zeroTrustResponse;
    }

    // Parse the zero trust assessment result
    const zeroTrustData = (await zeroTrustResponse.json()) as {
      riskAssessment: ZeroTrustAssessment & { id?: number };
    };
    const riskAssessment = zeroTrustData.riskAssessment;

    // Extract orderData early for use in verification
    const { orderData } = body;

    // Handle zero trust decisions
    if (riskAssessment.decision === "deny") {
      console.log(
        `Payment BLOCKED by Zero Trust: Score ${riskAssessment.score}, User: ${user.id}`,
      );

      // Update order status to Failed if orderId is provided
      if (body.orderId) {
        try {
          await db
            .update(orders)
            .set({
              status: "Failed",
              paymentStatus: "Failed",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, body.orderId));

          console.log(
            `Order ${body.orderId} status updated to Failed due to zero trust denial`,
          );
        } catch (error) {
          console.error(
            `Failed to update order ${body.orderId} status:`,
            error,
          );
          // Continue with the denial response even if order update fails
        }
      }

      return NextResponse.json(
        {
          error: "Transaction blocked for security reasons",
          errorCode: "ZERO_TRUST_DENIED",
          riskScore: riskAssessment.score,
          riskFactors: riskAssessment.factors.map((f) => f.factor),
          message:
            "This transaction has been flagged as high-risk and cannot be processed. Please contact support if you believe this is an error.",
          supportContact: "support@yourstore.com",
        },
        { status: 403 },
      );
    }

    if (riskAssessment.decision === "warn") {
      console.log(
        `Payment FLAGGED by Zero Trust: Score ${riskAssessment.score}, User: ${user.id}`,
      );

      // Enforce presence of a verification token
      if (!body.verificationToken) {
        return await requireNewVerification();
      }

      // Validate the provided token belongs to the user, is verified, fresh, and matches payload
      const [verification] = await db
        .select()
        .from(zeroTrustVerifications)
        .where(
          and(
            eq(zeroTrustVerifications.token, body.verificationToken),
            eq(zeroTrustVerifications.userId, user.id),
            eq(zeroTrustVerifications.status, "verified"),
          ),
        )
        .limit(1);

      if (!verification?.verifiedAt) {
        return await requireNewVerification();
      }

      // Check expiry window (10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (verification.verifiedAt <= tenMinutesAgo) {
        return await requireNewVerification();
      }

      // Ensure payment data integrity: stored paymentData must match current body
      // For verified payments, orderId may be added after order creation, so exclude it from comparison
      try {
        const stored = JSON.parse(
          verification.paymentData ?? "{}",
        ) as Partial<CreatePaymentRequest>;
        const keysToCompare: Array<keyof CreatePaymentRequest> = [
          "amount",
          "currency",
          "paymentMethodId",
          "savePaymentMethod",
        ];
        const mismatch = keysToCompare.some((k) => {
          const a = stored[k];
          const b = body[k];
          return (a ?? undefined) !== (b ?? undefined);
        });
        if (mismatch) {
          return NextResponse.json(
            {
              error: "Payment data mismatch. Please restart verification.",
              errorCode: "ZERO_TRUST_DATA_MISMATCH",
            },
            { status: 409 },
          );
        }
      } catch {
        return NextResponse.json(
          {
            error: "Invalid stored verification data",
          },
          { status: 500 },
        );
      }

      async function requireNewVerification() {
        // Use OTP verification system for warn transactions
        try {
          const { createOTPVerification } = await import(
            "@/lib/api/otp-verification"
          );

          const { token: verificationToken, expiresAt } =
            await createOTPVerification({
              userId: user.id,
              userEmail: user.email ?? "",
              userName: user.name ?? undefined,
              paymentData: {
                ...body,
                orderData,
                riskAssessmentId: riskAssessment.id, // Include risk assessment ID for linking
              }, // Include order data for verification flow
              riskScore: riskAssessment.score,
              riskFactors: riskAssessment.factors,
              transactionAmount: body.amount,
            });

          return NextResponse.json(
            {
              error: "Transaction requires additional verification",
              errorCode: "ZERO_TRUST_VERIFICATION_REQUIRED",
              riskScore: riskAssessment.score,
              riskFactors: riskAssessment.factors.map((f) => f.factor),
              riskAssessmentId: riskAssessment.id, // Include risk assessment ID for order linking
              verificationToken,
              expiresAt: expiresAt.toISOString(),
              message:
                "A verification code has been sent to your email. Please enter it to complete your transaction.",
              userEmail: user.email,
            },
            { status: 202 },
          ); // 202 Accepted but requires action
        } catch (error) {
          console.error("Failed to create OTP verification:", error);
          // Fall back to deny if we can't send OTP
          return NextResponse.json(
            {
              error: "Transaction blocked - verification system unavailable",
              errorCode: "ZERO_TRUST_DENIED",
              message:
                "Unable to send verification code. Please try again later or contact support.",
            },
            { status: 503 },
          );
        }
      }
    }

    const {
      amount,
      currency = "aud",
      paymentMethodId,
      savePaymentMethod = false,
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Extract store IDs from orderData or orderId
    let storeIds: string[] = [];
    if (body.orderData?.storeGroups && body.orderData.storeGroups.length > 0) {
      storeIds = body.orderData.storeGroups.map(
        (group: { storeId: string }) => group.storeId,
      );
    } else if (orderId) {
      // Query orders table to get store IDs
      const orderRows = await db
        .select({ storeId: orders.storeId })
        .from(orders)
        .where(eq(orders.id, orderId));
      storeIds = orderRows
        .map((o) => o.storeId)
        .filter((id): id is string => id !== null);
    }

    // Validate all stores have active payment providers
    if (storeIds.length > 0) {
      const validation = await validateStoresHaveProviders(storeIds);
      if (!validation.valid) {
        const missingStoreNames = validation.missingStores
          .map((s) => s.storeId)
          .join(", ");
        return NextResponse.json(
          {
            error: "Payment setup required",
            errorCode: "PAYMENT_PROVIDER_MISSING",
            message: `The following stores need payment setup: ${missingStoreNames}`,
            missingStores: validation.missingStores,
          },
          { status: 400 },
        );
      }
    }

    // Determine payment routing strategy
    // For single-store orders: use that store's Connect account
    // For multi-store orders: use platform account with transfers
    const providers = await getPaymentProvidersForStores(storeIds);
    const isMultiStore = storeIds.length > 1;
    let stripeAccountId: string | undefined;
    let transferData: { destination: string; amount: number }[] | undefined =
      undefined;

    if (isMultiStore && body.orderData?.storeGroups) {
      // Multi-store: create payment on platform account with transfers
      stripeAccountId = undefined; // Use platform account
      const totalSubtotal = body.orderData.storeGroups.reduce(
        (sum: number, g: { subtotal: number }) => sum + (g.subtotal || 0),
        0,
      );
      const shipping = totalSubtotal > 50 ? 0 : 5.99;
      const tax = totalSubtotal * 0.1;

      transferData = body.orderData.storeGroups
        .map((group: { storeId: string; subtotal: number }) => {
          const provider = providers.get(group.storeId);
          if (!provider?.stripeAccountId) {
            return null;
          }
          // Calculate store amount including proportional shipping and tax
          const storeSubtotal = group.subtotal || 0;
          const storeAmount =
            storeSubtotal +
            (shipping * storeSubtotal) / totalSubtotal +
            (tax * storeSubtotal) / totalSubtotal;

          return {
            destination: provider.stripeAccountId,
            amount: formatAmountForStripe(storeAmount),
          };
        })
        .filter(
          (t): t is { destination: string; amount: number } => t !== null,
        );

      // If we can't create transfers for all stores, fall back to single store
      if (transferData.length !== storeIds.length) {
        console.warn(
          "Not all stores have payment providers, falling back to first store",
        );
        const firstProvider = providers.get(storeIds[0]);
        stripeAccountId = firstProvider?.stripeAccountId ?? undefined;
        transferData = undefined;
      }
    } else if (storeIds.length === 1) {
      // Single-store: use that store's Connect account
      stripeAccountId =
        (await getStripeAccountForStore(storeIds[0])) ?? undefined;
    }

    // Create or retrieve Stripe customer
    // Handle credentials users who have fake @local.com emails
    const userEmail = user.email?.endsWith("@local.com")
      ? undefined
      : user.email;

    let customer;
    try {
      customer = await createOrRetrieveCustomer({
        userId: user.id,
        email: userEmail ?? undefined,
        name: user.name ?? undefined,
        stripeAccountId, // Use Connect account if available
      });
    } catch (error) {
      console.error("Failed to create/retrieve Stripe customer:", error);
      return NextResponse.json(
        {
          error: "Failed to initialize payment customer",
          errorCode: "CUSTOMER_CREATION_FAILED",
        },
        { status: 500 },
      );
    }

    // Create payment intent
    // For multi-store with transfers, create on platform account
    // For single-store, create on Connect account
    let paymentIntent;
    try {
      const paymentIntentParams: {
        amount: number;
        currency: string;
        customerId: string;
        paymentMethodId?: string;
        metadata: Record<string, string>;
        stripeAccountId?: string;
        transferData?: { destination: string; amount?: number };
      } = {
        amount,
        currency,
        customerId: customer.id,
        paymentMethodId,
        metadata: {
          userId: user.id,
          orderId: orderId?.toString() ?? "",
          savePaymentMethod: savePaymentMethod.toString(),
          storeIds: storeIds.join(","),
        },
      };

      // For multi-store with transfers, use first transfer as primary
      // Note: Stripe Connect transfers require creating on platform account
      // and using transfer_data for the primary destination
      if (transferData && transferData.length > 0) {
        // Use platform account (no stripeAccountId) with transfer_data
        paymentIntentParams.transferData = {
          destination: transferData[0].destination,
          amount: transferData[0].amount,
        };
        // Additional transfers would need to be handled via separate transfers API
        // For now, we'll route the full amount to the first store
        // TODO: Implement proper split payments for multi-store
      } else if (stripeAccountId) {
        paymentIntentParams.stripeAccountId = stripeAccountId;
      }

      paymentIntent = await createPaymentIntent(paymentIntentParams);
    } catch (error) {
      console.error("Failed to create Stripe payment intent:", error);

      // If order was already created, mark it as failed
      if (orderId) {
        try {
          await db
            .update(orders)
            .set({
              status: "Failed",
              paymentStatus: "Failed",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));
        } catch (dbError) {
          console.error(
            "Failed to update order status after payment intent failure:",
            dbError,
          );
        }
      }

      // Check if it's a Stripe error with more details
      const stripeError = error as {
        type?: string;
        message?: string;
        code?: string;
      };
      const errorMessage =
        stripeError.message ?? "Failed to create payment intent";

      return NextResponse.json(
        {
          error: errorMessage,
          errorCode: stripeError.code ?? "PAYMENT_INTENT_CREATION_FAILED",
        },
        { status: 500 },
      );
    }

    // Validate payment intent response
    if (!paymentIntent.client_secret) {
      console.error(
        "Payment intent created but missing client_secret:",
        paymentIntent.id,
      );

      // If order was already created, mark it as failed
      if (orderId) {
        try {
          await db
            .update(orders)
            .set({
              status: "Failed",
              paymentStatus: "Failed",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));
        } catch (dbError) {
          console.error(
            "Failed to update order status after invalid payment intent:",
            dbError,
          );
        }
      }

      return NextResponse.json(
        {
          error: "Invalid payment intent response from payment provider",
          errorCode: "INVALID_PAYMENT_INTENT",
        },
        { status: 500 },
      );
    }

    // Only create transaction record if orderId is provided
    // For warn results, order will be created after OTP verification
    if (orderId) {
      try {
        await db.insert(paymentTransactions).values({
          orderId: orderId,
          amount: Math.round(amount * 100), // Convert dollars to cents for database storage
          currency,
          status: "pending",
          transactionId: paymentIntent.id,
          gatewayResponse: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            customerId: customer.id,
            status: paymentIntent.status,
          }),
        });
      } catch (dbError) {
        console.error("Failed to create transaction record:", dbError);
        // Don't fail the request if transaction record creation fails
        // Payment intent is already created and can be tracked via Stripe
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customer.id,
    });
  } catch (error) {
    console.error("Payment creation error:", error);

    // If order was already created, try to mark it as failed
    if (orderId) {
      try {
        await db
          .update(orders)
          .set({
            status: "Failed",
            paymentStatus: "Failed",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
      } catch (dbError) {
        console.error("Failed to update order status after error:", dbError);
      }
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create payment intent";
    return NextResponse.json(
      { error: errorMessage, errorCode: "UNEXPECTED_ERROR" },
      { status: 500 },
    );
  }
}

interface ConfirmPaymentRequest {
  paymentIntentId: string;
  paymentMethodId?: string;
}

// PUT /api/payments - Confirm payment
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ConfirmPaymentRequest;

    const { paymentIntentId, paymentMethodId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID required" },
        { status: 400 },
      );
    }

    // Confirm the payment intent
    const paymentIntent = await confirmPaymentIntent(
      paymentIntentId,
      paymentMethodId,
    );

    // Update transaction status in database
    if (paymentIntent.metadata?.orderId) {
      const orderId = parseInt(paymentIntent.metadata.orderId);

      await db
        .update(paymentTransactions)
        .set({
          status: paymentIntent.status === "succeeded" ? "completed" : "failed",
          gatewayResponse: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            paymentMethod: paymentIntent.payment_method,
          }),
          updatedAt: new Date(),
        })
        .where(eq(paymentTransactions.transactionId, paymentIntentId));

      // Update order status based on payment result
      if (paymentIntent.status === "succeeded") {
        await db
          .update(orders)
          .set({
            status: "Processing",
            paymentStatus: "Paid",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
      } else if (
        paymentIntent.status === "requires_payment_method" ||
        paymentIntent.status === "canceled" ||
        paymentIntent.status === "requires_action"
      ) {
        // Set order status to Denied for denied/failed transactions
        await db
          .update(orders)
          .set({
            status: "Denied",
            paymentStatus: "Failed",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
      }
    }

    return NextResponse.json({
      success: true,
      status: paymentIntent.status,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 },
    );
  }
}

// GET /api/payments - Get payment status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("paymentIntentId");
    const orderId = searchParams.get("orderId");

    if (!paymentIntentId && !orderId) {
      return NextResponse.json(
        { error: "Payment intent ID or order ID required" },
        { status: 400 },
      );
    }

    let transaction;

    if (paymentIntentId) {
      const [result] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.transactionId, paymentIntentId))
        .limit(1);
      transaction = result;
    } else if (orderId) {
      const [result] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.orderId, parseInt(orderId)))
        .limit(1);
      transaction = result;
    }

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        orderId: transaction.orderId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        transactionId: transaction.transactionId,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    });
  } catch (error) {
    console.error("Payment status error:", error);
    return NextResponse.json(
      { error: "Failed to get payment status" },
      { status: 500 },
    );
  }
}

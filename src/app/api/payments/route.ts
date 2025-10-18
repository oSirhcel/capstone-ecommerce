import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { paymentTransactions, orders } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import {
  createPaymentIntent,
  createOrRetrieveCustomer,
  confirmPaymentIntent,
  formatAmountForStripe,
} from "@/lib/stripe";

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
}

// POST /api/payments - Create payment intent
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const body = (await request.json()) as CreatePaymentRequest;

    const {
      amount,
      currency = "aud",
      orderId,
      paymentMethodId,
      savePaymentMethod = false,
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Create or retrieve Stripe customer
    // Handle credentials users who have fake @local emails
    const userEmail = user.email?.endsWith("@local") ? undefined : user.email;

    const customer = await createOrRetrieveCustomer({
      userId: user.id,
      email: userEmail ?? undefined,
      name: user.name ?? undefined,
    });

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      customerId: customer.id,
      paymentMethodId,
      metadata: {
        userId: user.id,
        orderId: orderId?.toString() ?? "",
        savePaymentMethod: savePaymentMethod.toString(),
      },
    });

    // If orderId provided, create a pending transaction record
    if (orderId) {
      await db.insert(paymentTransactions).values({
        orderId: orderId,
        amount: formatAmountForStripe(amount),
        currency,
        status: "pending",
        transactionId: paymentIntent.id,
        gatewayResponse: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          customerId: customer.id,
          status: paymentIntent.status,
        }),
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customer.id,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
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

      // Update order status if payment succeeded
      if (paymentIntent.status === "succeeded") {
        await db
          .update(orders)
          .set({
            status: "Processing",
            paymentStatus: "Paid",
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

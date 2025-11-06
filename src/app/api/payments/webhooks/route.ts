import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { paymentTransactions, orders, storePaymentProviders } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { constructWebhookEvent, stripe } from "@/lib/stripe";
import type Stripe from "stripe";

// POST /api/payments/webhooks - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("Missing Stripe signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("Webhook event received:", event.type, event.id);

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "payment_intent.processing":
        await handlePaymentIntentProcessing(event.data.object);
        break;

      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(event.data.object);
        break;

      case "payment_method.attached":
        await handlePaymentMethodAttached(event.data.object);
        break;

      case "customer.created":
        await handleCustomerCreated(event.data.object);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

// Handle successful payment
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  try {
    console.log("Processing payment_intent.succeeded:", paymentIntent.id);

    // Get charges if available (may need to be expanded)
    const charges =
      "charges" in paymentIntent
        ? (paymentIntent.charges as {
            data?: Array<{ receipt_url?: string | null }>;
          })
        : null;
    const receiptUrl = charges?.data?.[0]?.receipt_url ?? null;

    // Check if transaction exists (idempotency check)
    const [existingTransaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.transactionId, paymentIntent.id))
      .limit(1);

    if (existingTransaction) {
      // If transaction already exists and is completed, skip update (idempotency)
      if (existingTransaction.status === "completed") {
        console.log(
          `Transaction ${paymentIntent.id} already processed, skipping duplicate webhook`,
        );
        return;
      }

      // Update transaction status
      try {
        await db
          .update(paymentTransactions)
          .set({
            status: "completed",
            gatewayResponse: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              status: paymentIntent.status,
              paymentMethod: paymentIntent.payment_method,
              receiptUrl,
            }),
            updatedAt: new Date(),
          })
          .where(eq(paymentTransactions.transactionId, paymentIntent.id));
      } catch (dbError) {
        console.error(
          "Failed to update transaction status in webhook:",
          dbError,
        );
        // Don't throw - continue to order update
      }
    } else {
      // Transaction doesn't exist - might be a webhook before transaction record was created
      // This can happen in edge cases, log but don't fail
      console.warn(
        `Transaction ${paymentIntent.id} not found in database, skipping transaction update`,
      );
    }

    // Update order status if orderId exists in metadata
    if (paymentIntent.metadata?.orderId) {
      const orderId = parseInt(paymentIntent.metadata.orderId);

      // Check if order exists before updating
      const [existingOrder] = await db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (existingOrder) {
        try {
          await db
            .update(orders)
            .set({
              status: "Processing",
              paymentStatus: "Paid",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

          console.log(`Order ${orderId} status updated to Processing`);
        } catch (dbError) {
          console.error(
            `Failed to update order ${orderId} status in webhook:`,
            dbError,
          );
          // Don't throw - webhook was processed, order update can be retried
        }
      } else {
        console.warn(
          `Order ${orderId} not found in database for payment intent ${paymentIntent.id}`,
        );
      }
    }
  } catch (error) {
    console.error("Error handling payment_intent.succeeded:", error);
    // Don't throw - webhook processing should be idempotent
    // Stripe will retry if we return an error, but we've already logged it
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log("Processing payment_intent.payment_failed:", paymentIntent.id);

    // Check if transaction exists (idempotency check)
    const [existingTransaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.transactionId, paymentIntent.id))
      .limit(1);

    if (existingTransaction) {
      // Update transaction status
      try {
        await db
          .update(paymentTransactions)
          .set({
            status: "Failed",
            gatewayResponse: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              status: paymentIntent.status,
              lastPaymentError: paymentIntent.last_payment_error,
            }),
            updatedAt: new Date(),
          })
          .where(eq(paymentTransactions.transactionId, paymentIntent.id));
      } catch (dbError) {
        console.error(
          "Failed to update transaction status in webhook:",
          dbError,
        );
        // Continue to order update
      }
    } else {
      console.warn(
        `Transaction ${paymentIntent.id} not found in database, skipping transaction update`,
      );
    }

    // Update order status if orderId exists in metadata
    if (paymentIntent.metadata?.orderId) {
      const orderId = parseInt(paymentIntent.metadata.orderId);

      // Check if order exists before updating
      const [existingOrder] = await db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (existingOrder) {
        // Check if this is a denial (card declined, insufficient funds, etc.)
        const isDenied =
          paymentIntent.last_payment_error?.code === "card_declined" ||
          paymentIntent.last_payment_error?.code === "insufficient_funds" ||
          paymentIntent.last_payment_error?.code === "expired_card" ||
          paymentIntent.last_payment_error?.code === "incorrect_cvc" ||
          paymentIntent.last_payment_error?.code === "processing_error";

        try {
          await db
            .update(orders)
            .set({
              status: isDenied ? "Denied" : "Failed",
              paymentStatus: "Failed",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

          console.log(
            `Order ${orderId} status updated to ${isDenied ? "Denied" : "Failed"}`,
          );
        } catch (dbError) {
          console.error(
            `Failed to update order ${orderId} status in webhook:`,
            dbError,
          );
          // Don't throw - webhook was processed
        }
      } else {
        console.warn(
          `Order ${orderId} not found in database for payment intent ${paymentIntent.id}`,
        );
      }
    }
  } catch (error) {
    console.error("Error handling payment_intent.payment_failed:", error);
    // Don't throw - webhook processing should be idempotent
  }
}

// Handle processing payment
async function handlePaymentIntentProcessing(
  paymentIntent: Stripe.PaymentIntent,
) {
  try {
    console.log("Processing payment_intent.processing:", paymentIntent.id);

    // Update transaction status
    await db
      .update(paymentTransactions)
      .set({
        status: "Pending",
        gatewayResponse: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          paymentMethod: paymentIntent.payment_method,
        }),
        updatedAt: new Date(),
      })
      .where(eq(paymentTransactions.transactionId, paymentIntent.id));
  } catch (error) {
    console.error("Error handling payment_intent.processing:", error);
    throw error;
  }
}

// Handle canceled payment
async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent,
) {
  try {
    console.log("Processing payment_intent.canceled:", paymentIntent.id);

    // Update transaction status
    await db
      .update(paymentTransactions)
      .set({
        status: "Failed",
        gatewayResponse: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          cancellationReason: paymentIntent.cancellation_reason,
        }),
        updatedAt: new Date(),
      })
      .where(eq(paymentTransactions.transactionId, paymentIntent.id));

    // Update order status if orderId exists in metadata
    if (paymentIntent.metadata?.orderId) {
      const orderId = parseInt(paymentIntent.metadata.orderId);

      await db
        .update(orders)
        .set({
          status: "Cancelled",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      console.log(`Order ${orderId} status updated to Cancelled`);
    }
  } catch (error) {
    console.error("Error handling payment_intent.canceled:", error);
    throw error;
  }
}

// Handle payment method attached to customer
async function handlePaymentMethodAttached(
  paymentMethod: Stripe.PaymentMethod,
) {
  try {
    console.log("Processing payment_method.attached:", paymentMethod.id);

    // Log for debugging - in production you might want to sync with your database
    const customerId =
      typeof paymentMethod.customer === "string"
        ? paymentMethod.customer
        : (paymentMethod.customer?.id ?? "unknown");
    console.log(
      `Payment method ${paymentMethod.id} attached to customer ${customerId}`,
    );
  } catch (error) {
    console.error("Error handling payment_method.attached:", error);
    throw error;
  }
}

// Handle customer creation
async function handleCustomerCreated(customer: Stripe.Customer) {
  try {
    console.log("Processing customer.created:", customer.id);

    // Log customer creation - you might want to sync with your user database
    console.log(`Customer created: ${customer.id} (${customer.email})`);
  } catch (error) {
    console.error("Error handling customer.created:", error);
    throw error;
  }
}

// Handle Connect account updates
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    console.log("Processing account.updated:", account.id);

    // Update payment provider status when Connect account status changes
    const [provider] = await db
      .select()
      .from(storePaymentProviders)
      .where(eq(storePaymentProviders.stripeAccountId, account.id))
      .limit(1);

    if (provider) {
      const accountStatus =
        account.details_submitted && account.charges_enabled
          ? "active"
          : account.details_submitted
            ? "pending"
            : "restricted";

      await db
        .update(storePaymentProviders)
        .set({
          stripeAccountStatus: accountStatus,
          isActive: accountStatus === "active",
          updatedAt: new Date(),
        })
        .where(eq(storePaymentProviders.stripeAccountId, account.id));

      console.log(
        `Updated payment provider status for account ${account.id} to ${accountStatus}`,
      );
    }
  } catch (error) {
    console.error("Error handling account.updated:", error);
    // Don't throw - webhook processing should be idempotent
  }
}

// Allow only POST method
export const GET = () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

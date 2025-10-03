import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/server/db';
import { paymentTransactions, orders } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { constructWebhookEvent } from '@/lib/stripe';
import Stripe from 'stripe';

// POST /api/payments/webhooks - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Webhook event received:', event.type, event.id);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.processing':
        await handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing payment_intent.succeeded:', paymentIntent.id);

    // Update transaction status
    await db
      .update(paymentTransactions)
      .set({
        status: 'completed',
        gatewayResponse: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          paymentMethod: paymentIntent.payment_method,
          charges: paymentIntent.charges,
          receiptUrl: paymentIntent.charges.data[0]?.receipt_url,
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
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      console.log(`Order ${orderId} status updated to confirmed`);
    }

  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    throw error;
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing payment_intent.payment_failed:', paymentIntent.id);

    // Update transaction status
    await db
      .update(paymentTransactions)
      .set({
        status: 'failed',
        gatewayResponse: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          lastPaymentError: paymentIntent.last_payment_error,
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
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      console.log(`Order ${orderId} status updated to failed`);
    }

  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
    throw error;
  }
}

// Handle processing payment
async function handlePaymentIntentProcessing(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing payment_intent.processing:', paymentIntent.id);

    // Update transaction status
    await db
      .update(paymentTransactions)
      .set({
        status: 'pending',
        gatewayResponse: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          paymentMethod: paymentIntent.payment_method,
        }),
        updatedAt: new Date(),
      })
      .where(eq(paymentTransactions.transactionId, paymentIntent.id));

  } catch (error) {
    console.error('Error handling payment_intent.processing:', error);
    throw error;
  }
}

// Handle canceled payment
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing payment_intent.canceled:', paymentIntent.id);

    // Update transaction status
    await db
      .update(paymentTransactions)
      .set({
        status: 'failed',
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
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      console.log(`Order ${orderId} status updated to cancelled`);
    }

  } catch (error) {
    console.error('Error handling payment_intent.canceled:', error);
    throw error;
  }
}

// Handle payment method attached to customer
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  try {
    console.log('Processing payment_method.attached:', paymentMethod.id);
    
    // Log for debugging - in production you might want to sync with your database
    console.log(`Payment method ${paymentMethod.id} attached to customer ${paymentMethod.customer}`);

  } catch (error) {
    console.error('Error handling payment_method.attached:', error);
    throw error;
  }
}

// Handle customer creation
async function handleCustomerCreated(customer: Stripe.Customer) {
  try {
    console.log('Processing customer.created:', customer.id);
    
    // Log customer creation - you might want to sync with your user database
    console.log(`Customer created: ${customer.id} (${customer.email})`);

  } catch (error) {
    console.error('Error handling customer.created:', error);
    throw error;
  }
}

// Allow only POST method
export const GET = () => {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
};

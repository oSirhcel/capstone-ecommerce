import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/server/db';
import { paymentTransactions, orders, zeroTrustVerifications } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import {zeroTrustCheck } from '@/lib/zeroTrustMiddleware';
import {
  createPaymentIntent,
  createOrRetrieveCustomer,
  confirmPaymentIntent,
  formatAmountForStripe,
} from '@/lib/stripe';

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
  orderData?: any; // Order data for verification flow
}

interface ZeroTrustAssessment {
  decision: 'allow' | 'warn' | 'deny';
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
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const body = await request.json() as CreatePaymentRequest;

    // Perform zero trust risk assessment
    const zeroTrustResponse = await zeroTrustCheck(request, body, session);
    if (zeroTrustResponse.status !== 200) {
      return zeroTrustResponse;
    }

    // Parse the zero trust assessment result
    const zeroTrustData = await zeroTrustResponse.json() as { riskAssessment: ZeroTrustAssessment };
    const riskAssessment = zeroTrustData.riskAssessment;

    // Extract orderData early for use in verification
    const { orderData } = body;

    // Handle zero trust decisions
    if (riskAssessment.decision === 'deny') {
      console.log(`Payment BLOCKED by Zero Trust: Score ${riskAssessment.score}, User: ${user.id}`);
      return NextResponse.json({
        error: 'Transaction blocked for security reasons',
        errorCode: 'ZERO_TRUST_DENIED',
        riskScore: riskAssessment.score,
        riskFactors: riskAssessment.factors.map(f => f.factor),
        message: 'This transaction has been flagged as high-risk and cannot be processed. Please contact support if you believe this is an error.',
        supportContact: 'support@yourstore.com'
      }, { status: 403 });
    }

    if (riskAssessment.decision === 'warn') {
      console.log(`Payment FLAGGED by Zero Trust: Score ${riskAssessment.score}, User: ${user.id}`);
      
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
            eq(zeroTrustVerifications.status, 'verified'),
          )
        )
        .limit(1);

      if (!verification || !verification.verifiedAt) {
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
        const stored = JSON.parse(verification.paymentData || '{}');
        const keysToCompare: Array<keyof CreatePaymentRequest> = ['amount', 'currency', 'paymentMethodId', 'savePaymentMethod'];
        const mismatch = keysToCompare.some((k) => {
          const a = (stored as any)[k];
          const b = (body as any)[k];
          return (a ?? undefined) !== (b ?? undefined);
        });
        if (mismatch) {
          return NextResponse.json({
            error: 'Payment data mismatch. Please restart verification.',
            errorCode: 'ZERO_TRUST_DATA_MISMATCH',
          }, { status: 409 });
        }
      } catch {
        return NextResponse.json({
          error: 'Invalid stored verification data',
        }, { status: 500 });
      }

      async function requireNewVerification() {
        // Use OTP verification system for warn transactions
        try {
          const { createOTPVerification } = await import('@/lib/api/otp-verification');
          
          const { token: verificationToken, expiresAt } = await createOTPVerification({
            userId: user.id,
            userEmail: user.email ?? '',
            userName: user.name ?? undefined,
            paymentData: { ...body, orderData }, // Include order data for verification flow
            riskScore: riskAssessment.score,
            riskFactors: riskAssessment.factors,
            transactionAmount: body.amount,
          });
          
          return NextResponse.json({
            error: 'Transaction requires additional verification',
            errorCode: 'ZERO_TRUST_VERIFICATION_REQUIRED',
            riskScore: riskAssessment.score,
            riskFactors: riskAssessment.factors.map(f => f.factor),
            verificationToken,
            expiresAt: expiresAt.toISOString(),
            message: 'A verification code has been sent to your email. Please enter it to complete your transaction.',
            userEmail: user.email
          }, { status: 202 }); // 202 Accepted but requires action
        } catch (error) {
          console.error('Failed to create OTP verification:', error);
          // Fall back to deny if we can't send OTP
          return NextResponse.json({
            error: 'Transaction blocked - verification system unavailable',
            errorCode: 'ZERO_TRUST_DENIED',
            message: 'Unable to send verification code. Please try again later or contact support.',
          }, { status: 503 });
        }
      }
    }
    
    const {
      amount,
      currency = 'aud',
      orderId,
      paymentMethodId,
      savePaymentMethod = false,
      verificationToken,
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    // Handle credentials users who have fake @local emails
    const userEmail = user.email?.endsWith('@local') ? undefined : user.email;
    
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
        orderId: orderId?.toString() ?? '',
        savePaymentMethod: savePaymentMethod.toString(),
      },
    });

    // Only create transaction record if orderId is provided
    // For warn results, order will be created after OTP verification
    if (orderId) {
      await db.insert(paymentTransactions).values({
        orderId: orderId,
        amount: amount, // Amount is already in cents from the order
        currency,
        status: 'pending',
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
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as ConfirmPaymentRequest;
    
    const { paymentIntentId, paymentMethodId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID required' },
        { status: 400 }
      );
    }

    // Confirm the payment intent
    const paymentIntent = await confirmPaymentIntent(
      paymentIntentId,
      paymentMethodId
    );

    // Update transaction status in database
    if (paymentIntent.metadata?.orderId) {
      const orderId = parseInt(paymentIntent.metadata.orderId);
      
      await db
        .update(paymentTransactions)
        .set({
          status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
          gatewayResponse: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            paymentMethod: paymentIntent.payment_method,
          }),
          updatedAt: new Date(),
        })
        .where(eq(paymentTransactions.transactionId, paymentIntentId));

      // Update order status if payment succeeded
      if (paymentIntent.status === 'succeeded') {
        await db
          .update(orders)
          .set({
            status: 'confirmed',
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
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}

// GET /api/payments - Get payment status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');
    const orderId = searchParams.get('orderId');

    if (!paymentIntentId && !orderId) {
      return NextResponse.json(
        { error: 'Payment intent ID or order ID required' },
        { status: 400 }
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
        { error: 'Transaction not found' },
        { status: 404 }
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
    console.error('Payment status error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment status' },
      { status: 500 }
    );
  }
}

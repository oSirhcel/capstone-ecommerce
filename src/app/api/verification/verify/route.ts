import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/server/db';
import { zeroTrustVerifications, paymentTransactions, orders } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  createPaymentIntent,
  createOrRetrieveCustomer,
  formatAmountForStripe,
} from '@/lib/stripe';

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

// POST /api/verification/verify - Verify code and process payment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token, code } = await request.json();
    
    if (!token || !code) {
      return NextResponse.json({ 
        error: 'Verification token and code required' 
      }, { status: 400 });
    }

    // Find the verification record
    const [verification] = await db
      .select()
      .from(zeroTrustVerifications)
      .where(
        and(
          eq(zeroTrustVerifications.token, token),
          eq(zeroTrustVerifications.userId, session.user.id as string),
          eq(zeroTrustVerifications.status, 'pending')
        )
      )
      .limit(1);

    if (!verification) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification token' 
      }, { status: 404 });
    }

    // Check if token has expired
    if (new Date() > verification.expiresAt) {
      await db
        .update(zeroTrustVerifications)
        .set({ status: 'expired' })
        .where(eq(zeroTrustVerifications.id, verification.id));
        
      return NextResponse.json({ 
        error: 'Verification token has expired' 
      }, { status: 410 });
    }

    // Verify the code
    const riskFactorsData = JSON.parse(verification.riskFactors || '{}');
    const expectedCode = riskFactorsData.verificationCode;
    
    if (!expectedCode || code !== expectedCode) {
      return NextResponse.json({ 
        error: 'Invalid verification code' 
      }, { status: 400 });
    }

    // Mark verification as completed
    await db
      .update(zeroTrustVerifications)
      .set({
        status: 'verified',
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(zeroTrustVerifications.id, verification.id));

    // Mark the verification as approved and return success
    // The actual payment processing will happen when the user returns to checkout
    console.log(`Verification completed for user: ${user.id}, token: ${token}`);

    return NextResponse.json({
      success: true,
      message: 'Verification completed successfully',
      verificationToken: token,
      redirectTo: '/checkout/verified'
    });

  } catch (error) {
    console.error('Verification processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process verification' },
      { status: 500 }
    );
  }
}

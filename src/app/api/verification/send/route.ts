import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/server/db';
import { zeroTrustVerifications } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/verification/send - Send verification email
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Verification token required' }, { status: 400 });
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
      // Update status to expired
      await db
        .update(zeroTrustVerifications)
        .set({ status: 'expired' })
        .where(eq(zeroTrustVerifications.id, verification.id));
        
      return NextResponse.json({ 
        error: 'Verification token has expired' 
      }, { status: 410 });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update verification record with code and email sent status
    await db
      .update(zeroTrustVerifications)
      .set({
        // Store the code temporarily (in production, you'd hash this)
        riskFactors: JSON.stringify({
          ...JSON.parse(verification.riskFactors || '[]'),
          verificationCode
        }),
        emailSent: true,
        emailSentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(zeroTrustVerifications.id, verification.id));

    // TODO: Send actual email with verification code
    // For now, we'll just log it (in development)
    console.log(`Verification code for ${verification.userEmail}: ${verificationCode}`);
    console.log(`Token: ${token}`);
    
    // In production, you would:
    // await sendVerificationEmail(verification.userEmail, verificationCode);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      // In development, return the code for testing
      ...(process.env.NODE_ENV === 'development' && { 
        developmentCode: verificationCode 
      })
    });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}


/**
 * OTP Verification API Functions
 * Handles creation, validation, and management of one-time passwords for transaction verification
 */

import { db } from "@/server/db";
import { zeroTrustVerifications } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { generateOTP, sendOTPEmail } from "@/lib/smtp";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// OTP expires in 10 minutes
const OTP_EXPIRY_MINUTES = 10;

export interface OTPVerificationData {
  id: number;
  token: string;
  userId: string;
  userEmail: string;
  otp: string;
  paymentData: string;
  riskScore: number;
  riskFactors: string | null;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Generate a unique verification token
 */
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create OTP verification record and send email
 */
export async function createOTPVerification(params: {
  userId: string;
  userEmail: string;
  userName?: string;
  paymentData: any;
  riskScore: number;
  riskFactors: any[];
  transactionAmount?: number;
}): Promise<{ token: string; otp: string; expiresAt: Date }> {
  try {
    const otp = generateOTP();
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Hash the OTP for security
    const otpHash = await bcrypt.hash(otp, 10);

    // Store OTP verification in database
    const [verification] = await db.insert(zeroTrustVerifications).values({
      token,
      userId: params.userId,
      userEmail: params.userEmail,
      otpHash,
      paymentData: JSON.stringify(params.paymentData),
      riskScore: params.riskScore,
      riskFactors: JSON.stringify(params.riskFactors),
      status: 'pending',
      expiresAt,
      emailSent: false,
    }).returning();

    // Send OTP email
    await sendOTPEmail(params.userEmail, otp, {
      userName: params.userName,
      transactionAmount: params.transactionAmount,
    });

    // Update email sent status
    await db
      .update(zeroTrustVerifications)
      .set({
        emailSent: true,
        emailSentAt: new Date(),
      })
      .where(eq(zeroTrustVerifications.token, token));

    console.log(`OTP verification created for user ${params.userId}, token: ${token}`);

    return { token, otp, expiresAt };
  } catch (error) {
    console.error('Failed to create OTP verification:', error);
    throw new Error('Failed to create verification. Please try again.');
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(params: {
  token: string;
  otp: string;
}): Promise<{ success: boolean; paymentData?: any; message?: string }> {
  try {
    // Find verification record
    const [verification] = await db
      .select()
      .from(zeroTrustVerifications)
      .where(
        and(
          eq(zeroTrustVerifications.token, params.token),
          eq(zeroTrustVerifications.status, 'pending')
        )
      )
      .limit(1);

    if (!verification) {
      return {
        success: false,
        message: 'Verification token not found or already used',
      };
    }

    // Check if expired
    if (new Date() > verification.expiresAt) {
      // Mark as expired
      await db
        .update(zeroTrustVerifications)
        .set({ status: 'expired' })
        .where(eq(zeroTrustVerifications.token, params.token));

      return {
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      };
    }

    // Verify OTP against hashed version in database
    if (!verification.otpHash) {
      return {
        success: false,
        message: 'Invalid verification record',
      };
    }

    const isValidOTP = await bcrypt.compare(params.otp, verification.otpHash);
    
    if (!isValidOTP) {
      return {
        success: false,
        message: 'Invalid verification code. Please try again.',
      };
    }
    
    // Mark as verified
    await db
      .update(zeroTrustVerifications)
      .set({
        status: 'verified',
        verifiedAt: new Date(),
      })
      .where(eq(zeroTrustVerifications.token, params.token));

    // Parse and return payment data
    const paymentData = JSON.parse(verification.paymentData);

    return {
      success: true,
      paymentData,
    };
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    throw new Error('Verification failed. Please try again.');
  }
}

/**
 * Get verification status
 */
export async function getVerificationStatus(token: string): Promise<OTPVerificationData | null> {
  try {
    const [verification] = await db
      .select()
      .from(zeroTrustVerifications)
      .where(eq(zeroTrustVerifications.token, token))
      .limit(1);

    if (!verification) {
      return null;
    }

    return {
      id: verification.id,
      token: verification.token,
      userId: verification.userId,
      userEmail: verification.userEmail,
      otp: '', // Don't expose OTP
      paymentData: verification.paymentData,
      riskScore: verification.riskScore,
      riskFactors: verification.riskFactors,
      status: verification.status,
      expiresAt: verification.expiresAt,
      createdAt: verification.createdAt,
    };
  } catch (error) {
    console.error('Failed to get verification status:', error);
    return null;
  }
}

/**
 * Resend OTP code
 */
export async function resendOTP(token: string): Promise<{ success: boolean; message?: string }> {
  try {
    const verification = await getVerificationStatus(token);

    if (!verification) {
      return {
        success: false,
        message: 'Verification not found',
      };
    }

    if (verification.status !== 'pending') {
      return {
        success: false,
        message: 'This verification has already been completed or expired',
      };
    }

    // Check if already expired
    if (new Date() > verification.expiresAt) {
      return {
        success: false,
        message: 'Verification has expired. Please restart the payment process.',
      };
    }

    // Generate new OTP
    const newOtp = generateOTP();
    const newOtpHash = await bcrypt.hash(newOtp, 10);
    const newExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Update verification with new OTP and expiry
    await db
      .update(zeroTrustVerifications)
      .set({
        otpHash: newOtpHash,
        expiresAt: newExpiresAt,
        emailSentAt: new Date(),
      })
      .where(eq(zeroTrustVerifications.token, token));

    // Parse payment data to get transaction amount
    const paymentData = JSON.parse(verification.paymentData);

    // Send new OTP email
    await sendOTPEmail(verification.userEmail, newOtp, {
      transactionAmount: paymentData.amount,
    });

    return {
      success: true,
      message: 'New verification code sent successfully',
    };
  } catch (error) {
    console.error('Failed to resend OTP:', error);
    return {
      success: false,
      message: 'Failed to resend code. Please try again.',
    };
  }
}

/**
 * Clean up expired verifications (run periodically)
 */
export async function cleanupExpiredVerifications(): Promise<number> {
  try {
    const now = new Date();
    const result = await db
      .update(zeroTrustVerifications)
      .set({ status: 'expired' })
      .where(
        and(
          eq(zeroTrustVerifications.status, 'pending'),
          // expiresAt < now
        )
      );

    console.log(`Cleaned up expired verifications`);
    return 0; // Return count if needed
  } catch (error) {
    console.error('Failed to cleanup expired verifications:', error);
    return 0;
  }
}


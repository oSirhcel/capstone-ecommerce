/**
 * SMTP Service for Zero Trust OTP Verification
 * Sends one-time password codes via email for transaction verification
 */

import nodemailer from "nodemailer";

// SMTP Configuration - Read from environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT ?? "587", 10),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

// Email template configuration
const EMAIL_FROM =
  process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@yourstore.com";
const EMAIL_FROM_NAME = process.env.SMTP_FROM_NAME ?? "Zero Trust Security";

/**
 * Create reusable transporter
 */
export function createTransporter() {
  if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
    throw new Error(
      "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.",
    );
  }

  return nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: SMTP_CONFIG.auth,
  });
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Email template for OTP verification
 */
function getOTPEmailTemplate(
  otp: string,
  userName?: string,
  transactionAmount?: number,
): string {
  const formattedAmount = transactionAmount
    ? `$${transactionAmount.toFixed(2)}`
    : "your transaction";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transaction Verification Required</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .otp-box {
      background: white;
      border: 2px dashed #667eea;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 25px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background: #1f2937;
      color: #9ca3af;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">🔒 Transaction Verification</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Zero Trust Security System</p>
  </div>
  
  <div class="content">
    ${userName ? `<p>Hello ${userName},</p>` : "<p>Hello,</p>"}
    
    <p>We detected unusual activity with your recent transaction for <strong>${formattedAmount}</strong>. To ensure this transaction is legitimate, please verify your identity using the one-time password below.</p>
    
    <div class="otp-box">
      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your Verification Code</p>
      <div class="otp-code">${otp}</div>
      <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">Valid for 10 minutes</p>
    </div>
    
    <p>Enter this code on the verification page to complete your transaction. This code will expire in <strong>10 minutes</strong>.</p>
    
    <div class="warning">
      <strong>⚠️ Security Notice:</strong> If you did not attempt this transaction, please ignore this email and contact our support team immediately. Do not share this code with anyone.
    </div>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      This is an automated security measure to protect your account. Our system flagged this transaction based on various risk factors including transaction amount, quantity, or purchasing patterns.
    </p>
  </div>
  
  <div class="footer">
    <p>This email was sent by the Zero Trust Security System</p>
    <p>If you need assistance, please contact support@yourstore.com</p>
  </div>
</body>
</html>
  `;
}

/**
 * Plain text version of OTP email
 */
function getOTPEmailPlainText(
  otp: string,
  userName?: string,
  transactionAmount?: number,
): string {
  const formattedAmount = transactionAmount
    ? `$${transactionAmount.toFixed(2)}`
    : "your transaction";

  return `
Transaction Verification Required
Zero Trust Security System

${userName ? `Hello ${userName},` : "Hello,"}

We detected unusual activity with your recent transaction for ${formattedAmount}. 
To ensure this transaction is legitimate, please verify your identity using the one-time password below.

YOUR VERIFICATION CODE: ${otp}

This code is valid for 10 minutes.

Enter this code on the verification page to complete your transaction.

SECURITY NOTICE: If you did not attempt this transaction, please ignore this email 
and contact our support team immediately. Do not share this code with anyone.

This is an automated security measure to protect your account.

---
If you need assistance, please contact support@yourstore.com
  `;
}

/**
 * Send OTP code via email
 */
export async function sendOTPEmail(
  to: string,
  otp: string,
  options?: {
    userName?: string;
    transactionAmount?: number;
  },
): Promise<void> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
      to,
      subject: "Transaction Verification Required - OTP Code",
      html: getOTPEmailTemplate(
        otp,
        options?.userName,
        options?.transactionAmount,
      ),
      text: getOTPEmailPlainText(
        otp,
        options?.userName,
        options?.transactionAmount,
      ),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error(
      "Failed to send verification email. Please try again or contact support.",
    );
  }
}

/**
 * Verify SMTP configuration
 * Returns true if SMTP is properly configured
 */
export async function verifySmtpConfig(): Promise<boolean> {
  try {
    if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
      console.error("SMTP credentials not configured");
      return false;
    }

    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("SMTP configuration verification failed:", error);
    return false;
  }
}

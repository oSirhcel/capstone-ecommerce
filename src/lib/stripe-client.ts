import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";

// Initialize Stripe client
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (stripePromise === null) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      throw new Error("Missing Stripe publishable key");
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

export interface ProcessPaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

interface PaymentErrorResponse {
  error?: string;
  errorCode?: string;
  message?: string;
  riskScore?: number;
  riskFactors?: unknown;
  supportContact?: string;
  verificationToken?: string;
  expiresAt?: string;
  userEmail?: string;
}

interface ZeroTrustBlockError extends Error {
  isZeroTrustBlock: true;
  riskScore?: number;
  riskFactors?: unknown;
  supportContact?: string;
}

interface ZeroTrustVerificationError extends Error {
  isZeroTrustVerification: true;
  riskScore?: number;
  riskFactors?: unknown;
  verificationToken?: string;
  expiresAt?: string;
  userEmail?: string;
}

// Payment processing utilities
export const processPayment = async (params: {
  amount: number;
  currency?: string;
  orderId?: number;
  savePaymentMethod?: boolean;
  orderData?: Record<string, unknown>;
}): Promise<ProcessPaymentResponse> => {
  const response = await fetch("/api/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  // Handle 202 Accepted (verification required) as an error case
  if (response.status === 202 || !response.ok) {
    const error = (await response.json()) as PaymentErrorResponse;

    console.log("Payment API response:", { status: response.status, error });

    // Handle zero trust blocking specially
    if (error.errorCode === "ZERO_TRUST_DENIED") {
      const zeroTrustError = new Error(
        error.message ?? "Transaction blocked for security reasons",
      ) as ZeroTrustBlockError;
      zeroTrustError.isZeroTrustBlock = true;
      zeroTrustError.riskScore = error.riskScore;
      zeroTrustError.riskFactors = error.riskFactors;
      zeroTrustError.supportContact = error.supportContact;
      throw zeroTrustError;
    }

    // Handle zero trust verification required (202 status)
    if (
      error.errorCode === "ZERO_TRUST_VERIFICATION_REQUIRED" ||
      response.status === 202
    ) {
      console.log("Creating verification error with:", error);
      const verificationError = new Error(
        error.message ?? "Transaction requires verification",
      ) as ZeroTrustVerificationError;
      verificationError.isZeroTrustVerification = true;
      verificationError.riskScore = error.riskScore;
      verificationError.riskFactors = error.riskFactors;
      verificationError.verificationToken = error.verificationToken;
      verificationError.expiresAt = error.expiresAt;
      verificationError.userEmail = error.userEmail;
      console.log("Throwing verification error:", verificationError);
      throw verificationError;
    }

    throw new Error(error.error ?? "Payment processing failed");
  }

  return (await response.json()) as ProcessPaymentResponse;
};

interface SavePaymentMethodResponse {
  success: boolean;
}

// Save payment method for future use
export const savePaymentMethod = async (params: {
  paymentMethodId: string;
  setAsDefault?: boolean;
}): Promise<SavePaymentMethodResponse> => {
  const response = await fetch("/api/payments/methods", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to save payment method");
  }

  return (await response.json()) as SavePaymentMethodResponse;
};

interface PaymentMethod {
  id: number;
  type: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface GetPaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
}

// Get user's saved payment methods
export const getPaymentMethods =
  async (): Promise<GetPaymentMethodsResponse> => {
    const response = await fetch("/api/payments/methods");

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      throw new Error(error.error ?? "Failed to get payment methods");
    }

    return (await response.json()) as GetPaymentMethodsResponse;
  };

interface DeletePaymentMethodResponse {
  success: boolean;
}

// Delete a payment method
export const deletePaymentMethod = async (
  paymentMethodId: number,
): Promise<DeletePaymentMethodResponse> => {
  const response = await fetch(`/api/payments/methods?id=${paymentMethodId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to delete payment method");
  }

  return (await response.json()) as DeletePaymentMethodResponse;
};

interface PaymentStatus {
  status: string;
  amount: number;
  currency: string;
  orderId?: number;
}

// Get payment status
export const getPaymentStatus = async (params: {
  paymentIntentId?: string;
  orderId?: number;
}): Promise<PaymentStatus> => {
  const searchParams = new URLSearchParams();

  if (params.paymentIntentId) {
    searchParams.set("paymentIntentId", params.paymentIntentId);
  }

  if (params.orderId) {
    searchParams.set("orderId", params.orderId.toString());
  }

  const response = await fetch(`/api/payments?${searchParams}`);

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to get payment status");
  }

  return (await response.json()) as PaymentStatus;
};

// Format amount for display
export const formatAmount = (amount: number, currency = "AUD"): string => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
  }).format(amount);
};

// Convert cents to dollars
export const centsToAmount = (cents: number): number => {
  return cents / 100;
};

// Convert dollars to cents
export const amountToCents = (amount: number): number => {
  return Math.round(amount * 100);
};

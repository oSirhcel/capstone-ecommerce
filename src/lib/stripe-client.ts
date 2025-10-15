import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe client
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      throw new Error('Missing Stripe publishable key');
    }

    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

// Payment processing utilities
export const processPayment = async (params: {
  amount: number;
  currency?: string;
  orderId?: number;
  savePaymentMethod?: boolean;
  orderData?: any;
}) => {
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  // Handle 202 Accepted (verification required) as an error case
  if (response.status === 202 || !response.ok) {
    const error = await response.json();
    
    console.log('Payment API response:', { status: response.status, error });
    
    // Handle zero trust blocking specially
    if (error.errorCode === 'ZERO_TRUST_DENIED') {
      const zeroTrustError = new Error(error.message || 'Transaction blocked for security reasons');
      (zeroTrustError as any).isZeroTrustBlock = true;
      (zeroTrustError as any).riskScore = error.riskScore;
      (zeroTrustError as any).riskFactors = error.riskFactors;
      (zeroTrustError as any).supportContact = error.supportContact;
      throw zeroTrustError;
    }
    
    // Handle zero trust verification required (202 status)
    if (error.errorCode === 'ZERO_TRUST_VERIFICATION_REQUIRED' || response.status === 202) {
      console.log('Creating verification error with:', error);
      const verificationError = new Error(error.message || 'Transaction requires verification');
      (verificationError as any).isZeroTrustVerification = true;
      (verificationError as any).riskScore = error.riskScore;
      (verificationError as any).riskFactors = error.riskFactors;
      (verificationError as any).verificationToken = error.verificationToken;
      (verificationError as any).expiresAt = error.expiresAt;
      (verificationError as any).userEmail = error.userEmail;
      console.log('Throwing verification error:', verificationError);
      throw verificationError;
    }
    
    throw new Error(error.error || 'Payment processing failed');
  }

  return response.json();
};

// Confirm payment with Stripe Elements
export const confirmPayment = async (params: {
  stripe: Stripe;
  elements: any;
  clientSecret: string;
  confirmationData?: any;
}) => {
  const { stripe, elements, clientSecret, confirmationData = {} } = params;

  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    clientSecret,
    confirmParams: {
      return_url: `${window.location.origin}/checkout/success`,
      ...confirmationData,
    },
    redirect: 'if_required',
  });

  if (error) {
    throw error;
  }

  return paymentIntent;
};

// Save payment method for future use
export const savePaymentMethod = async (params: {
  paymentMethodId: string;
  setAsDefault?: boolean;
}) => {
  const response = await fetch('/api/payments/methods', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save payment method');
  }

  return response.json();
};

// Get user's saved payment methods
export const getPaymentMethods = async () => {
  const response = await fetch('/api/payments/methods');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get payment methods');
  }

  return response.json();
};

// Delete a payment method
export const deletePaymentMethod = async (paymentMethodId: number) => {
  const response = await fetch(`/api/payments/methods?id=${paymentMethodId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete payment method');
  }

  return response.json();
};

// Get payment status
export const getPaymentStatus = async (params: {
  paymentIntentId?: string;
  orderId?: number;
}) => {
  const searchParams = new URLSearchParams();
  
  if (params.paymentIntentId) {
    searchParams.set('paymentIntentId', params.paymentIntentId);
  }
  
  if (params.orderId) {
    searchParams.set('orderId', params.orderId.toString());
  }

  const response = await fetch(`/api/payments?${searchParams}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get payment status');
  }

  return response.json();
};

// Format amount for display
export const formatAmount = (amount: number, currency = 'AUD'): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
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

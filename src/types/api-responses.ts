import type { OrderDTO } from "@/lib/api/orders";

/**
 * Payment API Response Types
 */
export interface PaymentData {
  orderId?: number;
  orderIds?: number[];
  riskAssessmentId?: number;
  amount: number;
  currency?: string;
  orderData?: {
    storeId?: string;
    storeGroups?: Array<{
      storeId: string;
      storeName: string;
      items: Array<{
        id: number | string;
        quantity: number;
        price: number;
      }>;
      subtotal: number;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface VerificationStatusResponse {
  status: "pending" | "verified" | "expired";
  expiresAt?: string;
}

export interface VerificationPaymentDataResponse {
  paymentData: PaymentData;
}

export interface VerificationSendResponse {
  success: boolean;
  developmentCode?: string;
  error?: string;
}

export interface VerificationVerifyResponse {
  success: boolean;
  redirectTo?: string;
  error?: string;
}

export interface VerificationResendOTPResponse {
  success: boolean;
  developmentCode?: string;
  error?: string;
}

export interface VerificationSendOTPResponse {
  success: boolean;
  developmentCode?: string;
  error?: string;
}

export interface VerificationVerifyOTPResponse {
  success: boolean;
  paymentData?: PaymentData;
  error?: string;
  message?: string;
}

export interface OrdersResponse {
  orders: OrderDTO[];
  pagination?: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface CreateTransactionRequest {
  paymentIntentId: string;
  orderId: number;
  amount: number;
  currency?: string;
}

export interface CreateTransactionResponse {
  success: boolean;
  message: string;
}

export interface PaymentMethodsResponse {
  paymentMethods: Array<{
    id: number;
    type: string;
    provider: string;
    lastFourDigits?: string | null;
    expiryMonth?: number | null;
    expiryYear?: number | null;
    isDefault: boolean;
    brand?: string;
    funding?: string;
    createdAt: Date | string;
  }>;
}

export interface ProcessPaymentResponse {
  paymentIntentId: string;
  success?: boolean;
}

export interface PaymentErrorResponse {
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

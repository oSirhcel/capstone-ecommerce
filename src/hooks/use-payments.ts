import { useMutation, useQuery } from "@tanstack/react-query";
import {
  processPayment,
  getPaymentStatus,
  savePaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  type ProcessPaymentResponse,
  type PaymentStatus,
  type SavePaymentMethodResponse,
  type GetPaymentMethodsResponse,
  type DeletePaymentMethodResponse,
} from "@/lib/stripe-client";

interface ProcessPaymentParams {
  amount: number;
  currency?: string;
  orderId?: number;
  savePaymentMethod?: boolean;
  orderData?: Record<string, unknown>;
}

interface GetPaymentStatusParams {
  paymentIntentId?: string;
  orderId?: number;
}

interface SavePaymentMethodParams {
  paymentMethodId: string;
  setAsDefault?: boolean;
}

/**
 * Hook for processing a payment (creating payment intent)
 */
export function useProcessPayment() {
  return useMutation<ProcessPaymentResponse, Error, ProcessPaymentParams>({
    mutationFn: processPayment,
  });
}

/**
 * Hook for getting payment status
 */
export function usePaymentStatus(params: GetPaymentStatusParams) {
  return useQuery<PaymentStatus>({
    queryKey: ["payment-status", params.paymentIntentId, params.orderId],
    queryFn: () => getPaymentStatus(params),
    enabled: !!(params.paymentIntentId ?? params.orderId),
  });
}

/**
 * Hook for saving a payment method
 */
export function useSavePaymentMethod() {
  return useMutation<SavePaymentMethodResponse, Error, SavePaymentMethodParams>(
    {
      mutationFn: savePaymentMethod,
    },
  );
}

/**
 * Hook for getting user's saved payment methods
 */
export function usePaymentMethods() {
  return useQuery<GetPaymentMethodsResponse>({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  });
}

/**
 * Hook for deleting a payment method
 */
export function useDeletePaymentMethod() {
  return useMutation<DeletePaymentMethodResponse, Error, number>({
    mutationFn: deletePaymentMethod,
  });
}

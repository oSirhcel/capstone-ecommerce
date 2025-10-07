"use client";

import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, Shield } from "lucide-react";
import { getStripe, processPayment } from "@/lib/stripe-client";
import { toast } from "sonner";

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  orderId?: number;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  onCreateOrder?: () => Promise<number>;
}

function PaymentForm({
  amount,
  currency = "aud",
  orderId,
  onSuccess,
  onError,
  onCreateOrder,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Submit the elements first (required for Stripe Elements v2)
      const { error: submitError } = await elements.submit();

      if (submitError) {
        console.error("Elements submit error:", submitError);
        setPaymentError(
          submitError.message || "Payment form validation failed",
        );
        onError(submitError.message || "Payment form validation failed");
        return;
      }

      // Create order if not provided and callback exists
      let currentOrderId = orderId;
      if (!currentOrderId && onCreateOrder) {
        try {
          currentOrderId = await onCreateOrder();
          console.log("Order created with ID:", currentOrderId);
        } catch (orderError) {
          console.error("Order creation error:", orderError);
          setPaymentError("Failed to create order");
          onError("Failed to create order");
          return;
        }
      }

      // Create payment intent
      const { clientSecret, paymentIntentId } = await processPayment({
        amount,
        currency,
        orderId: currentOrderId,
        savePaymentMethod,
      });

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment confirmation error:", error);
        setPaymentError(error.message || "Payment failed");
        onError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log("Payment succeeded:", paymentIntent);
        toast.success("Payment successful!");
        onSuccess({
          paymentIntent,
          paymentIntentId,
          orderId: currentOrderId,
        });
      } else {
        console.log("Payment status:", paymentIntent?.status);
        setPaymentError("Payment requires additional action");
        onError("Payment requires additional action");
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment processing failed";
      setPaymentError(errorMessage);

      // Pass the actual error object for zero trust handling
      if (error instanceof Error) {
        onError(error);
      } else {
        onError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stripe PaymentElement */}
          <div className="stripe-payment-element">
            <PaymentElement
              options={{
                layout: "tabs",
                paymentMethodOrder: ["card", "au_becs_debit"],
              }}
            />
          </div>

          {/* Save payment method option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="savePaymentMethod"
              checked={savePaymentMethod}
              onCheckedChange={(checked) =>
                setSavePaymentMethod(checked as boolean)
              }
            />
            <Label htmlFor="savePaymentMethod" className="text-sm">
              Save this payment method for future purchases
            </Label>
          </div>

          {/* Error display */}
          {paymentError && (
            <Alert variant="destructive">
              <AlertDescription>{paymentError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Security notice */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-800">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">
              Your payment information is secure and encrypted
            </span>
          </div>
          <p className="mt-1 text-sm text-green-700">
            Powered by Stripe. We never store your card details.
          </p>
        </CardContent>
      </Card>

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay $${amount.toFixed(2)} ${currency.toUpperCase()}`
        )}
      </Button>
    </form>
  );
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't initialize payment intent on mount - wait for form submission
  // This prevents creating unused payment intents

  // Always show the payment form - we'll create the payment intent when needed
  const stripePromise = getStripe();

  const options = {
    mode: "payment" as const,
    amount: Math.round(props.amount * 100), // Convert to cents
    currency: props.currency || "aud",
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "#0070f3",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
}

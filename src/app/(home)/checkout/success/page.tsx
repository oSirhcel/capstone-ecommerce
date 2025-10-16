"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
// Note: We intentionally avoid getPaymentStatus here so we can inspect HTTP status codes
// and implement retry logic if the transaction record is not yet available.
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentDetails {
  transaction: {
    id: number;
    orderId: number;
    amount: number;
    currency: string;
    status: string;
    transactionId: string;
    createdAt: string;
  };
}

export default function CheckoutSuccessPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get("payment_intent");
  const orderId = searchParams.get("order_id");

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let isActive = true;

    const fetchWithRetry = async () => {
      // Wait for authenticated session before calling API to avoid 401
      if (status !== "authenticated") {
        return;
      }
      if (!paymentIntentId && !orderId) {
        setError("No payment or order information found");
        setIsLoading(false);
        return;
      }

      // Build URL to query payment status
      const params = new URLSearchParams();
      if (paymentIntentId) params.set("paymentIntentId", paymentIntentId);
      if (orderId) params.set("orderId", orderId);

      const maxAttempts = 10; // up to ~10 seconds
      const baseDelayMs = 1000;
      let attempt = 0;

      while (isActive && attempt < maxAttempts) {
        try {
          const res = await fetch(`/api/payments?${params.toString()}`, {
            cache: "no-store",
            credentials: "include",
          });

          if (res.ok) {
            const data = (await res.json()) as PaymentDetails;
            if (!isActive) return;
            setPaymentDetails(data);
            setIsLoading(false);
            setError(null);
            return;
          }

          // If transaction not yet created, retry
          if (res.status === 404) {
            attempt += 1;
            setAttempts(attempt);
            await new Promise((r) => setTimeout(r, baseDelayMs));
            continue;
          }

          // Any other error: surface message and stop
          const errJson: unknown = await res
            .json()
            .catch(() => ({ error: "Failed to load payment details" }));
          if (!isActive) return;
          const message =
            (errJson as { error?: string }).error ??
            "Failed to load payment details";
          setError(message);
          setIsLoading(false);
          return;
        } catch (e) {
          console.error("Payment status fetch error:", e);
          // Network or unexpected error: retry a few times
          attempt += 1;
          setAttempts(attempt);
          await new Promise((r) => setTimeout(r, baseDelayMs));
        }
      }

      // After retries, show generic confirmation even without details
      if (!isActive) return;
      setIsLoading(false);
      if (!paymentDetails) {
        setError(null); // do not block UI; render generic confirmation below
      }
    };

    void fetchWithRetry();
    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentIntentId, orderId, status]);

  if (status === "loading") {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <Skeleton className="mx-auto h-8 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Please Sign In</h1>
            <p className="text-muted-foreground mt-2">
              You need to be signed in to view your order details.
            </p>
            <Button asChild className="mt-4">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <Skeleton className="mx-auto h-8 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-2xl font-bold text-red-600">Error</h1>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button asChild className="mt-4">
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatAmount = (amount: number, currency: string) => {
    // Handle potential data issues where amount might be stored incorrectly
    // If amount seems too large (> $10000), it might be stored as dollars instead of cents
    const amountInCents = amount > 100000 ? amount / 100 : amount;

    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountInCents / 100);
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Success Header */}
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="mt-4 text-3xl font-bold">Payment Successful!</h1>
            <p className="text-muted-foreground mt-2">
              Thank you for your order. We&apos;ve received your payment and
              your order is being processed.
            </p>
            {!paymentDetails && (
              <p className="text-muted-foreground mt-2 text-sm">
                Preparing your confirmation
                {attempts > 0 ? ` (attempt ${attempts})` : ""}...
              </p>
            )}
          </div>

          {/* Order Summary */}
          {paymentDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Order Number</span>
                  <Badge variant="outline">
                    #{paymentDetails.transaction.orderId}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Payment Method</span>
                  <span>Credit Card</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Transaction ID</span>
                  <span className="font-mono text-sm">
                    {paymentDetails.transaction.transactionId.slice(-8)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge
                    variant={
                      paymentDetails.transaction.status === "completed"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {paymentDetails.transaction.status === "completed"
                      ? "Paid"
                      : paymentDetails.transaction.status}
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Amount</span>
                  <span>
                    {formatAmount(
                      paymentDetails.transaction.amount,
                      paymentDetails.transaction.currency,
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* What Happens Next */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                What Happens Next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Order Confirmation</h4>
                    <p className="text-muted-foreground text-sm">
                      You&apos;ll receive an email confirmation shortly with
                      your order details.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Order Processing</h4>
                    <p className="text-muted-foreground text-sm">
                      Your order will be processed and prepared for shipping
                      within 1-2 business days.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Shipping Updates</h4>
                    <p className="text-muted-foreground text-sm">
                      You&apos;ll receive tracking information once your order
                      ships.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/account/orders">
                View Order Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button variant="outline" asChild className="flex-1">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>

          {/* Support Information */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h4 className="font-medium text-blue-900">Need Help?</h4>
                <p className="mt-1 text-sm text-blue-700">
                  If you have any questions about your order, please contact our
                  support team.
                </p>
                <Button variant="link" className="mt-2 text-blue-600" asChild>
                  <Link href="/support">Contact Support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

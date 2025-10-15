"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function VerifiedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      router.push("/checkout");
      return;
    }

    processVerifiedPayment();
  }, [token]);

  const processVerifiedPayment = async () => {
    try {
      // Get verification status to retrieve payment data
      const statusResponse = await fetch(
        `/api/verification/status?token=${token}`,
      );

      if (!statusResponse.ok) {
        throw new Error("Failed to verify token");
      }

      const statusData = await statusResponse.json();

      if (statusData.status !== "verified") {
        throw new Error("Verification not completed");
      }

      // Get payment data from verification
      const verifyResponse = await fetch("/api/verification/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, otp: "verified" }), // Already verified, just retrieving data
      });

      if (!verifyResponse.ok) {
        throw new Error("Failed to retrieve payment data");
      }

      const { paymentData } = await verifyResponse.json();

      // Now process the payment with the original payment data
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || "Payment processing failed");
      }

      const result = await paymentResponse.json();

      // Payment successful
      setStatus("success");

      toast.success("Payment verified and processed!", {
        description: "Redirecting to confirmation page...",
      });

      // Redirect to success page
      setTimeout(() => {
        const params = new URLSearchParams();
        params.set("payment_intent", result.paymentIntentId);
        if (paymentData.orderId) {
          params.set("order_id", paymentData.orderId.toString());
        }
        router.push(`/checkout/success?${params.toString()}`);
      }, 2000);
    } catch (error) {
      console.error("Verified payment processing error:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to process verified payment",
      );
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader className="text-center">
              {status === "processing" && (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                    <Loader2 className="text-primary h-12 w-12 animate-spin" />
                  </div>
                  <CardTitle className="text-2xl">Processing Payment</CardTitle>
                  <p className="text-muted-foreground mt-2">
                    Your verification was successful. Processing your payment...
                  </p>
                </>
              )}

              {status === "success" && (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </div>
                  <CardTitle className="text-2xl">
                    Payment Successful!
                  </CardTitle>
                  <p className="text-muted-foreground mt-2">
                    Your payment has been processed successfully
                  </p>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                    <XCircle className="text-destructive h-12 w-12" />
                  </div>
                  <CardTitle className="text-2xl">Payment Failed</CardTitle>
                  <p className="text-destructive mt-2">{errorMessage}</p>
                </>
              )}
            </CardHeader>

            {status === "error" && (
              <CardContent className="text-center">
                <Button asChild className="mt-4">
                  <Link href="/checkout">Return to Checkout</Link>
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function VerifiedPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <Loader2 className="text-primary h-12 w-12 animate-spin" />
        </div>
      }
    >
      <VerifiedContent />
    </Suspense>
  );
}

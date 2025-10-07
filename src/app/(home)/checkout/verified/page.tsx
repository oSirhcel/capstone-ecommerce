"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CheckoutVerifiedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Auto-redirect to checkout after 3 seconds
    const timer = setTimeout(() => {
      setIsRedirecting(true);
      router.push("/checkout");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleContinueToCheckout = () => {
    setIsRedirecting(true);
    router.push("/checkout");
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h1 className="mb-2 text-3xl font-bold text-green-600">
              Email Verified Successfully!
            </h1>
            <p className="text-muted-foreground">
              Your identity has been verified and your transaction can now
              proceed
            </p>
          </div>

          <Card className="border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <ShieldCheck className="h-5 w-5" />
                Verification Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your email has been successfully verified! You can now
                  complete your secure transaction.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">What happens next?</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <span className="text-xs font-bold text-green-600">
                        1
                      </span>
                    </div>
                    <div>
                      <strong>Return to checkout:</strong> You'll be
                      automatically redirected to complete your payment.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <span className="text-xs font-bold text-green-600">
                        2
                      </span>
                    </div>
                    <div>
                      <strong>Complete payment:</strong> Your transaction will
                      now be processed normally.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <span className="text-xs font-bold text-green-600">
                        3
                      </span>
                    </div>
                    <div>
                      <strong>Order confirmation:</strong> You'll receive
                      confirmation once your order is complete.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  Security Notice
                </h3>
                <p className="text-muted-foreground text-sm">
                  This additional verification step helps protect you and other
                  customers from fraudulent transactions. Thank you for your
                  patience and for helping us maintain a secure shopping
                  environment.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button
                  onClick={handleContinueToCheckout}
                  disabled={isRedirecting}
                  className="flex-1"
                >
                  {isRedirecting ? (
                    "Redirecting..."
                  ) : (
                    <>
                      Continue to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/">Continue Shopping</Link>
                </Button>
              </div>

              <div className="text-muted-foreground text-center text-sm">
                You will be automatically redirected in a few seconds...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


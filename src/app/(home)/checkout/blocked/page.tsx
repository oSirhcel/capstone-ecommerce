"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldX, AlertTriangle, Mail, Phone } from "lucide-react";
import Link from "next/link";

function CheckoutBlockedPageContent() {
  const searchParams = useSearchParams();
  const riskScore = searchParams.get("score");
  const riskFactors = searchParams.get("factors")?.split(",") ?? [];
  const supportContact = searchParams.get("support") ?? "support@yourstore.com";

  const getRiskFactorDescription = (factor: string) => {
    const descriptions: Record<string, string> = {
      UNUSUAL_ITEM_COUNT: "High quantity of items",
      EXTREME_ITEM_COUNT: "Extremely high quantity of items",
      BULK_SINGLE_ITEM: "Large quantity of single item",
      EXTREME_BULK_SINGLE: "Extremely large quantity of single item",
      HIGH_AMOUNT: "High transaction amount",
      MULTIPLE_STORES: "Items from multiple stores",
      ANONYMOUS_USER: "Unauthenticated transaction",
      SUSPICIOUS_USER_AGENT: "Suspicious browser/device",
      NEW_PAYMENT_METHOD: "New payment method",
      GEOGRAPHIC_MISMATCH: "International shipping",
    };
    return descriptions[factor] ?? factor;
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <ShieldX className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h1 className="mb-2 text-3xl font-bold text-red-600">
              Transaction Blocked
            </h1>
            <p className="text-muted-foreground">
              Your transaction has been blocked for security reasons
            </p>
          </div>

          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Security Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  This transaction has been flagged as high-risk by our fraud
                  prevention system and cannot be processed at this time.
                </AlertDescription>
              </Alert>

              {riskScore && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 font-semibold">
                    Risk Assessment Details
                  </h3>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Risk Score:{" "}
                    <span className="font-mono font-bold text-red-600">
                      {riskScore}/100
                    </span>
                  </p>

                  {riskFactors.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">
                        Risk Factors Detected:
                      </p>
                      <ul className="space-y-1 text-sm">
                        {riskFactors.map((factor, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            {getRiskFactorDescription(factor)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold">What can you do?</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <strong>Reduce your order size:</strong> Try purchasing
                      fewer items or splitting your order into smaller
                      transactions.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <div>
                      <strong>Contact our support team:</strong> If you believe
                      this is an error, please reach out to us for assistance.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <div>
                      <strong>Try again later:</strong> Our security systems may
                      allow the transaction after some time.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <Mail className="h-4 w-4" />
                  Need Help?
                </h3>
                <p className="text-muted-foreground mb-3 text-sm">
                  Our support team is here to help you complete your purchase
                  safely.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${supportContact}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email Support
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="tel:+1234567890">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Support
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href="/cart">Return to Cart</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/">Continue Shopping</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutBlockedPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background min-h-screen">
          <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 text-center">
                <ShieldX className="mx-auto mb-4 h-16 w-16 text-red-500" />
                <h1 className="mb-2 text-3xl font-bold text-red-600">
                  Transaction Blocked
                </h1>
                <p className="text-muted-foreground">
                  Your transaction has been blocked for security reasons
                </p>
              </div>
              <Card className="border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Security Alert
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 w-full rounded bg-gray-200" />
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      }
    >
      <CheckoutBlockedPageContent />
    </Suspense>
  );
}


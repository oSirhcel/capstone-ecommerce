"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function CheckoutVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const verificationToken = searchParams.get("token");
  const riskScore = searchParams.get("score");
  const riskFactors = searchParams.get("factors")?.split(",") || [];
  const userEmail = searchParams.get("email");

  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [error, setError] = useState("");

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

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
    return descriptions[factor] || factor;
  };

  const handleSendVerificationEmail = async () => {
    if (!verificationToken) return;

    try {
      setIsVerifying(true);
      setError("");

      // Call API to send verification email
      const response = await fetch("/api/verification/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: verificationToken,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setEmailSent(true);

        // In development, show the verification code
        if (result.developmentCode && process.env.NODE_ENV === "development") {
          console.log("Development verification code:", result.developmentCode);
          // Auto-fill the code in development
          setVerificationCode(result.developmentCode);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to send verification email");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || !verificationToken) return;

    try {
      setIsVerifying(true);
      setError("");

      // Call API to verify code and process payment
      const response = await fetch("/api/verification/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: verificationToken,
          code: verificationCode,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to verified page
        router.push(result.redirectTo || "/checkout/verified");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Invalid verification code");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!verificationToken) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
            <h1 className="mb-2 text-2xl font-bold">
              Invalid Verification Link
            </h1>
            <p className="text-muted-foreground mb-4">
              This verification link is invalid or has expired.
            </p>
            <Button asChild>
              <Link href="/checkout">Return to Checkout</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (timeLeft <= 0) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Clock className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h1 className="mb-2 text-2xl font-bold text-red-600">
              Verification Expired
            </h1>
            <p className="text-muted-foreground mb-4">
              Your verification session has expired. Please start the checkout
              process again.
            </p>
            <Button asChild>
              <Link href="/checkout">Return to Checkout</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <ShieldCheck className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
            <h1 className="mb-2 text-3xl font-bold text-yellow-600">
              Email Verification Required
            </h1>
            <p className="text-muted-foreground">
              Additional verification is needed to complete your transaction
            </p>
          </div>

          <Card className="border-yellow-200">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Mail className="h-5 w-5" />
                Security Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  This transaction has been flagged for additional security
                  verification. Please verify your email address to proceed with
                  the payment.
                </AlertDescription>
              </Alert>

              {/* Time remaining */}
              <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Time remaining: {formatTime(timeLeft)}</span>
              </div>

              {riskScore && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 font-semibold">
                    Risk Assessment Details
                  </h3>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Risk Score:{" "}
                    <span className="font-mono font-bold text-yellow-600">
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
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                            {getRiskFactorDescription(factor)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!emailSent ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h3 className="mb-2 flex items-center gap-2 font-semibold">
                      <Mail className="h-4 w-4" />
                      Email Verification
                    </h3>
                    <p className="text-muted-foreground mb-3 text-sm">
                      We'll send a verification code to:{" "}
                      <strong>{userEmail}</strong>
                    </p>
                    <Button
                      onClick={handleSendVerificationEmail}
                      disabled={isVerifying}
                      className="w-full"
                    >
                      {isVerifying ? "Sending..." : "Send Verification Email"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Verification email sent to {userEmail}. Please check your
                      inbox and enter the code below.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      className="text-center font-mono text-lg"
                    />
                  </div>

                  <Button
                    onClick={handleVerifyCode}
                    disabled={isVerifying || verificationCode.length !== 6}
                    className="w-full"
                  >
                    {isVerifying ? "Verifying..." : "Verify & Complete Payment"}
                  </Button>

                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSendVerificationEmail}
                      disabled={isVerifying}
                    >
                      Resend verification email
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button variant="outline" asChild className="flex-1">
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

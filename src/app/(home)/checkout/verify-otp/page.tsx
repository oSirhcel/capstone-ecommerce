"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Shield, Mail, Clock, RefreshCcw } from "lucide-react";
import type { VerificationVerifyOTPResponse, VerificationResendOTPResponse } from "@/types/api-responses";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds

  const token = searchParams.get("token");
  const riskScore = searchParams.get("score");
  const userEmail = searchParams.get("email");

  useEffect(() => {
    if (!token) {
      router.push("/checkout");
      return;
    }

    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [token, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    if (!token || !otp) {
      setError("Please enter the verification code");
      return;
    }

    if (otp.length !== 6) {
      setError("Verification code must be 6 digits");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/verification/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, otp }),
      });

      const data = await response.json() as VerificationVerifyOTPResponse;

      if (!response.ok || !data.success) {
        setError(data.error ?? "Verification failed");
        return;
      }

      // Verification successful - redirect to verified page
      toast.success("Verification successful!", {
        description: "Processing your payment...",
      });

      // Redirect to payment processing with verified token
      router.push(`/checkout/verified?token=${token}`);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Failed to verify code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!token) return;

    setIsResending(true);
    setError(null);

    try {
      const response = await fetch("/api/verification/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json() as VerificationResendOTPResponse;

      if (!response.ok || !data.success) {
        toast.error("Failed to resend code", {
          description: data.error ?? "Please try again",
        });
        return;
      }

      toast.success("Verification code resent", {
        description: "Check your email for the new code",
      });

      // Reset timer
      setTimeLeft(600);
      setOtp("");
    } catch (err) {
      console.error("Resend error:", err);
      toast.error("Failed to resend code", {
        description: "Please try again later",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(numericValue);
    setError(null);
  };

  if (!token) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Shield className="text-primary h-8 w-8" />
              </div>
              <CardTitle className="text-2xl">Security Verification</CardTitle>
              <CardDescription>
                Your transaction has been flagged for additional security
                verification
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Risk Score Display */}
              {riskScore && (
                <Alert>
                  <AlertDescription>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">
                        Risk Score: <strong>{riskScore}</strong>
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Info */}
              <div className="bg-muted flex items-start gap-3 rounded-lg p-4">
                <Mail className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Verification Email Sent</p>
                  <p className="text-muted-foreground text-sm">
                    We sent a 6-digit code to{" "}
                    <strong>{userEmail ?? "your email"}</strong>
                  </p>
                </div>
              </div>

              {/* Timer */}
              <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  Code expires in: <strong>{formatTime(timeLeft)}</strong>
                </span>
              </div>

              {/* OTP Input */}
              <div className="space-y-2">
                <Label htmlFor="otp">Enter Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  disabled={timeLeft === 0}
                />
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={isVerifying || otp.length !== 6 || timeLeft === 0}
                className="w-full"
                size="lg"
              >
                {isVerifying ? "Verifying..." : "Verify & Continue"}
              </Button>

              {/* Resend Button */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={handleResend}
                  disabled={isResending || timeLeft === 0}
                  className="text-sm"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {isResending ? "Sending..." : "Resend Code"}
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-muted-foreground bg-muted rounded-lg p-4 text-center text-sm">
                <p>
                  <strong>Security Notice:</strong> This verification helps
                  protect your account from fraudulent transactions.
                </p>
                <p className="mt-2">
                  Didn&apos;t request this? Contact{" "}
                  <a href="mailto:support@yourstore.com" className="underline">
                    support
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Shield className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">Loading verification...</p>
          </div>
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}

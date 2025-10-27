"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Determine error message based on error type
  const getErrorContent = () => {
    switch (error) {
      case "SessionExpired":
      case "SessionRevoked":
        return {
          icon: <ShieldX className="h-8 w-8 text-red-600" />,
          title: "Session Terminated",
          message: "Your session has been terminated for security reasons.",
          description:
            "This may occur if you signed out from another device or if your session expired for security purposes.",
        };
      case "Configuration":
        return {
          icon: <AlertTriangle className="h-8 w-8 text-yellow-600" />,
          title: "Configuration Error",
          message: "There is a problem with the server configuration.",
          description: "Please contact support if this problem persists.",
        };
      case "AccessDenied":
        return {
          icon: <ShieldX className="h-8 w-8 text-orange-600" />,
          title: "Access Denied",
          message: "You do not have permission to access this resource.",
          description:
            "Please contact an administrator if you believe this is an error.",
        };
      default:
        return {
          icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
          title: "Authentication Error",
          message: "An error occurred during authentication.",
          description:
            "Please try signing in again or contact support if the problem persists.",
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            {errorContent.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-medium text-red-800">
                  {errorContent.message}
                </h3>
                <p className="text-sm text-red-700">
                  {errorContent.description}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/auth/signin">Sign In Again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>

          <div className="pt-4 text-center">
            <p className="text-muted-foreground text-xs">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

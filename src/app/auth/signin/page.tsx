"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SignInContent } from "@/components/auth/signin-content";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("message");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="absolute top-4 left-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignInContent
            onSuccessRedirect="/"
            successMessage={successMessage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

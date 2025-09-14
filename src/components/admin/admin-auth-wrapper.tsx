"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      // Not authenticated, redirect to sign in
      router.push("/auth/signin");
      return;
    }

    if (session.user?.userType !== "admin") {
      // Not an admin, redirect to unauthorized
      router.push("/unauthorized");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.userType !== "admin") {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}

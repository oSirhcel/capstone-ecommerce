import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldXIcon } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <ShieldXIcon className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            You don&apos;t have permission to access this page.
          </p>
        </div>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">Return to Home</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/auth/signin">Sign In as Different User</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

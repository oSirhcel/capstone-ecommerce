"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center space-x-4">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">
          {session.user.name ?? session.user.email}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Link href="/auth/signin">
        <Button variant="outline" size="sm">
          Sign In
        </Button>
      </Link>
      <Link href="/auth/signup">
        <Button size="sm">Sign Up</Button>
      </Link>
    </div>
  );
}


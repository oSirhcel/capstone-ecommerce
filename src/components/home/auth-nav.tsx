"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { SignInContent } from "@/components/auth/signin-content";
import { SignUpContent } from "@/components/auth/signup-content";

export function AuthNav() {
  const { data: session, status } = useSession();
  const [authView, setAuthView] = useState<"signin" | "signup">("signin");

  if (status === "loading") {
    return (
      <div className="flex items-center space-x-4">
        <div className="size-8 animate-pulse rounded-full bg-gray-200" />
      </div>
    );
  }

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 rounded-full">
            <Avatar>
              <AvatarImage src={session.user.image ?? ""} />
              <AvatarFallback>
                {session.user.name?.charAt(0) ?? session.user.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Open user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56" sideOffset={10}>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm leading-none font-medium">
                {session.user.name ?? session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/account">My Account</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/orders">Orders</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center">
                  My Store
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm">Sign In</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Sign In</DialogTitle>
            <DialogDescription className="sr-only">
              Welcome back! Please sign in to your account
            </DialogDescription>
          </DialogHeader>
          {authView === "signin" ? (
            <SignInContent
              onSuccessRedirect="/"
              onToggleSignUp={() => setAuthView("signup")}
            />
          ) : (
            <SignUpContent
              onSuccessRedirect="/"
              onToggleSignIn={() => setAuthView("signin")}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { BotIcon, StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { useProfileQuery } from "@/hooks/admin/use-profile-query";
import { useRightSidebar } from "@/contexts/right-sidebar-context";

export function AdminHeader() {
  const { data: profile, isLoading } = useProfileQuery();
  const { toggle: toggleRightSidebar } = useRightSidebar();

  if (isLoading) {
    return (
      <header className="border-b bg-white px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger disabled />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-12 w-40 rounded-md" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-white px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={toggleRightSidebar}
          >
            <BotIcon className="size-6" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="default" variant="ghost" className="py-6">
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {profile?.store?.name}
                  </span>
                </div>
                <div className="text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-950">
                  <StoreIcon className="size-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm leading-none font-medium">
                    {profile?.user.username}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profile?.store?.slug && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/stores/${profile.store.slug}`}>Store</Link>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuItem asChild>
                <Link href={`/account`}>My Account</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => signOut()}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

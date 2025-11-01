"use client";

import { MenuIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "../ui/input";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CartButton } from "../cart/cart-button";
import { AuthNav } from "./auth-nav";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const [search, setSearch] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b px-4 backdrop-blur md:px-6">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-text.svg"
              alt="Logo"
              width={100}
              height={100}
              sizes="100vw"
            />
            <span className="sr-only">buyio</span>
          </Link>
          <nav className="hidden gap-1 md:flex">
            <Link
              href="/stores"
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted",
                pathname === "/stores" || pathname.startsWith("/stores/")
                  ? "text-primary bg-primary/10 font-semibold"
                  : "",
              )}
            >
              Stores
            </Link>
            <Link
              href="/categories"
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted",
                pathname === "/categories" ||
                  pathname.startsWith("/categories/")
                  ? "text-primary bg-primary/10 font-semibold"
                  : "",
              )}
            >
              Categories
            </Link>
            <Link
              href="/products"
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted",
                (pathname === "/products" ||
                  pathname.startsWith("/products/")) &&
                  pathname !== "/products/new-arrivals" &&
                  pathname !== "/products/deals" &&
                  !pathname.startsWith("/products/new-arrivals/") &&
                  !pathname.startsWith("/products/deals/")
                  ? "text-primary bg-primary/10 font-semibold"
                  : "",
              )}
            >
              All Products
            </Link>
            <Link
              href="/products/new-arrivals"
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted",
                pathname === "/products/new-arrivals" ||
                  pathname.startsWith("/products/new-arrivals/")
                  ? "text-primary bg-primary/10 font-semibold"
                  : "",
              )}
            >
              New Arrivals
            </Link>
            <Link
              href="/products/deals"
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted",
                pathname === "/products/deals" ||
                  pathname.startsWith("/products/deals/")
                  ? "text-primary bg-primary/10 font-semibold"
                  : "",
              )}
            >
              Deals
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden w-full max-w-sm lg:flex">
            <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search products, stores, categories..."
                className="bg-background w-full rounded-md border pl-8 md:w-[300px] lg:w-[400px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          </div>
          <CartButton />
          <AuthNav />
          <Button variant="ghost" size="icon" className="md:hidden">
            <SearchIcon className="size-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <MenuIcon className="size-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

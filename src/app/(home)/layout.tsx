import {
  MenuIcon,
  SearchIcon,
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import Image from "next/image";
import Link from "next/link";
import { AuthNav } from "@/components/auth-nav";
import { CartButton } from "@/components/cart/cart-button";
import { CartProvider } from "@/contexts/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { HeaderSearchBar } from "@/components/ui/headersearch";

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CartDrawer />
    </CartProvider>
  );
};

export default HomeLayout;

const Header = () => {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/placeholder.svg?height=32&width=32"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="hidden font-bold sm:inline-block">LOGO</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link
              href="/categories"
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/products"
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              All Products
            </Link>
            <Link
              href="/stores"
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              Stores
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              Trending
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              New Arrivals
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              Deals
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden w-full max-w-sm lg:flex">
            <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <HeaderSearchBar />
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
};

const Footer = () => {
  return (
    <footer className="bg-background w-full border-t">
      <div className="container mx-auto flex flex-col gap-8 py-8 md:py-12 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image
                src="/placeholder.svg?height=32&width=32"
                alt="Logo"
                width={32}
                height={32}
                className="rounded-md"
              />
              <span className="font-bold">Buyio</span>
            </div>
            <p className="text-muted-foreground text-sm">
              The marketplace for unique products from independent creators.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <FacebookIcon />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <TwitterIcon />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <InstagramIcon />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Shop</h4>
            <ul className="text-muted-foreground grid gap-2 text-sm">
              <li>
                <Link href="#" className="hover:text-foreground">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Featured Stores
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Deals & Discounts
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Sell</h4>
            <ul className="text-muted-foreground grid gap-2 text-sm">
              <li>
                <Link href="#" className="hover:text-foreground">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Seller Dashboard
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Seller Guidelines
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Success Stories
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Seller Resources
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Company</h4>
            <ul className="text-muted-foreground grid gap-2 text-sm">
              <li>
                <Link href="#" className="hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Press
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Help</h4>
            <ul className="text-muted-foreground grid gap-2 text-sm">
              <li>
                <Link href="#" className="hover:text-foreground">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            © 2025 Buyio. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

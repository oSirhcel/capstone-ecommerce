"use client";

import { StoreCard } from "@/components/home/store-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NewArrivals } from "@/components/home/new-arrivals";
import { fetchFeaturedStores } from "@/lib/api/stores";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Search,
  TrendingUp,
  Sparkles,
  Store,
  ArrowRight,
  Package,
  Shield,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryCard } from "@/components/home/category-card";
import { fetchCategories } from "@/lib/api/categories";
import {
  fetchFeaturedProducts,
  transformProductToCardProps,
} from "@/lib/api/products";
import { ProductCard } from "@/components/home/product-card";

export default function Home() {
  // Fetch featured stores using React Query
  const {
    data: featuredStores,
    isLoading: isLoadingStores,
    error: storesError,
  } = useQuery({
    queryKey: ["featured-stores"],
    queryFn: () => fetchFeaturedStores(6),
  });

  const {
    data: categories,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const featuredProducts = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => fetchFeaturedProducts(5),
  });

  return (
    <>
      <section className="from-background to-muted/20 flex w-full bg-gradient-to-b py-16 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center space-y-8 text-center">
            <Badge
              variant="secondary"
              className="px-4 py-1.5 text-sm font-medium"
            >
              <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
              Join 50,000+ creators and shoppers
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Discover unique products from{" "}
              <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
                independent creators
              </span>
            </h1>

            <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
              Shop thousands of handcrafted products, digital goods, and unique
              finds from passionate creators worldwide.
            </p>

            <div className="w-full max-w-2xl">
              <div className="group relative">
                <Search className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transition-colors" />
                <Input
                  type="search"
                  placeholder="Search for products, stores, or categories..."
                  className="focus-visible:border-primary h-14 rounded-full border-2 pr-4 pl-12 text-base shadow-sm transition-all focus-visible:shadow-md"
                />
                <Button
                  size="sm"
                  className="absolute top-1/2 right-2 h-10 -translate-y-1/2 rounded-full px-6"
                >
                  Search
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-muted-foreground text-sm">Popular:</span>
                {[
                  "Digital Art",
                  "Handmade Jewelry",
                  "Home Decor",
                  "Vintage",
                ].map((term) => (
                  <Button
                    key={term}
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full text-xs"
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-8 pt-4 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Fast Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Browse by Category
              </h2>
              <p className="text-muted-foreground mt-1">
                Find exactly what you&apos;re looking for
              </p>
            </div>
            <Button
              variant="ghost"
              className="hidden items-center gap-2 md:flex"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-3">
            {categories?.categories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                count={category.count}
                image={category.image}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 w-full py-16 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Store className="text-primary h-5 w-5" />
                <Badge variant="secondary" className="text-xs">
                  Featured
                </Badge>
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                Top Stores This Week
              </h2>
              <p className="text-muted-foreground mt-1">
                Discover our most popular and innovative sellers
              </p>
            </div>
            <Button
              variant="outline"
              className="hidden items-center gap-2 bg-transparent md:flex"
            >
              Explore Stores
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingStores ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="space-y-3">
                  <Skeleton className="aspect-[3/2] w-full rounded-lg" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </div>
              ))
            ) : storesError ? (
              // Error state
              <div className="col-span-full py-12 text-center">
                <p className="text-muted-foreground">
                  Failed to load featured stores
                </p>
              </div>
            ) : featuredStores && featuredStores.length > 0 ? (
              // Real store data
              featuredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  name={store.name}
                  productCount={store.productCount}
                  averageRating={store.averageRating}
                  slug={store.slug}
                  image={"/placeholder.svg"}
                />
              ))
            ) : (
              // Empty state
              <div className="col-span-full py-12 text-center">
                <p className="text-muted-foreground">
                  No featured stores available
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <SparklesIcon className="text-primary h-5 w-5" />
                <Badge variant="secondary" className="text-xs">
                  Curated
                </Badge>
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                Featured Products
              </h2>
              <p className="text-muted-foreground mt-1">
                Handpicked by our team
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
            {featuredProducts.data?.products.map((product) => (
              <ProductCard
                key={product.id}
                {...transformProductToCardProps(product)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="from-primary/5 via-primary/10 to-background w-full bg-gradient-to-br py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-6 text-center">
              <Badge variant="outline" className="px-4 py-1.5">
                For Creators
              </Badge>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Turn your passion into profit
              </h2>

              <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed">
                Join thousands of creators earning a living doing what they
                love. Set up your store in minutes and reach customers
                worldwide.
              </p>

              <div className="grid grid-cols-1 gap-6 pt-8 text-left md:grid-cols-3">
                <div className="space-y-2">
                  <div className="bg-primary/10 mb-3 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Zap className="text-primary h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">Quick Setup</h3>
                  <p className="text-muted-foreground text-sm">
                    Launch your store in under 5 minutes
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="bg-primary/10 mb-3 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Store className="text-primary h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">Global Reach</h3>
                  <p className="text-muted-foreground text-sm">
                    Access to thousands of buyers
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="bg-primary/10 mb-3 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Shield className="text-primary h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">Secure & Simple</h3>
                  <p className="text-muted-foreground text-sm">
                    Low fees, fast payouts
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 pt-6 sm:flex-row">
                <Button size="lg" className="px-8">
                  Start Selling Today
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent px-8"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-20">
        <div>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                New Arrivals
              </h2>
              <p className="text-muted-foreground mt-1">
                Fresh products added daily
              </p>
            </div>
            <Button
              variant="outline"
              className="hidden items-center gap-2 bg-transparent md:flex"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <NewArrivals limit={6} />
        </div>
      </section>

      <section className="bg-muted/50 w-full py-16 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Stay in the loop
            </h2>
            <p className="text-muted-foreground">
              Get updates on new products, exclusive deals, and creator stories
              delivered to your inbox.
            </p>

            <form className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                placeholder="Enter your email"
                className="h-11 flex-1"
                required
              />
              <Button type="submit" className="h-11 px-8">
                Subscribe
              </Button>
            </form>

            <p className="text-muted-foreground text-xs">
              Join 50,000+ subscribers. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

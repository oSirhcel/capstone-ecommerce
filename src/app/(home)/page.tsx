import { StoreCard } from "@/components/store-card";
import { TrendingProducts } from "@/components/trending-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckIcon } from "lucide-react";
import Image from "next/image";

import { NewArrivals } from "@/components/new-arrivals";

export default function Home() {
  // Mock store data for now (can be replaced with real API later)
  const storeCardMockData = [
    {
      name: "Artisan Crafts",
      image: "/logo1.svg",
      category: "Handmade",
      productCount: 124,
      rating: 4.8,
    },
    {
      name: "Digital Designs",
      image: "/logo4.svg",
      category: "Digital Products",
      productCount: 87,
      rating: 4.9,
    },
    {
      name: "Eco Essentials",
      image: "/logo3.svg",
      category: "Sustainable",
      productCount: 56,
      rating: 4.7,
    },
  ];

  return (
    <>
      {/* Hero Section  */}
      <section className="w-full bg-gradient-to-r from-violet-50 to-indigo-50 py-12 md:py-24 lg:py-32 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Discover unique products from independent creators
                </h1>
                <p className="text-muted-foreground max-w-[600px] md:text-xl">
                  Shop thousands of handcrafted products from passionate
                  creators and innovative brands all in one place.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" className="px-8">
                  Explore Marketplace
                </Button>
                <Button variant="outline" size="lg">
                  Open Your Shop
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <Image
                src="/placeholder.svg?height=550&width=550"
                alt="Hero Image"
                width={550}
                height={550}
                className="rounded-xl object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stores Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="bg-muted inline-block rounded-lg px-3 py-1 text-sm">
                Featured Stores
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Discover Top Shops
              </h2>
              <p className="text-muted-foreground max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Explore our curated selection of the most popular and innovative
                stores on our platform.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
            {storeCardMockData.map((store, index) => (
              <StoreCard
                key={index}
                name={store.name}
                image={store.image}
                category={store.category}
                productCount={store.productCount}
                rating={store.rating}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products Section */}
      <section className="bg-muted/50 w-full py-12 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="bg-primary/10 text-primary inline-block rounded-lg px-3 py-1 text-sm">
                Trending Now
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                What&apos;s Hot Right Now
              </h2>
              <p className="text-muted-foreground max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Discover the products that are trending across our marketplace.
              </p>
            </div>
          </div>
          <div className="py-8">
            <TrendingProducts />
          </div>
        </div>
      </section>

      {/* Start Selling Section */}
      <section className="bg-primary-foreground w-full py-12 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Start selling your products today
                </h2>
                <p className="text-muted-foreground max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join thousands of creators and entrepreneurs who are making a
                  living doing what they love.
                </p>
              </div>
              <ul className="grid gap-2 py-4">
                <li className="flex items-center gap-2">
                  <CheckIcon className="text-primary h-5 w-5" />
                  <span>Set up your store in minutes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className="text-primary h-5 w-5" />
                  <span>Reach thousands of potential customers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className="text-primary h-5 w-5" />
                  <span>Powerful tools to grow your business</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className="text-primary h-5 w-5" />
                  <span>Low fees and fast payouts</span>
                </li>
              </ul>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" className="px-8">
                  Start Selling
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <Image
                src="/placeholder.svg?height=550&width=550"
                alt="Seller Dashboard"
                width={550}
                height={550}
                className="rounded-xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                New Arrivals
              </h2>
              <p className="text-muted-foreground max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Check out the latest products added to our marketplace.
              </p>
            </div>
          </div>
          <NewArrivals limit={6} />
          <div className="flex justify-center">
            <Button variant="outline" size="lg">
              View All New Arrivals
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}

      <section className="bg-primary text-primary-foreground w-full py-12 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Join Our Community
              </h2>
              <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Subscribe to our newsletter to get updates on new products,
                special offers, and more.
              </p>
            </div>
            <div className="w-full max-w-md space-y-2">
              <form className="flex space-x-2">
                <Input
                  className="bg-primary-foreground text-primary-foreground max-w-lg flex-1"
                  placeholder="Enter your email"
                  type="email"
                  required
                />
                <Button type="submit" variant="secondary">
                  Subscribe
                </Button>
              </form>
              <p className="text-primary-foreground/80 text-xs">
                By subscribing, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

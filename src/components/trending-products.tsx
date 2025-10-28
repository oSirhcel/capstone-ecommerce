"use client";

import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import {
  fetchProducts,
  type Product,
  getPrimaryImageUrl,
} from "@/lib/api/products";

// Transform API Product to ProductCard props
function transformProductToCardProps(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: (product.price ?? 0) / 100, // Convert from cents to dollars
    image: getPrimaryImageUrl(product),
    rating: product.rating, // Use actual rating from reviews
    reviewCount: product.reviewCount, // Include review count
    store: product.store?.name ?? "Unknown Store",
    category: product.category?.name ?? "Uncategorized",
  };
}

export function TrendingProducts() {
  const {
    data: allProducts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", { limit: 50 }],
    queryFn: () => fetchProducts({ limit: 50 }),
    select: (response) =>
      response.products.map((p) => transformProductToCardProps(p)),
  });

  // Filter products by category for different tabs
  const trendingProducts = {
    all: allProducts,
    digital: allProducts.filter(
      (p) =>
        p.category.toLowerCase().includes("electronic") ||
        p.category.toLowerCase().includes("digital"),
    ),
    handmade: allProducts.filter(
      (p) =>
        p.category.toLowerCase().includes("handmade") ||
        p.category.toLowerCase().includes("craft"),
    ),
    home: allProducts.filter(
      (p) =>
        p.category.toLowerCase().includes("home") ||
        p.category.toLowerCase().includes("garden"),
    ),
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 py-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <ProductCardSkeleton key={`trending-skel-${idx}`} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-red-600">
          Error: {error instanceof Error ? error.message : String(error)}
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="all">
      <div className="flex justify-center">
        <TabsList className="mb-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="digital">Digital</TabsTrigger>
          <TabsTrigger value="handmade">Handmade</TabsTrigger>
          <TabsTrigger value="home">Home & Living</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="all" className="mt-0">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {trendingProducts.all.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="digital" className="mt-0">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trendingProducts.digital.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="handmade" className="mt-0">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trendingProducts.handmade.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="home" className="mt-0">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trendingProducts.home.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

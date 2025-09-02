"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/product-card";
import {
  fetchProducts,
  type Product,
  getPrimaryImageUrl,
} from "@/lib/api/products";

// Transform API Product to ProductCard props
function transformProductToCardProps(product: Product) {
  return {
    id: product.id,
    name: product.name,
    price: product.price / 100, // Convert from cents to dollars
    image: getPrimaryImageUrl(product),
    rating: 4.5, // TODO: Add rating calculation when reviews are implemented
    store: product.store?.name ?? "Unknown Store",
    category: product.category?.name ?? "Uncategorized",
  };
}

export function TrendingProducts() {
  const [allProducts, setAllProducts] = useState<
    ReturnType<typeof transformProductToCardProps>[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all products
        const response = await fetchProducts({ limit: 50 });
        const transformedProducts = response.products.map(
          transformProductToCardProps,
        );
        setAllProducts(transformedProducts);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load products",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-red-600">Error: {error}</div>
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

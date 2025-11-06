"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/home/product-card";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchStoreProducts, type StoreProduct } from "@/lib/api/stores";

interface StoreProductsProps {
  slug: string;
}

// Transform store product to ProductCard props
function transformStoreProduct(product: StoreProduct) {
  return {
    id: product.id,
    slug: product.slug!,
    name: product.name,
    price: (product.price ?? 0) / 100, // Convert cents to dollars
    image:
      product.images.find((img) => img.isPrimary)?.imageUrl ??
      product.images[0]?.imageUrl ??
      "/placeholder.svg",
    rating: 0, // TODO: Calculate from reviews
    store: product.store.name,
    category: product.category?.name ?? "Uncategorized",
  };
}

export function StoreProducts({ slug }: StoreProductsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all products to get all categories (without filtering)
  const { data: allProductsData } = useQuery({
    queryKey: ["store-products-all", slug],
    queryFn: () =>
      fetchStoreProducts(slug, {
        page: 1,
        limit: 1000, // Get all products to extract categories
      }),
    enabled: !!slug,
  });

  // Fetch filtered products for display
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "store-products-filtered",
      slug,
      selectedCategory,
      searchQuery,
      sortBy,
    ],
    queryFn: () =>
      fetchStoreProducts(slug, {
        page: 1,
        limit: 100,
        category: selectedCategory === "all" ? undefined : selectedCategory,
        search: searchQuery || undefined,
        sort: sortBy,
      }),
    enabled: !!slug,
  });

  const products = productsData?.products ?? [];

  // Extract unique categories from ALL products (not filtered ones)
  const categories = Array.from(
    new Set(
      (allProductsData?.products ?? [])
        .map((p) => p.category?.name)
        .filter((name): name is string => name !== null && name !== undefined),
    ),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Products {isLoading ? "" : `(${products.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Tabs - Only show if more than 1 category */}
          {categories.length > 1 && (
            <Tabs
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="w-full"
            >
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* Sort */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {isLoading ? "Loading..." : `Showing ${products.length} products`}
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {error ? (
          <div className="py-12 text-center">
            <p className="text-red-500">
              Error:{" "}
              {error instanceof Error
                ? error.message
                : "Failed to load products"}
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="mb-2 aspect-square rounded-lg bg-gray-200" />
                <div className="mb-2 h-4 rounded bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                {...transformStoreProduct(product)}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

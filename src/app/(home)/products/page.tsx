"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import {
  fetchProducts,
  type Product,
  getPrimaryImageUrl,
} from "@/lib/api/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, FilterIcon } from "lucide-react";

// Interface for search API response
interface SearchResult {
  products: Product[];
  stores: Array<{
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    createdAt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  query: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const PRODUCTS_PER_PAGE = 20;

// Transform API Product to ProductCard props
function transformProductToCardProps(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price / 100, // Convert from cents to dollars
    image: getPrimaryImageUrl(product),
    rating: 4.5, // TODO: Add rating calculation when reviews are implemented
    store: product.store?.name ?? "Unknown Store",
    category: product.category?.name ?? "Uncategorized",
  };
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const currentPage = parseInt(searchParams.get("page") || "1");

  const searchQuery = searchParams.get("search");
  const isSearching = Boolean(searchQuery?.trim());

  // Function to fetch search results
  const fetchSearchResults = async (): Promise<SearchResult> => {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(searchQuery!)}&type=products&page=${currentPage}&limit=${PRODUCTS_PER_PAGE}`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch search results");
    }
    return response.json();
  };

  const { data, isLoading, error } = useQuery({
    queryKey: [
      isSearching ? "search-products" : "products",
      {
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
        search: searchQuery,
      },
    ],
    queryFn: () =>
      isSearching
        ? fetchSearchResults()
        : fetchProducts({
            page: currentPage,
            limit: PRODUCTS_PER_PAGE,
          }),
  });

  const products = data?.products || [];
  const pagination = isSearching
    ? {
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
        total: data?.products?.length || 0,
        totalPages: Math.ceil(
          (data?.products?.length || 0) / PRODUCTS_PER_PAGE,
        ),
      }
    : data?.pagination || {
        page: 1,
        limit: PRODUCTS_PER_PAGE,
        total: 0,
        totalPages: 1,
      };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // Reset to first page on new search
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchTerm("");
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            All Products
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover all the amazing products available in our marketplace.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex max-w-md flex-1 gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button type="submit">Search</Button>
            {searchParams.get("search") && (
              <Button variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            )}
          </form>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pagination.total} products
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-6">
          {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, idx) => (
                <ProductCardSkeleton key={`product-skeleton-${idx}`} />
              ))}
            </div>
          )}

          {error && !isLoading && (
            <div className="py-12 text-center">
              <div className="font-medium text-red-600">
                Failed to load products
              </div>
              <p className="mt-2 text-gray-500">
                Please try again later or contact support if the problem
                persists.
              </p>
            </div>
          )}

          {!isLoading && !error && products.length === 0 && (
            <div className="py-12 text-center">
              <div className="font-medium text-gray-500">
                {searchParams.get("search")
                  ? "No products found"
                  : "No products available"}
              </div>
              <p className="mt-2 text-gray-400">
                {searchParams.get("search")
                  ? "Try adjusting your search terms or browse all products."
                  : "Check back later for new products."}
              </p>
              {searchParams.get("search") && (
                <Button
                  variant="outline"
                  onClick={clearSearch}
                  className="mt-4"
                >
                  View All Products
                </Button>
              )}
            </div>
          )}

          {!isLoading && !error && products.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    {...transformProductToCardProps(product)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="pt-8">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

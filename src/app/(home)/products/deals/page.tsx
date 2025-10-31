"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon } from "lucide-react";
import { type SearchProductsParams } from "@/lib/api/search";
import { fetchProducts, type Product } from "@/lib/api/products";

const PRODUCTS_PER_PAGE = 20;

// Query key factory for React Query
const searchQueryKeys = {
  all: ["deals-products"] as const,
  byQuery: (query: string, page: number, limit: number, sort?: string) =>
    [...searchQueryKeys.all, { query, page, limit, sort }] as const,
};

// Transform API Product to ProductCard props
function transformProductToCardProps(product: Product) {
  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImage = images.find((img) => img.isPrimary);
  const image =
    primaryImage?.imageUrl ?? images[0]?.imageUrl ?? "/placeholder.svg";

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: (product.price ?? 0) / 100,
    compareAtPrice: product.compareAtPrice
      ? product.compareAtPrice / 100
      : null,
    image,
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    store: product.store?.name ?? "Unknown Store",
    category: product.category?.name ?? "Uncategorized",
  };
}

// Custom hook for deals products with filtering
function useDealsProductsQuery(query: string, page: number, sort: string) {
  return useQuery({
    queryKey: searchQueryKeys.byQuery(
      query,
      page,
      PRODUCTS_PER_PAGE * 10,
      sort,
    ),
    queryFn: async () => {
      // Determine API sort - use release-newest if discount-high (client-side sort)
      const apiSort =
        sort === "discount-high"
          ? "release-newest"
          : (sort as SearchProductsParams["sort"]);

      if (!query.trim()) {
        // Fetch more products to account for filtering
        const result = await fetchProducts({
          page: 1,
          limit: PRODUCTS_PER_PAGE * 10, // Fetch more to filter deals
          sort: apiSort,
        });

        // Filter products with compareAtPrice (deals)
        let dealsProducts = result.products.filter(
          (p) => p.compareAtPrice != null && p.compareAtPrice > 0,
        );

        // Sort by discount amount if discount-high sort is selected
        if (sort === "discount-high") {
          dealsProducts = dealsProducts.sort((a, b) => {
            const discountA = (a.compareAtPrice ?? 0) - (a.price ?? 0);
            const discountB = (b.compareAtPrice ?? 0) - (b.price ?? 0);
            return discountB - discountA; // Descending (highest discount first)
          });
        }

        // Apply pagination manually
        const startIndex = (page - 1) * PRODUCTS_PER_PAGE;
        const paginatedProducts = dealsProducts.slice(
          startIndex,
          startIndex + PRODUCTS_PER_PAGE,
        );

        return {
          products: paginatedProducts,
          stores: [],
          categories: [],
          query: "",
          pagination: {
            page,
            limit: PRODUCTS_PER_PAGE,
            total: dealsProducts.length,
            totalPages: Math.ceil(dealsProducts.length / PRODUCTS_PER_PAGE),
          },
        };
      }

      // For search, use fetchProducts with search parameter and filter deals
      const result = await fetchProducts({
        page: 1,
        limit: PRODUCTS_PER_PAGE * 10,
        search: query,
        sort: apiSort,
      });

      // Filter products with compareAtPrice (deals)
      let dealsProducts = result.products.filter(
        (p) => p.compareAtPrice != null && p.compareAtPrice > 0,
      );

      // Sort by discount amount if discount-high sort is selected
      if (sort === "discount-high") {
        dealsProducts = dealsProducts.sort((a, b) => {
          const discountA = (a.compareAtPrice ?? 0) - (a.price ?? 0);
          const discountB = (b.compareAtPrice ?? 0) - (b.price ?? 0);
          return discountB - discountA; // Descending (highest discount first)
        });
      }

      const startIndex = (page - 1) * PRODUCTS_PER_PAGE;
      const paginatedProducts = dealsProducts.slice(
        startIndex,
        startIndex + PRODUCTS_PER_PAGE,
      );

      return {
        products: paginatedProducts,
        stores: [],
        categories: [],
        query: "",
        pagination: {
          page,
          limit: PRODUCTS_PER_PAGE,
          total: dealsProducts.length,
          totalPages: Math.ceil(dealsProducts.length / PRODUCTS_PER_PAGE),
        },
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
    retryDelay: 1000,
  });
}

export default function DealsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentPage = parseInt(searchParams.get("page") ?? "1");
  const sort =
    (searchParams.get("sort") as
      | "price-low"
      | "price-high"
      | "rating-low"
      | "rating-high"
      | "name-asc"
      | "name-desc"
      | "release-newest"
      | "release-oldest"
      | "discount-high") || "discount-high";
  const searchQuery = searchParams.get("search") ?? "";

  // Use custom hook for deals
  const { data, isLoading, error } = useDealsProductsQuery(
    searchQuery,
    currentPage,
    sort,
  );

  const products = useMemo(() => data?.products ?? [], [data?.products]);

  const pagination = useMemo(
    () =>
      data?.pagination ?? {
        page: 1,
        limit: PRODUCTS_PER_PAGE,
        total: 0,
        totalPages: 0,
      },
    [data?.pagination],
  );

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchTerm = (formData.get("search") as string)?.trim() ?? "";

    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const isSearching = Boolean(searchQuery.trim());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Deals & Discounts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover amazing deals and special discounts on our products.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex max-w-md flex-1 gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
              <Input
                name="search"
                type="search"
                placeholder="Search deals..."
                defaultValue={searchQuery}
                className="pl-8"
              />
            </div>
            <Button type="submit">Search</Button>
            {isSearching && (
              <Button variant="outline" type="button" onClick={clearSearch}>
                Clear
              </Button>
            )}
          </form>

          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount-high">Discount: Highest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating-high">Rating: High to Low</SelectItem>
                <SelectItem value="rating-low">Rating: Low to High</SelectItem>
                <SelectItem value="release-newest">Release: Newest</SelectItem>
                <SelectItem value="release-oldest">Release: Oldest</SelectItem>
                <SelectItem value="name-asc">Name: A → Z</SelectItem>
                <SelectItem value="name-desc">Name: Z → A</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pagination.total} deals
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
                Failed to load deals
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
                {isSearching
                  ? "No deals found"
                  : "No deals available at the moment"}
              </div>
              <p className="mt-2 text-gray-400">
                {isSearching
                  ? "Try adjusting your search terms or browse all deals."
                  : "Check back later for new deals and discounts."}
              </p>
              {isSearching && (
                <Button
                  variant="outline"
                  onClick={clearSearch}
                  className="mt-4"
                >
                  View All Deals
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
              {pagination.totalPages > 1 && (
                <div className="pt-8">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

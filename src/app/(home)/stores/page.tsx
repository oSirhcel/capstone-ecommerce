"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2Icon, SearchIcon, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useStoresQuery } from "@/hooks/stores/use-stores-query";
import { useCategoriesQuery } from "@/hooks/categories/use-categories-query";
import { useDebounce } from "@/hooks/use-debounce";
import { StoreCard, StoreCardSkeleton } from "@/components/home/store-card";

const STORES_PER_PAGE = 6;

// Map UI sort values to API sort values
const sortMap: Record<string, string> = {
  rating: "rating-high",
  products: "products-high",
  newest: "newest",
};

// Reverse map for URL to UI sort values
const reverseSortMap: Record<string, string> = {
  "rating-high": "rating",
  "products-high": "products",
  newest: "newest",
};

function StoresPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentSearchTerm = searchParams.get("search") ?? "";
  const currentPage = parseInt(searchParams.get("page") ?? "1");
  const categoryParam = searchParams.get("category");
  const currentCategoryId =
    categoryParam && !isNaN(parseInt(categoryParam))
      ? parseInt(categoryParam)
      : null;
  const currentSort = searchParams.get("sort") ?? "rating-high";

  // Use local state for the input field only
  const [searchTerm, setSearchTerm] = useState(currentSearchTerm);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    currentCategoryId?.toString() ?? "all",
  );
  const [selectedSort, setSelectedSort] = useState<string>(currentSort);

  // Debounce the search term for better UX (500ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch categories
  const { data: categoriesData } = useCategoriesQuery();
  const categories = categoriesData?.categories ?? [];

  // Track the last search term and category to detect changes
  const [lastSearchTerm, setLastSearchTerm] = useState(debouncedSearchTerm);
  const [lastCategoryId, setLastCategoryId] = useState(currentCategoryId);

  const categoryId =
    selectedCategoryId === "all" ? undefined : parseInt(selectedCategoryId);

  const queryParams: {
    page: number;
    limit: number;
    search?: string;
    category?: number;
    sort?: string;
  } = {
    page: currentPage,
    limit: STORES_PER_PAGE,
    sort: sortMap[selectedSort] || "rating-high",
  };
  if (debouncedSearchTerm.trim()) {
    queryParams.search = debouncedSearchTerm.trim();
  }
  if (categoryId !== undefined) {
    queryParams.category = categoryId;
  }

  const { data, isLoading, error, isFetching } = useStoresQuery(queryParams);

  const stores = data?.stores ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: STORES_PER_PAGE,
    total: 0,
    totalPages: 1,
  };

  // Detect search term or category changes and reset page in URL
  useEffect(() => {
    const categoryChanged = categoryId !== lastCategoryId;
    const searchChanged = debouncedSearchTerm !== lastSearchTerm;

    if (categoryChanged || searchChanged) {
      setLastSearchTerm(debouncedSearchTerm);
      setLastCategoryId(categoryId ?? null);
      // Reset to page 1 when search or category changes
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearchTerm,
    lastSearchTerm,
    categoryId,
    lastCategoryId,
    pathname,
    router,
  ]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Sync input field and category with URL changes
  useEffect(() => {
    setSearchTerm(currentSearchTerm);
    setSelectedCategoryId(currentCategoryId?.toString() ?? "all");
    setSelectedSort(reverseSortMap[currentSort] ?? "rating");
  }, [currentSearchTerm, currentCategoryId, currentSort]);

  // Update URL when debounced search term or category changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let urlChanged = false;

    // Update search param
    if (debouncedSearchTerm !== currentSearchTerm) {
      if (debouncedSearchTerm.trim()) {
        params.set("search", debouncedSearchTerm.trim());
      } else {
        params.delete("search");
      }
      // Reset to page 1 when search changes
      params.set("page", "1");
      urlChanged = true;
    }

    // Update category param
    if (categoryId !== currentCategoryId) {
      if (categoryId) {
        params.set("category", categoryId.toString());
      } else {
        params.delete("category");
      }
      // Reset to page 1 when category changes
      params.set("page", "1");
      urlChanged = true;
    }

    if (urlChanged) {
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [
    debouncedSearchTerm,
    currentSearchTerm,
    categoryId,
    currentCategoryId,
    searchParams,
    pathname,
    router,
  ]);

  const handleCategoryChange = (value: string) => {
    const newCategoryId = value === "all" ? undefined : parseInt(value);
    setSelectedCategoryId(value);
    // Update lastCategoryId immediately to prevent stale comparisons
    setLastCategoryId(newCategoryId ?? null);

    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    // Reset to page 1 when category changes
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    // Reset to page 1 when sort changes
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  // Update URL when debounced search term or category changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let urlChanged = false;

    // Update search param
    if (debouncedSearchTerm !== currentSearchTerm) {
      if (debouncedSearchTerm.trim()) {
        params.set("search", debouncedSearchTerm.trim());
      } else {
        params.delete("search");
      }
      urlChanged = true;
    }

    // Update category param
    if (categoryId !== currentCategoryId) {
      if (categoryId) {
        params.set("category", categoryId.toString());
      } else {
        params.delete("category");
      }
      urlChanged = true;
    }

    if (urlChanged) {
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [
    debouncedSearchTerm,
    currentSearchTerm,
    categoryId,
    currentCategoryId,
    searchParams,
    pathname,
    router,
  ]);

  return (
    <>
      {/* Hero Section */}
      <section className="from-background to-muted/20 w-full border-b bg-gradient-to-b py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <Badge variant="secondary" className="px-4 py-1.5">
              <Store className="mr-1.5 inline h-3.5 w-3.5" />
              Discover Creators
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Browse All Stores
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Explore thousands of independent creators and find your new
              favorite store
            </p>

            {/* Search Bar */}
            <div className="group relative mx-auto max-w-xl">
              <SearchIcon className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transition-colors" />
              <Input
                type="search"
                placeholder="Search stores by name or category"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus-visible:border-primary h-12 rounded-full border-2 pr-4 pl-12 shadow-sm transition-all focus-visible:shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stores Tabs */}
      <section className="w-full py-4 md:py-8">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex w-full items-center gap-3 md:w-auto">
              <Select
                value={selectedCategoryId}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="bg-background w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSort} onValueChange={handleSortChange}>
                <SelectTrigger className="bg-background w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="products">Most Products</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-muted-foreground text-sm">
              {isLoading && currentPage === 1 ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                `${pagination.total} stores found`
              )}
            </p>
          </div>

          {error && (
            <div className="border-destructive bg-destructive/10 text-destructive mb-6 rounded-lg border p-4 text-center">
              Failed to load stores. Please try again.
            </div>
          )}

          {isLoading || (isFetching && stores.length === 0) ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: STORES_PER_PAGE }).map((_, index) => (
                <StoreCardSkeleton key={index} />
              ))}
            </div>
          ) : stores.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {stores.map((store) => (
                  <StoreCard key={store.id} {...store} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        const pageNum = i + 1;
                        const isCurrentPage = pageNum === currentPage;
                        return (
                          <Button
                            key={pageNum}
                            variant={isCurrentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      },
                    )}
                    {pagination.totalPages > 5 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePageChange(pagination.totalPages)
                          }
                        >
                          {pagination.totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-lg">
                No stores found. Try adjusting your search.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="from-primary/5 via-primary/10 to-background w-full bg-gradient-to-br py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <Badge variant="outline" className="px-4 py-1.5">
              For Creators
            </Badge>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to start your own store?
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Join thousands of creators earning a living doing what they love.
              Set up your store in minutes.
            </p>

            <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
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
      </section>
    </>
  );
}

export default function StoresPage() {
  return (
    <Suspense
      fallback={
        <>
          <section className="from-background to-muted/20 w-full border-b bg-gradient-to-b py-12 md:py-16">
            <div className="container mx-auto max-w-5xl px-4 md:px-6">
              <div className="mx-auto max-w-3xl space-y-6 text-center">
                <Badge variant="secondary" className="px-4 py-1.5">
                  <Store className="mr-1.5 inline h-3.5 w-3.5" />
                  Discover Creators
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  Browse All Stores
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Explore thousands of independent creators and find your new
                  favorite store
                </p>
              </div>
            </div>
          </section>
          <section className="w-full py-4 md:py-8">
            <div className="container mx-auto max-w-5xl px-4 md:px-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: STORES_PER_PAGE }).map((_, index) => (
                  <StoreCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </section>
        </>
      }
    >
      <StoresPageContent />
    </Suspense>
  );
}

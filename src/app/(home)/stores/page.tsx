"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { StoreCard, StoreCardSkeleton } from "@/components/store-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, FilterIcon, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const STORES_PER_PAGE = 20;

// Store interface matching our API response
interface Store {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  productCount: number;
}

interface StoresResponse {
  stores: Store[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Function to fetch stores from API
async function fetchStores(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<StoresResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.search) searchParams.append("search", params.search);

  const response = await fetch(`/api/stores?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch stores: ${response.statusText}`);
  }

  return response.json();
}

export default function StoresPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const currentPage = parseInt(searchParams.get("page") || "1");

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "stores",
      {
        page: currentPage,
        limit: STORES_PER_PAGE,
        search: searchParams.get("search"),
      },
    ],
    queryFn: () =>
      fetchStores({
        page: currentPage,
        limit: STORES_PER_PAGE,
        search: searchParams.get("search") || undefined,
      }),
  });

  const stores = data?.stores || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: STORES_PER_PAGE,
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
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
            All Stores
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Discover amazing stores and independent creators on our marketplace.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex max-w-md flex-1 gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search stores..."
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
              {pagination.total} store{pagination.total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Stores Grid */}
        <div className="space-y-6">
          {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: STORES_PER_PAGE }).map((_, idx) => (
                <StoreCardSkeleton key={`store-skeleton-${idx}`} />
              ))}
            </div>
          )}

          {error && !isLoading && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="font-medium text-red-600">
                  Failed to load stores
                </div>
                <p className="mt-2 text-gray-500">
                  Please try again later or contact support if the problem
                  persists.
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && stores.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Store className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <div className="font-medium text-gray-500">
                  {searchParams.get("search")
                    ? "No stores found"
                    : "No stores available"}
                </div>
                <p className="mt-2 text-gray-400">
                  {searchParams.get("search")
                    ? "Try adjusting your search terms or browse all stores."
                    : "Check back later for new stores."}
                </p>
                {searchParams.get("search") && (
                  <Button
                    variant="outline"
                    onClick={clearSearch}
                    className="mt-4"
                  >
                    View All Stores
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && stores.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {stores.map((store) => (
                  <StoreCard
                    key={store.id}
                    id={store.id}
                    name={store.name}
                    description={store.description}
                    productCount={store.productCount}
                    createdAt={store.createdAt}
                    ownerId={store.ownerId}
                  />
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
          )}
        </div>

        {/* Stats Summary */}
        {!isLoading && !error && stores.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="mb-2 text-lg font-semibold">Store Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <div className="text-primary text-2xl font-bold">
                      {pagination.total}
                    </div>
                    <div className="text-muted-foreground">Total Stores</div>
                  </div>
                  <div>
                    <div className="text-primary text-2xl font-bold">
                      {stores.reduce(
                        (sum, store) => sum + store.productCount,
                        0,
                      )}
                    </div>
                    <div className="text-muted-foreground">Total Products</div>
                  </div>
                  <div>
                    <div className="text-primary text-2xl font-bold">
                      {Math.round(
                        stores.reduce(
                          (sum, store) => sum + store.productCount,
                          0,
                        ) / stores.length,
                      ) || 0}
                    </div>
                    <div className="text-muted-foreground">
                      Avg Products/Store
                    </div>
                  </div>
                  <div>
                    <div className="text-primary text-2xl font-bold">
                      {new Date().getFullYear() -
                        Math.min(
                          ...stores.map((store) =>
                            new Date(store.createdAt).getFullYear(),
                          ),
                        )}
                      +
                    </div>
                    <div className="text-muted-foreground">
                      Years in Business
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

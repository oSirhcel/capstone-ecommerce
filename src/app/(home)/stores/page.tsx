"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchIcon,
  FilterIcon,
  Store,
  Calendar,
  Package,
  Star,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoresQuery } from "@/hooks/stores/use-stores-query";
import { useDebounce } from "@/hooks/use-debounce";

const STORES_PER_PAGE = 20;

export default function StoresPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Calculate values during render instead of using useEffect
  const currentSearchTerm = searchParams.get("search") ?? "";
  const currentPage = parseInt(searchParams.get("page") ?? "1");

  // Use local state for the input field only
  const [searchTerm, setSearchTerm] = useState(currentSearchTerm);

  // Debounce the search term for better UX (500ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Check if search is being debounced
  const isSearching = searchTerm !== debouncedSearchTerm;

  const { data, isLoading, error } = useStoresQuery({
    page: currentPage,
    limit: STORES_PER_PAGE,
    search: debouncedSearchTerm || undefined,
  });

  const stores = data?.stores ?? [];
  const pagination = data?.pagination ?? {
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

  const clearSearch = () => {
    setSearchTerm("");
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  // Sync input field with URL changes (legitimate useEffect use case)
  useEffect(() => {
    setSearchTerm(currentSearchTerm);
  }, [currentSearchTerm]);

  // Update URL when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== currentSearchTerm) {
      const params = new URLSearchParams(searchParams);
      if (debouncedSearchTerm.trim()) {
        params.set("search", debouncedSearchTerm.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1"); // Reset to first page on search change
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [debouncedSearchTerm, currentSearchTerm, searchParams, pathname, router]);

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
          <div className="relative max-w-md flex-1">
            <SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search stores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8 pl-8"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute top-2.5 right-2.5 h-4 w-4 text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

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

        {/* Stores Table */}
        <div className="space-y-6">
          {(isLoading || isSearching) && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Products</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead className="text-center">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <TableRow key={`store-skeleton-${idx}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-full max-w-xs" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="mx-auto h-4 w-8" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="mx-auto h-4 w-12" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="mx-auto h-4 w-16" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {error && !isLoading && !isSearching && (
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

          {!isLoading && !isSearching && !error && stores.length === 0 && (
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

          {!isLoading && !isSearching && !error && stores.length > 0 && (
            <>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Products</TableHead>
                        <TableHead className="text-center">Rating</TableHead>
                        <TableHead className="text-center">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stores.map((store) => {
                        const joinedDate = new Date(
                          store.createdAt,
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                        });

                        return (
                          <TableRow
                            key={store.id}
                            className="hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/stores/${store.slug}`)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="from-primary/20 to-primary/40 flex h-12 w-12 items-center justify-center rounded bg-gradient-to-br">
                                    <Store className="text-primary h-6 w-6" />
                                  </div>
                                </div>
                                <div>
                                  <div className="text-primary font-semibold">
                                    {store.name}
                                  </div>
                                  <div className="text-muted-foreground text-sm">
                                    Store ID: {store.id}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              {store.description ? (
                                <p className="text-muted-foreground line-clamp-2 text-sm">
                                  {store.description}
                                </p>
                              ) : (
                                <span className="text-muted-foreground text-sm italic">
                                  No description available
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="gap-1">
                                <Package className="h-3 w-3" />
                                {store.productCount ?? 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Star className="fill-primary text-primary h-4 w-4" />
                                <span className="font-medium">4.5</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-muted-foreground flex items-center justify-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                <span>{joinedDate}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

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
        {!isLoading && !isSearching && !error && stores.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="mb-2 text-lg font-semibold">Store Statistics</h3>
                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                  <div>
                    <div className="text-primary text-2xl font-bold">
                      {pagination.total}
                    </div>
                    <div className="text-muted-foreground">Total Stores</div>
                  </div>
                  <div>
                    <div className="text-primary text-2xl font-bold">
                      {stores.reduce(
                        (sum, store) => sum + (store.productCount ?? 0),
                        0,
                      )}
                    </div>
                    <div className="text-muted-foreground">Total Products</div>
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

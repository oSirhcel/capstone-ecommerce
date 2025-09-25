"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SearchIcon, StoreIcon, FolderIcon, PackageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import Image from "next/image";
import { categoryNameToSlug } from "@/lib/utils/category-slug";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  storeId: string;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
  store: {
    id: string;
    name: string;
  } | null;
  category: {
    id: number;
    name: string;
  } | null;
  images: Array<{
    id: number;
    imageUrl: string;
    altText: string | null;
    isPrimary: boolean;
    displayOrder: number;
  }>;
}

interface Store {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
}

interface SearchResults {
  products: Product[];
  stores: Store[];
  categories: Category[];
  query: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const fetchSearchResults = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchTerm)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      fetchSearchResults(query);
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchSearchResults(searchQuery);
      // Update URL without navigation
      const url = new URL(window.location.href);
      url.searchParams.set("q", searchQuery);
      window.history.pushState({}, "", url.toString());
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const totalResults = results
    ? results.products.length +
      results.stores.length +
      results.categories.length
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Search Results</h1>

        {/* Results Summary */}
        {results && (
          <div className="text-muted-foreground mt-4">
            {totalResults > 0 ? (
              <p>
                Found {totalResults} result{totalResults !== 1 ? "s" : ""} for "
                {results.query}"
              </p>
            ) : (
              <p>No results found for "{results.query}"</p>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search Results */}
      {results && !isLoading && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
            <TabsTrigger value="products">
              <PackageIcon className="mr-2 h-4 w-4" />
              Products ({results.products.length})
            </TabsTrigger>
            <TabsTrigger value="stores">
              <StoreIcon className="mr-2 h-4 w-4" />
              Stores ({results.stores.length})
            </TabsTrigger>
            <TabsTrigger value="categories">
              <FolderIcon className="mr-2 h-4 w-4" />
              Categories ({results.categories.length})
            </TabsTrigger>
          </TabsList>

          {/* All Results */}
          <TabsContent value="all" className="space-y-6">
            {/* Categories Section */}
            {results.categories.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center text-xl font-semibold">
                  <FolderIcon className="mr-2 h-5 w-5" />
                  Categories ({results.categories.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.categories.map((category) => (
                    <Card
                      key={category.id}
                      className="transition-shadow hover:shadow-md"
                    >
                      <CardContent className="p-4">
                        <Link
                          href={`/categories/${categoryNameToSlug(category.name)}`}
                        >
                          <h3 className="text-primary font-semibold hover:underline">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-muted-foreground mt-1 text-sm">
                              {category.description}
                            </p>
                          )}
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Stores Section */}
            {results.stores.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center text-xl font-semibold">
                  <StoreIcon className="mr-2 h-5 w-5" />
                  Stores ({results.stores.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.stores.map((store) => (
                    <Card
                      key={store.id}
                      className="transition-shadow hover:shadow-md"
                    >
                      <CardContent className="p-4">
                        <Link href={`/stores/${store.id}`}>
                          <h3 className="text-primary font-semibold hover:underline">
                            {store.name}
                          </h3>
                          {store.description && (
                            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                              {store.description}
                            </p>
                          )}
                          <p className="text-muted-foreground mt-2 text-xs">
                            Store since{" "}
                            {new Date(store.createdAt).getFullYear()}
                          </p>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Products Section */}
            {results.products.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center text-xl font-semibold">
                  <PackageIcon className="mr-2 h-5 w-5" />
                  Products ({results.products.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.products.map((product) => (
                    <Card
                      key={product.id}
                      className="transition-shadow hover:shadow-md"
                    >
                      <CardContent className="p-4">
                        <Link href={`/product/${product.id}`}>
                          <div className="relative mb-3 aspect-square overflow-hidden rounded-md">
                            <Image
                              src={
                                product.images[0]?.imageUrl ||
                                "/placeholder.svg"
                              }
                              alt={product.images[0]?.altText || product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <h3 className="mb-2 line-clamp-2 text-sm font-semibold">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-primary text-lg font-bold">
                              {formatPrice(product.price)}
                            </span>
                            {product.stock > 0 ? (
                              <Badge variant="secondary">In Stock</Badge>
                            ) : (
                              <Badge variant="destructive">Out of Stock</Badge>
                            )}
                          </div>
                          {product.store && (
                            <p className="text-muted-foreground mt-2 text-xs">
                              by {product.store.name}
                            </p>
                          )}
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {totalResults === 0 && (
              <div className="py-12 text-center">
                <SearchIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or browse our categories.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Products Only */}
          <TabsContent value="products">
            {results.products.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.products.map((product) => (
                  <Card
                    key={product.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-4">
                      <Link href={`/product/${product.id}`}>
                        <div className="relative mb-3 aspect-square overflow-hidden rounded-md">
                          <Image
                            src={
                              product.images[0]?.imageUrl || "/placeholder.svg"
                            }
                            alt={product.images[0]?.altText || product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <h3 className="mb-2 line-clamp-2 text-sm font-semibold">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-primary text-lg font-bold">
                            {formatPrice(product.price)}
                          </span>
                          {product.stock > 0 ? (
                            <Badge variant="secondary">In Stock</Badge>
                          ) : (
                            <Badge variant="destructive">Out of Stock</Badge>
                          )}
                        </div>
                        {product.store && (
                          <p className="text-muted-foreground mt-2 text-xs">
                            by {product.store.name}
                          </p>
                        )}
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <PackageIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">
                  No products found
                </h3>
                <p className="text-muted-foreground">
                  No products match your search criteria.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Stores Only */}
          <TabsContent value="stores">
            {results.stores.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.stores.map((store) => (
                  <Card
                    key={store.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-6">
                      <Link href={`/stores/${store.id}`}>
                        <h3 className="text-primary mb-2 text-lg font-semibold hover:underline">
                          {store.name}
                        </h3>
                        {store.description && (
                          <p className="text-muted-foreground mb-3 line-clamp-3">
                            {store.description}
                          </p>
                        )}
                        <p className="text-muted-foreground text-sm">
                          Store since {new Date(store.createdAt).getFullYear()}
                        </p>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <StoreIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">No stores found</h3>
                <p className="text-muted-foreground">
                  No stores match your search criteria.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Categories Only */}
          <TabsContent value="categories">
            {results.categories.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.categories.map((category) => (
                  <Card
                    key={category.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-6">
                      <Link
                        href={`/categories/${categoryNameToSlug(category.name)}`}
                      >
                        <h3 className="text-primary mb-2 text-lg font-semibold hover:underline">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-muted-foreground">
                            {category.description}
                          </p>
                        )}
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <FolderIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">
                  No categories found
                </h3>
                <p className="text-muted-foreground">
                  No categories match your search criteria.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

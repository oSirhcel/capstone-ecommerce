"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/home/product-card";
import { Pagination } from "@/components/home/pagination";
import { fetchProducts, transformProductToCardProps } from "@/lib/api/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, TagIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import {
  getKnownCategoryName,
  slugToCategoryName,
} from "@/lib/utils/category-slug";

const PRODUCTS_PER_PAGE = 20;

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
}

function CategoryPageContent({ params }: CategoryPageProps) {
  const [categoryName, setCategoryName] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") ?? "",
  );
  const currentPage = parseInt(searchParams.get("page") ?? "1");

  // Get category slug from params and determine category name
  useEffect(() => {
    void params.then(({ slug }) => {
      const knownName = getKnownCategoryName(slug);
      // Fallback to converting slug to a readable name if not in the map
      setCategoryName(knownName ?? slugToCategoryName(slug));
    });
  }, [params]);

  // Fetch category details
  const {
    data: category,
    isLoading: categoryLoading,
    error: categoryError,
  } = useQuery({
    queryKey: ["category", categoryName],
    queryFn: async (): Promise<Category> => {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = (await response.json()) as { categories: Category[] };
      const category = data.categories.find(
        (c: Category) => c.name === categoryName,
      );
      if (!category) {
        throw new Error("Category not found");
      }
      return category;
    },
    enabled: !!categoryName,
  });

  // Fetch products in this category
  const {
    data,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: [
      "products",
      {
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
        category: category?.id,
        search: searchParams.get("search"),
      },
    ],
    queryFn: () =>
      fetchProducts({
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
        category: category?.id,
        search: searchParams.get("search") ?? undefined,
      }),
    enabled: !!category?.id,
  });

  const products = data?.products ?? [];
  const pagination = data?.pagination ?? {
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
    setSearchTerm(searchParams.get("search") ?? "");
  }, [searchParams]);

  if (categoryLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  if (categoryError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-12 text-center">
          <TagIcon className="mx-auto h-16 w-16 text-gray-400" />
          <div className="mt-4 font-medium text-red-600">
            Category not found
          </div>
          <p className="mt-2 text-gray-500">
            The category you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/categories">
            <Button className="mt-4">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Browse All Categories
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/categories" className="hover:text-primary">
              Categories
            </Link>
            <span>/</span>
            <span>{category?.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {category?.name}
          </h1>
          {category?.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {category.description}
            </p>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex max-w-md flex-1 gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search in this category..."
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pagination.total} products
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-6">
          {productsLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, idx) => (
                <ProductCardSkeleton key={`product-skeleton-${idx}`} />
              ))}
            </div>
          )}

          {productsError && !productsLoading && (
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

          {!productsLoading && !productsError && products.length === 0 && (
            <div className="py-12 text-center">
              <TagIcon className="mx-auto h-16 w-16 text-gray-400" />
              <div className="mt-4 font-medium text-gray-500">
                {searchParams.get("search")
                  ? "No products found"
                  : "No products in this category"}
              </div>
              <p className="mt-2 text-gray-400">
                {searchParams.get("search")
                  ? "Try adjusting your search terms."
                  : "Check back later for new products."}
              </p>
              {searchParams.get("search") && (
                <Button
                  variant="outline"
                  onClick={clearSearch}
                  className="mt-4"
                >
                  View All Products in Category
                </Button>
              )}
            </div>
          )}

          {!productsLoading && !productsError && products.length > 0 && (
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

export default function CategoryPage({ params }: CategoryPageProps) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, idx) => (
                <ProductCardSkeleton key={`product-skeleton-${idx}`} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <CategoryPageContent params={params} />
    </Suspense>
  );
}

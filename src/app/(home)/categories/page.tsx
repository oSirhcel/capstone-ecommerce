"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TagIcon, ArrowRightIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryNameToSlug } from "@/lib/utils/category-slug";

interface Category {
  id: number;
  name: string;
  description: string | null;
}

interface CategoriesResponse {
  categories: Category[];
  total: number;
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/categories/${categoryNameToSlug(category.name)}`}>
      <Card className="cursor-pointer transition-all hover:scale-105 hover:shadow-md">
        <CardHeader className="text-center">
          <TagIcon className="text-primary mx-auto h-12 w-12" />
          <CardTitle className="text-lg">{category.name}</CardTitle>
          {category.description && (
            <CardDescription className="line-clamp-2">
              {category.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0 text-center">
          <div className="text-primary flex items-center justify-center text-sm font-medium">
            Browse Products
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CategoryCardSkeleton() {
  return (
    <Card>
      <CardHeader className="text-center">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto h-6 w-24" />
        <Skeleton className="mx-auto h-4 w-32" />
      </CardHeader>
      <CardContent className="pt-0 text-center">
        <Skeleton className="mx-auto h-4 w-28" />
      </CardContent>
    </Card>
  );
}

export default function AllCategoriesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<CategoriesResponse> => {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
  });

  const categories = data?.categories || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            All Categories
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse all available product categories in our marketplace.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="space-y-6">
          {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <CategoryCardSkeleton key={`category-skeleton-${idx}`} />
              ))}
            </div>
          )}

          {error && !isLoading && (
            <div className="py-12 text-center">
              <div className="font-medium text-red-600">
                Failed to load categories
              </div>
              <p className="mt-2 text-gray-500">
                Please try again later or contact support if the problem
                persists.
              </p>
            </div>
          )}

          {!isLoading && !error && categories.length === 0 && (
            <div className="py-12 text-center">
              <TagIcon className="mx-auto h-16 w-16 text-gray-400" />
              <div className="mt-4 font-medium text-gray-500">
                No categories available
              </div>
              <p className="mt-2 text-gray-400">
                Check back later for new categories.
              </p>
            </div>
          )}

          {!isLoading && !error && categories.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {categories.length} categories available
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { TagIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategories } from "@/lib/api/categories";
import {
  CategoryCard,
  CategoryCardSkeleton,
} from "@/components/home/category-card";

export default function AllCategoriesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const categories = data?.categories ?? [];

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
            <>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <CategoryCardSkeleton key={`category-skeleton-${idx}`} />
                ))}
              </div>
            </>
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
                  <CategoryCard
                    key={category.id}
                    name={category.name}
                    count={category.count}
                    imageUrl={category.imageUrl}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

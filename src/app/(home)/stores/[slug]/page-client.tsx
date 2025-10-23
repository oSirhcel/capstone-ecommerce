"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { StoreHeader } from "@/components/store/store-header";
import { StoreInfo } from "@/components/store/store-info";
import { StoreProducts } from "@/components/store/store-products";
import { StoreReviews } from "@/components/store/store-reviews";
import { useStoreQuery } from "@/hooks/stores/use-store-query";
import { useStoreStats } from "@/hooks/stores/use-store-stats";

interface StorePageClientProps {
  slug: string;
}

export const StorePageClient = ({ slug }: StorePageClientProps) => {
  const {
    data: store,
    isLoading: storeLoading,
    error: storeError,
  } = useStoreQuery(slug);

  const { data: stats, isLoading: statsLoading } = useStoreStats(slug);

  if (storeLoading) {
    return (
      <div className="bg-background min-h-screen">
        {/* Header Skeleton */}
        <div className="relative">
          <div className="relative h-[300px] w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div className="container mx-auto px-4">
            <div className="relative -mt-20 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div className="border-background bg-background relative h-32 w-32 overflow-hidden rounded-xl border-4 shadow-lg">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="flex-1 space-y-2 pb-4">
                <Skeleton className="h-8 w-64" />
                <div className="flex flex-wrap items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-full max-w-3xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (storeError) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Store not found</h2>
          <p className="mt-2 text-gray-600">
            The store you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  if (!store) {
    return null;
  }

  const storeWithStats = {
    ...store,
    stats:
      stats && !statsLoading
        ? {
            totalProducts: stats.totalProducts,
            activeProducts: stats.activeProducts,
            averageRating: stats.averageRating,
            totalReviews: stats.totalReviews,
          }
        : undefined,
  };

  return (
    <div className="bg-background min-h-screen">
      <StoreHeader store={storeWithStats} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <StoreProducts slug={slug} />
            <StoreReviews slug={slug} />
          </div>

          <div className="space-y-6">
            <StoreInfo store={storeWithStats} />
          </div>
        </div>
      </div>
    </div>
  );
};

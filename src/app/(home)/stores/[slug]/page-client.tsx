"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { StoreHeader } from "@/components/store/store-header";
import { StoreInfo } from "@/components/store/store-info";
import { StoreProducts } from "@/components/store/store-products";
import { StoreReviews } from "@/components/store/store-reviews";
import { useStoreQueryBySlug } from "@/hooks/stores/use-store-query-by-slug";
import { useStoreStats } from "@/hooks/stores/use-store-stats";

interface StorePageClientProps {
  slug: string;
}

export const StorePageClient = ({ slug }: StorePageClientProps) => {
  const {
    data: store,
    isLoading: storeLoading,
    error: storeError,
  } = useStoreQueryBySlug(slug);

  const { data: stats, isLoading: statsLoading } = useStoreStats(slug);

  if (storeLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-10 w-64" />
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[600px] w-full" />
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

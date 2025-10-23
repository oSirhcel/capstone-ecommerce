"use client";

import { PolicyViewer } from "@/components/store/policy-viewer";
import { useStoreQuery } from "@/hooks/stores/use-store-query";
import { Skeleton } from "@/components/ui/skeleton";

interface StorePolicyClientProps {
  slug: string;
  policyType: "shipping" | "return" | "privacy" | "terms";
}

export function StorePolicyClient({
  slug,
  policyType,
}: StorePolicyClientProps) {
  const { data: store, isLoading, error } = useStoreQuery(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="mb-4 h-10 w-32" />
            <div className="text-center">
              <Skeleton className="mx-auto mb-2 h-8 w-64" />
              <Skeleton className="mx-auto h-4 w-48" />
            </div>
          </div>
          <div className="mx-auto max-w-4xl">
            <div className="rounded-lg border bg-white p-8 shadow-lg">
              <Skeleton className="mx-auto mb-6 h-6 w-48" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Store not found</h2>
          <p className="mt-2 text-gray-600">
            The store you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const policyTitles = {
    shipping: "Shipping Policy",
    return: "Return Policy",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  };

  const policyContent = {
    shipping: store.settings?.shippingPolicy,
    return: store.settings?.returnPolicy,
    privacy: store.settings?.privacyPolicy,
    terms: store.settings?.termsOfService,
  };

  const content = policyContent[policyType];
  const title = policyTitles[policyType];

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="mt-2 text-gray-600">
            This policy is not available for {store.name}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PolicyViewer
      title={title}
      content={content}
      storeName={store.name}
      storeSlug={slug}
      lastUpdated={undefined}
    />
  );
}

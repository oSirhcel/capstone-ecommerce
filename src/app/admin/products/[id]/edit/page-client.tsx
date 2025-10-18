"use client";

import { useProductQuery } from "@/hooks/products/use-product-query";
import { ProductForm } from "@/components/admin/products/product-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ProductEditPageClientProps {
  id: number;
}

export function ProductEditPageClient({ id }: ProductEditPageClientProps) {
  const router = useRouter();
  const { data: product, isLoading, isError, error } = useProductQuery(id);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !product) {
    return (
      <div className="container mx-auto max-w-7xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Failed to load product. Please try again."}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/admin/products")}>
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  // Transform Product to ProductFormValues
  const initialData = {
    name: product.name,
    sku: product.sku ?? "",
    description: product.description ?? "",
    price: product.price ? product.price / 100 : 0, // Convert from cents to dollars
    compareAtPrice: product.compareAtPrice ? product.compareAtPrice / 100 : 0,
    costPerItem: product.costPerItem ? product.costPerItem / 100 : 0,
    category: product.categoryId?.toString() ?? "",
    tags: product.tags ?? "",
    trackQuantity: product.trackQuantity,
    quantity: product.stock,
    allowBackorders: product.allowBackorders,
    weight: product.weight ? parseFloat(product.weight) : 0,
    dimensions: {
      length: product.length ? parseFloat(product.length) : 0,
      width: product.width ? parseFloat(product.width) : 0,
      height: product.height ? parseFloat(product.height) : 0,
    },
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    slug: product.slug ?? "",
    status: product.status as "active" | "draft" | "archived",
    featured: product.featured,
    images: product.images.map((img) => img.imageUrl),
  };

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <ProductForm initialData={initialData} isEditing={true} productId={id} />
    </div>
  );
}

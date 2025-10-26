"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProductBySlug, type Product } from "@/lib/api/products";
import { Breadcrumb } from "@/components/product/breadcrumb";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
import { ProductTabs } from "@/components/product/product-tabs";
import { RelatedProducts } from "@/components/product/related-products";
import { StoreInfo } from "@/components/product/store-info";

interface ProductPageClientProps {
  productSlug: string;
}

function transform(product: Product) {
  return {
    id: product.id.toString(),
    name: product.name,
    price: product.price ? product.price / 100 : 0,
    discountPrice: product.compareAtPrice
      ? product.compareAtPrice / 100
      : undefined,
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: product.stock,
    sku: `${product.id.toString().padStart(6, "0")}`,
    description: product.description ?? "No description available",
    features: [
      "High quality product",
      "Fast shipping",
      "Customer satisfaction guaranteed",
    ],
    specifications: [
      { name: "Product ID", value: product.id.toString() },
      { name: "Category", value: product.category?.name ?? "Uncategorized" },
      { name: "Store", value: product.store?.name ?? "Unknown Store" },
      { name: "Stock", value: product.stock.toString() },
      { name: "Added", value: product.createdAt.toLocaleString() },
    ],
    images: product.images.map((img) => img.imageUrl),
    options: [
      {
        id: "size",
        name: "Size",
        values: ["S", "M", "L", "XL"],
      },
    ],
    category: product.category?.name ?? "Uncategorized",
    tags: [
      "product",
      product.category?.name?.toLowerCase() ?? "general",
    ].filter(Boolean),
    store: {
      id: product.store?.id ?? "unknown",
      name: product.store?.name ?? "Unknown Store",
      slug: product.store?.slug ?? "unknown-store",
      logo: "/placeholder.svg",
      rating: 4.0,
      productCount: 0,
      joinedDate: "Unknown",
    },
  };
}

export function ProductPageClient({ productSlug }: ProductPageClientProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["product", productSlug],
    queryFn: () => fetchProductBySlug(productSlug),
  });

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8 md:px-6">
          <div className="mb-6">
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          <div className="mt-12 space-y-4">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="text-center text-red-600">
            Failed to load product.
          </div>
        </div>
      </div>
    );
  }

  const transformedProduct = transform(data);

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: transformedProduct.category, href: `#` },
            { label: transformedProduct.name, href: `#`, current: true },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <ProductGallery images={transformedProduct.images} />

          <div className="space-y-8">
            <ProductInfo product={transformedProduct} />
            <StoreInfo store={transformedProduct.store} />
          </div>
        </div>

        <ProductTabs product={transformedProduct} />

        <section className="mt-16">
          <h2 className="mb-8 text-2xl font-bold">Related Products</h2>
          <RelatedProducts
            category={transformedProduct.category}
            currentProductId={transformedProduct.id}
          />
        </section>
      </div>
    </div>
  );
}

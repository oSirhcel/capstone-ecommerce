"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchProducts,
  getPrimaryImageUrl,
  type Product,
} from "@/lib/api/products";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";

interface NewArrivalsProps {
  limit?: number;
}

export function NewArrivals({ limit = 6 }: NewArrivalsProps) {
  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", { limit }],
    queryFn: () => fetchProducts({ limit }),
    select: (res) => res.products,
  });

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
      {isLoading &&
        Array.from({ length: limit }).map((_, idx) => (
          <ProductCardSkeleton key={`new-arrivals-skel-${idx}`} />
        ))}
      {error && !isLoading && (
        <div className="col-span-full py-8 text-center text-red-600">
          Failed to load products
        </div>
      )}
      {!isLoading && !error && products.length === 0 && (
        <div className="text-muted-foreground col-span-full py-8 text-center">
          No products available at the moment.
        </div>
      )}
      {!isLoading &&
        !error &&
        products.map((product: Product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            slug={product.slug}
            name={product.name}
            price={(product.price ?? 0) / 100}
            image={getPrimaryImageUrl(product)}
            rating={product.rating}
            reviewCount={product.reviewCount}
            store={product.store?.name ?? "Unknown Store"}
            category={product.category?.name ?? "Uncategorized"}
          />
        ))}
    </div>
  );
}

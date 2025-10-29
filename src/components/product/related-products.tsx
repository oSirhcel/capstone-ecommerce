"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  fetchRelatedProducts,
  getPrimaryImageUrl,
  type Product,
} from "@/lib/api/products";

interface RelatedProductsProps {
  category: string;
  currentProductSlug: string;
}

export function RelatedProducts({
  category,
  currentProductSlug,
}: RelatedProductsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isMobile = useIsMobile();

  // Fetch related products
  const {
    data: relatedProductsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["related-products", currentProductSlug],
    queryFn: () => fetchRelatedProducts(currentProductSlug, 6),
    enabled: !!currentProductSlug,
  });

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10,
    );
  };

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = isMobile ? 300 : 600;
    container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = isMobile ? 300 : 600;
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => checkScrollButtons();
    container.addEventListener("scroll", handleScroll);

    // Initial check
    checkScrollButtons();

    // Check on window resize
    window.addEventListener("resize", checkScrollButtons);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, []);

  // Transform API Product to ProductCard props
  const transformProductToCardProps = (product: Product) => ({
    id: product.id,
    slug: product.slug ?? product.id.toString(),
    name: product.name,
    price: (product.price ?? 0) / 100, // Convert from cents to dollars
    image: getPrimaryImageUrl(product),
    rating: product.rating,
    reviewCount: product.reviewCount,
    store: product.store?.name ?? "Unknown Store",
    category: product.category?.name ?? "Uncategorized",
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="relative">
        <div className="scrollbar-hide flex gap-4 overflow-x-auto pt-2 pb-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="min-w-[250px] md:min-w-[300px]">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !relatedProductsData?.products) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Unable to load related products.
      </div>
    );
  }

  const relatedProducts = relatedProductsData.products.map(
    transformProductToCardProps,
  );

  // Handle empty state
  if (relatedProducts.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No related products found.
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className="scrollbar-hide flex gap-4 overflow-x-auto pt-2 pb-4"
      >
        {relatedProducts.map((product) => (
          <div key={product.id} className="min-w-[250px] md:min-w-[300px]">
            <ProductCard {...product} />
          </div>
        ))}
      </div>
      <div className="absolute -top-12 right-0 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className="h-8 w-8 rounded-full"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={scrollRight}
          disabled={!canScrollRight}
          className="h-8 w-8 rounded-full"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

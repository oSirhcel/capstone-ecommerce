"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { useIsMobile } from "@/hooks/use-mobile";

interface RelatedProductsProps {
  category: string;
  currentProductId: string;
}

export function RelatedProducts({
  category,
  currentProductId,
}: RelatedProductsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isMobile = useIsMobile();

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

  // Mock related products data
  const relatedProducts = [
    {
      name: "Ceramic Espresso Cup Set",
      price: 29.99,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.7,
      store: "Artisan Crafts",
      category: "Home & Kitchen",
    },
    {
      name: "Handcrafted Wooden Coasters",
      price: 19.99,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.5,
      store: "Woodworks",
      category: "Home & Kitchen",
    },
    {
      name: "Ceramic Serving Platter",
      price: 49.99,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.8,
      store: "Artisan Crafts",
      category: "Home & Kitchen",
    },
    {
      name: "Stoneware Dinner Plates Set",
      price: 64.99,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.6,
      store: "Modern Home",
      category: "Home & Kitchen",
    },
    {
      name: "Ceramic Tea Pot",
      price: 39.99,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.9,
      store: "Artisan Crafts",
      category: "Home & Kitchen",
    },
    {
      name: "Handmade Ceramic Vase",
      price: 54.99,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.7,
      store: "Artisan Crafts",
      category: "Home & Kitchen",
    },
  ];

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className="scrollbar-hide flex gap-4 overflow-x-auto pt-2 pb-4"
      >
        {relatedProducts.map((product, index) => (
          <div key={index} className="min-w-[250px] md:min-w-[300px]">
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

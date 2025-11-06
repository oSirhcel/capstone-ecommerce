"use client";

import { useState } from "react";
import {
  CheckIcon,
  MinusIcon,
  PlusIcon,
  Share2Icon,
  StarIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useCart } from "@/contexts/cart-context";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProductInfoProps {
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number;
    rating: number;
    reviewCount: number;
    stock: number;
    sku: string;
    tags: string[];
    store?: {
      id: string;
      name: string;
    };
  };
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    toast.success("Product link copied to clipboard");
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleAddToCart = () => {
    const price =
      product.discountPrice !== undefined
        ? Math.min(product.price, product.discountPrice)
        : product.price;

    // If not logged in, redirect to sign in and do NOT show success toast
    if (!session?.user) {
      const callbackUrl =
        typeof window !== "undefined"
          ? encodeURIComponent(window.location.href)
          : "/";
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: price,
      image: "/placeholder.svg?height=300&width=300",
      quantity: quantity,
      storeId: product.store?.id ?? "unknown",
      storeName: product.store?.name ?? "Unknown Store",
      stock: product.stock,
    });
  };

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                }`}
              />
            ))}
            <span className="ml-2 text-sm font-medium">{product.rating}</span>
          </div>
          <div className="text-muted-foreground text-sm">
            <span>{product.reviewCount} reviews</span>
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        {product.discountPrice !== undefined ? (
          (() => {
            const originalPrice = Math.max(
              product.price,
              product.discountPrice,
            );
            const discountedPrice = Math.min(
              product.price,
              product.discountPrice,
            );
            const discountPct = Math.round(
              ((originalPrice - discountedPrice) / originalPrice) * 100,
            );
            return (
              <>
                <span className="text-2xl font-bold">
                  ${discountedPrice.toFixed(2)}
                </span>
                <span className="text-muted-foreground text-lg line-through">
                  ${originalPrice.toFixed(2)}
                </span>
                {discountPct > 0 && (
                  <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-900">
                    {discountPct}% OFF
                  </Badge>
                )}
              </>
            );
          })()
        ) : (
          <span className="text-2xl font-bold">
            ${product.price.toFixed(2)}
          </span>
        )}
      </div>

      <div className="space-y-4 border-t border-b py-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Quantity</span>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
            >
              <MinusIcon className="h-3 w-3" />
              <span className="sr-only">Decrease quantity</span>
            </Button>
            <div className="bg-background flex h-8 w-12 items-center justify-center border-y text-center text-sm">
              {quantity}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={increaseQuantity}
              disabled={quantity >= product.stock}
            >
              <PlusIcon className="h-3 w-3" />
              <span className="sr-only">Increase quantity</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium">Availability</span>
          <span
            className={product.stock > 0 ? "text-green-600" : "text-red-600"}
          >
            {product.stock > 0
              ? `In Stock (${product.stock} available)`
              : "Out of Stock"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium">SKU</span>
          <span className="text-muted-foreground">{product.sku}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Button
          className="flex-1"
          size="lg"
          disabled={product.stock <= 0}
          onClick={handleAddToCart}
        >
          Add to Cart
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="size-11"
          onClick={handleShare}
          disabled={isCopied}
        >
          {isCopied ? (
            <CheckIcon className="size-5" />
          ) : (
            <Share2Icon className="size-5" />
          )}
          <span className="sr-only">Share product</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {product.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

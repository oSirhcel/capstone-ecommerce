"use client";

import { useState } from "react";
import {
  HeartIcon,
  MinusIcon,
  PlusIcon,
  Share2Icon,
  StarIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseAsStringLiteral, useQueryStates } from "nuqs";
import { useCart } from "@/contexts/cart-context";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    options: {
      id: string;
      name: string;
      values: string[];
    }[];
    tags: string[];
    store?: {
      id: string;
      name: string;
    };
  };
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const handleAddToCart = () => {
    const price = product.discountPrice ?? product.price;

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

  const optionsQueryConfig = product.options.reduce(
    (acc, option) => {
      // For each option, define a parser.
      // parseAsStringLiteral takes an array of allowed values and a default value.
      // We'll use the first value of the option as its default.
      acc[option.name] = parseAsStringLiteral(option.values).withDefault(
        option.values[0],
      );
      return acc;
    },
    {} as Record<string, ReturnType<typeof parseAsStringLiteral>>, // Type assertion for the accumulator
  );

  // selectedOptions will be an object like: { Color: "Red", Size: "M" }
  const [selectedOptions, setSelectedOptions] =
    useQueryStates(optionsQueryConfig);

  console.log(selectedOptions);

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
        {product.discountPrice ? (
          <>
            <span className="text-2xl font-bold">
              ${product.discountPrice.toFixed(2)}
            </span>
            <span className="text-muted-foreground text-lg line-through">
              ${product.price.toFixed(2)}
            </span>
            <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-900">
              {Math.round(
                ((product.price - product.discountPrice) / product.price) * 100,
              )}
              % OFF
            </Badge>
          </>
        ) : (
          <span className="text-2xl font-bold">
            ${product.price.toFixed(2)}
          </span>
        )}
      </div>

      <div className="space-y-4 border-t border-b py-4">
        {product.options.map((option) => (
          <div key={option.id} className="flex items-center justify-between">
            <span className="font-medium">{option.name}</span>
            <Select
              // The value for this select is determined by the option's name in the selectedOptions object.
              // nuqs ensures this value is either from the URL or the default specified in parseAsStringLiteral.
              value={selectedOptions[option.name] ?? ""} // Fallback to empty string if somehow undefined, though nuqs should provide a default.
              onValueChange={(value) => {
                // Update only the specific option that changed.
                // e.g., if Color changes, call setSelectedOptions({ Color: "NewColor" })
                void setSelectedOptions({ [option.name]: value });
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue
                  placeholder={`Select ${option.name.toLowerCase()}`}
                />
              </SelectTrigger>
              <SelectContent>
                {option.values.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
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

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          className="flex-1"
          size="lg"
          disabled={product.stock <= 0}
          onClick={handleAddToCart}
        >
          Add to Cart
        </Button>
        <Button variant="outline" size="icon" className="h-11 w-11">
          <HeartIcon className="h-5 w-5" />
          <span className="sr-only">Add to wishlist</span>
        </Button>
        <Button variant="outline" size="icon" className="h-11 w-11">
          <Share2Icon className="h-5 w-5" />
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

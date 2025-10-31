import Image from "next/image";
import { StarIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { generateSlug } from "@/lib/utils/slug";

interface ProductCardProps {
  id: number;
  slug: string | null;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviewCount?: number;
  store: string;
  category: string;
  compareAtPrice?: number | null;
}

export function ProductCard({
  id,
  slug,
  name,
  price,
  image,
  rating,
  reviewCount,
  store,
  category,
  compareAtPrice,
}: ProductCardProps) {
  // Use slug if available, otherwise generate one from name, or fall back to id
  const productUrl = slug
    ? `/product/${slug}`
    : `/product/${generateSlug(name)}`;

  // Calculate discount if compareAtPrice exists and is greater than price
  const hasDiscount =
    compareAtPrice != null && compareAtPrice > 0 && compareAtPrice > price;
  const discountPercentage = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <Link href={productUrl}>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-0">
          <div className="relative">
            <Image
              src={image || "/placeholder.svg"}
              alt={name}
              width={300}
              height={300}
              className="aspect-square w-full object-contain"
            />
            <Badge className="absolute top-2 right-2">{category}</Badge>
            {hasDiscount && discountPercentage > 0 && (
              <Badge className="absolute top-2 left-2 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-900">
                {discountPercentage}% OFF
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 p-4">
          <div className="flex w-full items-center justify-between">
            <p className="text-muted-foreground text-sm">{store}</p>
            <div className="flex items-center gap-1">
              <StarIcon className="fill-primary text-primary h-3.5 w-3.5" />
              <span className="text-sm font-medium">
                {rating > 0 ? rating.toFixed(1) : "No rating"}
              </span>
              {reviewCount !== undefined && reviewCount > 0 && (
                <span className="text-muted-foreground text-xs">
                  ({reviewCount})
                </span>
              )}
            </div>
          </div>
          <h3 className="line-clamp-1 font-medium">{name}</h3>
          <div className="flex items-baseline gap-2">
            <p className="font-bold">${price.toFixed(2)}</p>
            {hasDiscount && (
              <p className="text-muted-foreground text-sm line-through">
                ${compareAtPrice.toFixed(2)}
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <Skeleton className="aspect-square w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 p-4">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-5 w-16" />
      </CardFooter>
    </Card>
  );
}

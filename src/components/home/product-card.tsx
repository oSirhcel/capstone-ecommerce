import Image from "next/image";
import { StarIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductCardProps {
  slug: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  store: string;
  category: string;
  compareAtPrice?: number | null;
}

export function ProductCard({
  slug,
  name,
  price,
  image,
  rating,
  store,
  category,
  compareAtPrice,
}: ProductCardProps) {
  const productUrl = `/product/${slug}`;

  // Calculate discount if compareAtPrice exists and is greater than price
  const hasDiscount =
    compareAtPrice != null && compareAtPrice > 0 && compareAtPrice > price;
  const discountPercentage = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <Link href={productUrl} className="group block">
      <Card className="hover:border-primary/50 overflow-hidden border transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-0">
          <div className="relative overflow-hidden">
            <Image
              src={image || "/placeholder.svg"}
              alt={name}
              width={300}
              height={300}
              className="aspect-square w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
            {hasDiscount && discountPercentage > 0 && (
              <Badge className="absolute top-2 left-2 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-900">
                {discountPercentage}% OFF
              </Badge>
            )}
            <Badge className="absolute top-3 right-3 shadow-sm">
              {category}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 p-4">
          <div className="flex w-full items-center justify-between text-sm">
            <p className="text-muted-foreground">{store}</p>
            <div className="flex items-center gap-1">
              <StarIcon className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium">{rating}</span>
            </div>
          </div>
          <h3 className="group-hover:text-primary line-clamp-1 leading-snug font-medium transition-colors">
            {name}
          </h3>
          <p className="text-lg font-bold">${price.toFixed(2)}</p>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border">
      <CardContent className="p-0">
        <div className="relative overflow-hidden">
          <Skeleton className="aspect-square w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 p-4">
        <div className="flex w-full items-center justify-between text-sm">
          <Skeleton className="h-5 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-5 w-8" />
          </div>
        </div>
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-7.5 w-16" />
      </CardFooter>
    </Card>
  );
}

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
  store: string;
  category: string;
}

export function ProductCard({
  id,
  slug,
  name,
  price,
  image,
  rating,
  store,
  category,
}: ProductCardProps) {
  // Use slug if available, otherwise generate one from name, or fall back to id
  const productUrl = slug
    ? `/product/${slug}`
    : `/product/${generateSlug(name)}`;

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
              className="aspect-square w-full object-cover"
            />
            <Badge className="absolute top-2 right-2">{category}</Badge>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 p-4">
          <div className="flex w-full items-center justify-between">
            <p className="text-muted-foreground text-sm">{store}</p>
            <div className="flex items-center gap-1">
              <StarIcon className="fill-primary text-primary h-3.5 w-3.5" />
              <span className="text-sm font-medium">{rating}</span>
            </div>
          </div>
          <h3 className="line-clamp-1 font-medium">{name}</h3>
          <p className="font-bold">${price.toFixed(2)}</p>
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

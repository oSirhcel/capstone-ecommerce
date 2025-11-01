import Image from "next/image";
import Link from "next/link";
import { StarIcon, PackageIcon } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StoreCardProps {
  name: string;
  slug: string;
  image: string;
  productCount: number;
  averageRating: number;
}

export function StoreCard({
  name,
  slug,
  image,
  productCount,
  averageRating,
}: StoreCardProps) {
  return (
    <Link href={`/stores/${slug}`} className="block">
      <Card className="hover:border-primary/50 overflow-hidden border transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-0">
          <div className="relative overflow-hidden">
            <Image
              src={image || "/placeholder.svg"}
              alt={name}
              width={300}
              height={300}
              className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 p-4">
          <h3 className="group-hover:text-primary text-lg font-semibold transition-colors">
            {name}
          </h3>
          <div className="flex w-full items-center justify-between text-sm">
            <div className="text-muted-foreground flex items-center gap-1.5">
              <PackageIcon className="h-4 w-4" />
              <span>{productCount} products</span>
            </div>
            <div className="flex items-center gap-1">
              <StarIcon className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{averageRating}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function StoreCardSkeleton() {
  return (
    <div className="block">
      <Card className="overflow-hidden border">
        <CardContent className="p-0">
          <div className="relative overflow-hidden">
            <Skeleton className="aspect-square w-full" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 p-4">
          <Skeleton className="h-7 w-3/4" />
          <div className="flex w-full items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-5 w-4" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-5 w-4" />
              <Skeleton className="h-5 w-8" />
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

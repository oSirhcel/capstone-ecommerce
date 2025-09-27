import Image from "next/image";
import Link from "next/link";
import { Star, Store, Calendar } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface StoreCardProps {
  id: string;
  name: string;
  description?: string | null;
  image?: string;
  productCount: number;
  rating?: number;
  createdAt: string;
  ownerId: string;
}

export function StoreCard({
  id,
  name,
  description,
  image,
  productCount,
  rating = 4.5,
  createdAt,
}: StoreCardProps) {
  const joinedYear = new Date(createdAt).getFullYear();

  return (
    <Link href={`/stores/${id}`} className="block">
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-0">
          <div className="relative">
            <Image
              src={image || "/placeholder.svg"}
              alt={name}
              width={300}
              height={200}
              className="aspect-[3/2] w-full object-cover"
            />
            <Badge className="absolute top-2 right-2" variant="secondary">
              <Store className="mr-1 h-3 w-3" />
              Store
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 p-4">
          <div className="w-full">
            <h3 className="line-clamp-1 text-lg font-semibold">{name}</h3>
            {description && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {description}
              </p>
            )}
          </div>

          <div className="flex w-full items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                {productCount} product{productCount !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="text-muted-foreground h-3 w-3" />
                <span className="text-muted-foreground">
                  Since {joinedYear}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="fill-primary text-primary h-3.5 w-3.5" />
              <span className="font-medium">{rating}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function StoreCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Skeleton className="aspect-[3/2] w-full" />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3 p-4">
        <div className="w-full space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-8" />
        </div>
      </CardFooter>
    </Card>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StoreCardProps {
  name: string;
  image: string;
  category: string;
  productCount: number;
  rating: number;
}

export function StoreCard({
  name,
  image,
  category,
  productCount,
  rating,
}: StoreCardProps) {
  return (
    <Link href="#" className="block">
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
          <h3 className="font-medium">{name}</h3>
          <div className="flex w-full items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {productCount} products
            </p>
            <div className="flex items-center gap-1">
              <Star className="fill-primary text-primary h-3.5 w-3.5" />
              <span className="text-sm font-medium">{rating}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

import Image from "next/image";
import { StarIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  rating: number;
  store: string;
  category: string;
}

export function ProductCard({
  id,
  name,
  price,
  image,
  rating,
  store,
  category,
}: ProductCardProps) {
  return (
    <Link href={`/product/${id}`}>
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

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { categoryNameToSlug } from "@/lib/utils/category-slug";
import { Skeleton } from "../ui/skeleton";
import { PackageIcon } from "lucide-react";

interface CategoryCardProps {
  name: string;
  count: number;
  imageUrl: string;
}

export function CategoryCard({ name, count, imageUrl }: CategoryCardProps) {
  const slug = categoryNameToSlug(name);

  return (
    <Link href={`/categories/${slug}`} className="group block">
      <Card className="hover:border-primary/50 overflow-hidden border py-0 transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-0">
          <Image
            src={imageUrl ?? "/placeholder.svg"}
            alt={name}
            width={300}
            height={300}
            className="w-full object-cover"
          />

          <CardFooter className="flex flex-col items-start gap-3 p-4">
            <h3 className="mb-0.5 text-base font-semibold">{name}</h3>
            <div className="text-muted-foreground flex items-center gap-1.5">
              <PackageIcon className="h-3.5 w-3.5" />
              <span>{count} products</span>
            </div>
          </CardFooter>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CategoryCardSkeleton() {
  return (
    <Card className="overflow-hidden border py-0">
      <CardContent className="p-0">
        <Skeleton className="aspect-square w-full" />
        <CardFooter className="flex flex-col items-start gap-3 p-4">
          <Skeleton className="mb-0.5 h-5 w-72" />
          <div className="text-muted-foreground flex items-center gap-1.5">
            <PackageIcon className="h-3.5 w-3.5" />
            <Skeleton className="h-7 w-16" />
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { categoryNameToSlug } from "@/lib/utils/category-slug";

interface CategoryCardProps {
  name: string;
  count: number;
  image: string;
}

export function CategoryCard({ name, count, image }: CategoryCardProps) {
  const slug = categoryNameToSlug(name);

  return (
    <Link href={`/categories/${slug}`} className="group block">
      <Card className="hover:border-primary/50 overflow-hidden border transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-0">
          <div className="relative overflow-hidden">
            <Image
              src={image || "/placeholder.svg"}
              alt={name}
              width={100}
              height={100}
              className="aspect-square w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity group-hover:from-black/80" />
            <div className="absolute bottom-0 w-full p-4 text-white">
              <h3 className="mb-0.5 text-base font-semibold">{name}</h3>
              <p className="text-sm text-white/90">{count} products</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

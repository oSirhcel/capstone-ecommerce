import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  CheckCircle,
  Share2,
  Heart,
  TrendingUp,
  Package,
} from "lucide-react";

interface StoreHeaderProps {
  store: {
    name: string;
    description: string | null;
    createdAt: Date;
    stats?: {
      totalProducts: number;
      averageRating: number;
      totalReviews: number;
    };
  };
}

export function StoreHeader({ store }: StoreHeaderProps) {
  const joinedYear = new Date(store.createdAt).getFullYear();

  return (
    <div className="relative">
      {/* Cover Image - Using placeholder since schema doesn't support store images */}
      <div className="relative h-[300px] w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold drop-shadow-lg">{store.name}</h1>
            <p className="mt-2 text-lg drop-shadow-md">Online Store</p>
          </div>
        </div>
      </div>

      {/* Store Info Overlay */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-20 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          {/* Logo - Using placeholder */}
          <div className="border-background bg-background relative h-32 w-32 overflow-hidden rounded-xl border-4 shadow-lg">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
              <span className="text-2xl font-bold text-blue-600">
                {store.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Store Details */}
          <div className="flex-1 space-y-2 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-foreground text-3xl font-bold">
                {store.name}
              </h1>
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified Store
              </Badge>
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
              {store.stats?.averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-foreground font-medium">
                    {store.stats.averageRating.toFixed(1)}
                  </span>
                  <span>
                    ({store.stats.totalReviews.toLocaleString()} reviews)
                  </span>
                </div>
              )}
              {store.stats?.totalProducts && (
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{store.stats.totalProducts} products</span>
                </div>
              )}
              <span>Joined {joinedYear}</span>
            </div>

            {store.description && (
              <p className="text-muted-foreground max-w-3xl text-sm">
                {store.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pb-4">
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

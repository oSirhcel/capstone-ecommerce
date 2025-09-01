import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";

interface ProductReviewsProps {
  reviews: {
    average: number;
    total: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
}

export function ProductReviews({ reviews }: ProductReviewsProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Reviews</CardTitle>
        <CardDescription>Review summary and ratings breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{reviews.average}</div>
            <div className="mt-1 flex items-center justify-center gap-1">
              {renderStars(Math.floor(reviews.average))}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {reviews.total} reviews
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(reviews.distribution)
            .reverse()
            .map(([stars, count]) => (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex w-12 items-center gap-1">
                  <span className="text-sm">{stars}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <Progress
                  value={(count / reviews.total) * 100}
                  className="h-2 flex-1"
                />
                <span className="text-muted-foreground w-8 text-sm">
                  {count}
                </span>
              </div>
            ))}
        </div>

        <div className="border-t pt-4">
          <h4 className="mb-3 font-medium">Recent Reviews</h4>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sarah M.</span>
                  <Badge variant="outline" className="text-xs">
                    Verified Purchase
                  </Badge>
                </div>
                <div className="flex items-center gap-1">{renderStars(5)}</div>
              </div>
              <p className="text-muted-foreground text-sm">
                &quot;Excellent sound quality and very comfortable to wear for
                long periods. The noise cancellation works perfectly!&quot;
              </p>
              <p className="text-muted-foreground mt-2 text-xs">2 days ago</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Mike R.</span>
                  <Badge variant="outline" className="text-xs">
                    Verified Purchase
                  </Badge>
                </div>
                <div className="flex items-center gap-1">{renderStars(4)}</div>
              </div>
              <p className="text-muted-foreground text-sm">
                &quot;Great headphones overall. Battery life is as advertised.
                Only minor complaint is they can get a bit warm during extended
                use.&quot;
              </p>
              <p className="text-muted-foreground mt-2 text-xs">1 week ago</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

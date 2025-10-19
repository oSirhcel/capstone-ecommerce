"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { fetchStoreReviews } from "@/lib/api/stores";

interface StoreReviewsProps {
  slug: string;
}

export function StoreReviews({ slug }: StoreReviewsProps) {
  const {
    data: reviewsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["store-reviews", slug],
    queryFn: () =>
      fetchStoreReviews(slug, {
        page: 1,
        limit: 20,
        sort: "newest",
      }),
    enabled: !!slug,
  });

  const reviews = reviewsData?.reviews ?? [];
  const stats = reviewsData?.stats ?? {
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
      1 | 2 | 3 | 4 | 5,
      number
    >,
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="h-8 animate-pulse rounded bg-gray-200" />
                <div className="h-4 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 animate-pulse rounded bg-gray-200"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border-b pb-4">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                    <div className="space-y-1">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="h-4 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <p className="text-red-500">
              Error:{" "}
              {error instanceof Error
                ? error.message
                : "Failed to load reviews"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customer Reviews</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button disabled>Write a Review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
                <DialogDescription>
                  Reviews are written for individual products. Please visit a
                  product page to write a review.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Overview */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                {stats.average.toFixed(1)}
              </span>
              <span className="text-muted-foreground">out of 5</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(stats.average)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-muted-foreground text-sm">
              Based on {stats.total.toLocaleString()} reviews
            </p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="w-12 text-sm">{stars} star</span>
                <Progress
                  value={
                    stats.distribution[stars as keyof typeof stats.distribution]
                  }
                  className="flex-1"
                />
                <span className="text-muted-foreground w-12 text-right text-sm">
                  {stats.distribution[stars as keyof typeof stats.distribution]}
                  %
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((reviewItem) => (
              <div
                key={reviewItem.id}
                className="space-y-3 border-b pb-6 last:border-0 last:pb-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src="/placeholder.svg?height=40&width=40"
                        alt={reviewItem.user.name}
                      />
                      <AvatarFallback>{reviewItem.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{reviewItem.user.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(reviewItem.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Review for: {reviewItem.product.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= reviewItem.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {reviewItem.comment && (
                  <p className="text-sm">{reviewItem.comment}</p>
                )}
                <Button variant="ghost" size="sm" className="gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Helpful (0)
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No reviews yet</p>
          </div>
        )}

        {reviews.length > 0 && (
          <Button variant="outline" className="w-full bg-transparent">
            Load More Reviews
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

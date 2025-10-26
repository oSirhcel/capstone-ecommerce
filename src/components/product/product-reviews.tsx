"use client";

import { useState } from "react";
import { Star, ThumbsDown, ThumbsUp, Edit, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useProductReviews,
  useSubmitReview,
  useUpdateReview,
  useDeleteReview,
} from "@/hooks/use-product-reviews";
import type { Review } from "@/lib/api/reviews";

interface ProductReviewsProps {
  productId: number;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [sortBy, setSortBy] = useState("newest");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const {
    data: reviewsData,
    isLoading,
    error,
  } = useProductReviews(productId, sortBy);
  const submitReviewMutation = useSubmitReview();
  const updateReviewMutation = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();

  const reviews = reviewsData?.reviews ?? [];
  const stats = reviewsData?.stats ?? {
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  // Check if current user has already reviewed this product
  const userReview = reviews.find(
    (review) => review.userId === session?.user?.id,
  );

  const handleSubmitReview = async () => {
    if (!session?.user) {
      const callbackUrl =
        typeof window !== "undefined"
          ? encodeURIComponent(window.location.href)
          : "/";
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }

    try {
      await submitReviewMutation.mutateAsync({
        productId,
        rating,
        comment: comment.trim() || undefined,
      });

      toast.success("Review submitted successfully!");
      setRating(5);
      setComment("");
      setIsSubmittingReview(false);
    } catch (error: any) {
      // Check if it's a "already reviewed" error
      if (error?.message?.includes("already reviewed")) {
        toast.error(
          "You have already reviewed this product. You can edit your existing review below.",
        );
      } else {
        toast.error(error?.message || "Failed to submit review");
      }
    }
  };

  const handleEditReview = async (
    reviewId: number,
    currentRating: number,
    currentComment: string,
  ) => {
    setEditingReviewId(reviewId);
    setRating(currentRating);
    setComment(currentComment || "");
    setIsEditingReview(true);
  };

  const handleUpdateReview = async () => {
    if (!editingReviewId) return;

    try {
      await updateReviewMutation.mutateAsync({
        reviewId: editingReviewId,
        rating,
        comment: comment.trim() || undefined,
      });

      toast.success("Review updated successfully!");
      setIsEditingReview(false);
      setEditingReviewId(null);
      setRating(5);
      setComment("");
    } catch (error) {
      toast.error("Failed to update review");
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await deleteReviewMutation.mutateAsync(reviewId);
      toast.success("Review deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onRatingChange?: (rating: number) => void,
  ) => {
    return [...Array(5).keys()].map((i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating ? "fill-primary text-primary" : "text-muted-foreground"
        } ${interactive ? "hover:text-primary cursor-pointer" : ""}`}
        onClick={
          interactive && onRatingChange
            ? () => onRatingChange(i + 1)
            : undefined
        }
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <div className="space-y-4 rounded-lg border p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-4">
              {[...Array(3).keys()].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center text-red-600">
          <p>Failed to load reviews. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <div className="space-y-4 rounded-lg border p-4">
          <div className="text-center">
            <div className="text-4xl font-bold">{stats.average.toFixed(1)}</div>
            <div className="flex justify-center">
              {renderStars(Math.round(stats.average))}
            </div>
            <div className="text-muted-foreground mt-1 text-sm">
              Based on {stats.total} reviews
            </div>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <div className="flex w-20 items-center">
                  <span className="mr-1">{rating}</span>
                  <Star className="fill-primary text-primary h-4 w-4" />
                </div>
                <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full"
                    style={{
                      width: `${stats.total > 0 ? (stats.distribution[rating as keyof typeof stats.distribution] / stats.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <div className="text-muted-foreground w-10 text-right text-sm">
                  {
                    stats.distribution[
                      rating as keyof typeof stats.distribution
                    ]
                  }
                </div>
              </div>
            ))}
          </div>

          <Dialog
            open={isSubmittingReview}
            onOpenChange={setIsSubmittingReview}
          >
            <DialogTrigger asChild>
              <Button className="w-full" disabled={!!userReview}>
                {userReview
                  ? "You've Already Reviewed This Product"
                  : "Write a Review"}
              </Button>
            </DialogTrigger>
            {userReview && (
              <p className="text-muted-foreground mt-2 text-center text-sm">
                You can edit or delete your review below
              </p>
            )}
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Rating</label>
                  <div className="mt-1 flex gap-1">
                    {renderStars(rating, true, setRating)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Comment (optional)
                  </label>
                  <Textarea
                    placeholder="Share your thoughts about this product..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={1000}
                    className="mt-1"
                  />
                  <div className="text-muted-foreground mt-1 text-xs">
                    {comment.length}/1000 characters
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsSubmittingReview(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitReviewMutation.isPending}
                  >
                    {submitReviewMutation.isPending
                      ? "Submitting..."
                      : "Submit Review"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Customer Reviews</h3>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="highest">Highest Rating</SelectItem>
                <SelectItem value="lowest">Lowest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                No reviews yet. Be the first to review this product!
              </div>
            ) : (
              reviews.map((review: Review) => (
                <div
                  key={review.id}
                  className="space-y-2 border-b pb-6 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage
                          src="/placeholder.svg"
                          alt={review.user.name}
                        />
                        <AvatarFallback>
                          {review.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{review.user.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(review.createdAt).toLocaleDateString()}
                          <span className="ml-2 text-green-600">
                            ✓ Verified Purchase
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      {session?.user?.id === review.userId && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleEditReview(
                                review.id,
                                review.rating,
                                review.comment ?? "",
                              )
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {review.comment && (
                    <div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Review Dialog */}
      <Dialog open={isEditingReview} onOpenChange={setIsEditingReview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rating</label>
              <div className="mt-1 flex gap-1">
                {renderStars(rating, true, setRating)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Comment (optional)</label>
              <Textarea
                placeholder="Share your thoughts about this product..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                className="mt-1"
              />
              <div className="text-muted-foreground mt-1 text-xs">
                {comment.length}/1000 characters
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditingReview(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateReview}
                disabled={updateReviewMutation.isPending}
              >
                {updateReviewMutation.isPending
                  ? "Updating..."
                  : "Update Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

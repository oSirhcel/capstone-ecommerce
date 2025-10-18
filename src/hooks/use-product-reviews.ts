import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProductReviews,
  submitReview,
  updateReview,
  deleteReview,
  canReviewProduct,
  type ProductReviewsResponse,
  type SubmitReviewRequest,
  type UpdateReviewRequest,
  type CanReviewResponse,
} from "@/lib/api/reviews";

// Hook for fetching product reviews
export function useProductReviews(productId: number, sort = "newest") {
  return useQuery<ProductReviewsResponse>({
    queryKey: ["reviews", productId, sort],
    queryFn: () => fetchProductReviews(productId, sort),
    enabled: !!productId,
  });
}

// Hook for submitting a review
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, rating, comment }: SubmitReviewRequest) =>
      submitReview(productId, rating, comment),
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["reviews", variables.productId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["canReview", variables.productId],
        }),
      ]);
    },
  });
}

// Hook for updating a review
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      rating,
      comment,
    }: UpdateReviewRequest & { reviewId: number }) =>
      updateReview(reviewId, rating, comment),
    onSuccess: async (data) => {
      // Use Promise.all for parallel invalidation (better performance)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["reviews", data.review.productId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["canReview", data.review.productId],
        }),
      ]);
    },
  });
}

// Hook for deleting a review
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: number) => deleteReview(reviewId),
    onSuccess: async (data, reviewId) => {
      const queriesData = queryClient.getQueriesData({ queryKey: ["reviews"] });

      let productIdToInvalidate: number | null = null;

      // Search through cached review data to find the review with matching ID
      for (const [, queryData] of queriesData) {
        const reviewsData = queryData as ProductReviewsResponse | undefined;
        if (reviewsData?.reviews) {
          const review = reviewsData.reviews.find((r) => r.id === reviewId);
          if (review) {
            productIdToInvalidate = review.productId;
            break;
          }
        }
      }

      // Invalidate the specific product's reviews if found, otherwise invalidate all
      if (productIdToInvalidate !== null) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["reviews", productIdToInvalidate],
          }),
          queryClient.invalidateQueries({
            queryKey: ["canReview", productIdToInvalidate],
          }),
        ]);
      } else {
        // Fallback: invalidate all review queries if we can't find the specific product
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["reviews"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["canReview"],
          }),
        ]);
      }
    },
  });
}

// Hook for checking if user can review a product
export function useCanReviewProduct(productId: number) {
  return useQuery<CanReviewResponse>({
    queryKey: ["canReview", productId],
    queryFn: () => canReviewProduct(productId),
    enabled: !!productId,
  });
}

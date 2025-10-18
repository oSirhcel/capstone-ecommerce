export interface Review {
  id: number;
  userId: string;
  productId: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
  verifiedPurchase: boolean; // Always true since only purchasers can review
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ProductReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
}

export interface SubmitReviewRequest {
  productId: number;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating: number;
  comment?: string;
}

export interface SubmitReviewResponse {
  success: boolean;
  review: Review;
}

export interface UpdateReviewResponse {
  success: boolean;
  review: Review;
}

export interface DeleteReviewResponse {
  success: boolean;
  message: string;
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
}

// Fetch reviews for a product
export async function fetchProductReviews(
  productId: number,
  sort = "newest",
): Promise<ProductReviewsResponse> {
  const params = new URLSearchParams({
    productId: productId.toString(),
    sort,
  });

  const response = await fetch(`/api/reviews?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = (await response.json()) as { error: string };
    throw new Error(error.error ?? "Failed to fetch reviews");
  }

  return (await response.json()) as ProductReviewsResponse;
}

// Submit a new review
export async function submitReview(
  productId: number,
  rating: number,
  comment?: string,
): Promise<SubmitReviewResponse> {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
      rating,
      comment,
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error: string };
    throw new Error(error.error || "Failed to submit review");
  }

  return (await response.json()) as SubmitReviewResponse;
}

// Update an existing review
export async function updateReview(
  reviewId: number,
  rating: number,
  comment?: string,
): Promise<UpdateReviewResponse> {
  const response = await fetch(`/api/reviews/${reviewId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rating,
      comment,
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error: string };
    throw new Error(error.error || "Failed to update review");
  }

  return (await response.json()) as UpdateReviewResponse;
}

// Delete a review
export async function deleteReview(
  reviewId: number,
): Promise<DeleteReviewResponse> {
  const response = await fetch(`/api/reviews/${reviewId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = (await response.json()) as { error: string };
    throw new Error(error.error || "Failed to delete review");
  }

  return (await response.json()) as DeleteReviewResponse;
}

// Check if user can review a product (has purchased it)
export async function canReviewProduct(
  productId: number,
): Promise<CanReviewResponse> {
  const response = await fetch(
    `/api/reviews/can-review?productId=${productId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { error: string };
    throw new Error(error.error || "Failed to check review eligibility");
  }

  return (await response.json()) as CanReviewResponse;
}

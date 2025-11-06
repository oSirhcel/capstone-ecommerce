// Store API utility functions
import { getBaseUrl } from "./config";

export interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  productCount: number;
  averageRating: number;
  imageUrl: string;
}

export interface StoreSettings {
  contactEmail: string | null;
  shippingPolicy: string | null;
  returnPolicy: string | null;
  privacyPolicy: string | null;
  termsOfService: string | null;
}

export interface StoreStats {
  storeId: string;
  totalProducts: number;
  activeProducts: number;
  averageRating: number;
  totalReviews: number;
  memberSince: Date;
}

export interface StoreWithStats extends Store {
  settings?: StoreSettings | null;
  stats?: {
    totalProducts: number;
    activeProducts: number;
    averageRating: number;
    totalReviews: number;
  };
}

export interface StoreProduct {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  price: number | null;
  slug: string | null;
  stock: number;
  status: string;
  featured: boolean;
  storeId: string;
  categoryId: number | null;
  createdAt: Date;
  updatedAt: Date;
  rating: number;
  reviewCount: number;
  store: {
    id: string;
    name: string;
  };
  category: {
    id: number;
    name: string;
  } | null;
  images: Array<{
    id: number;
    imageUrl: string;
    altText: string | null;
    isPrimary: boolean;
    displayOrder: number;
  }>;
}

export interface StoreProductsResponse {
  products: StoreProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StoreReview {
  id: number;
  userId: string;
  productId: number;
  rating: number;
  comment: string | null;
  verifiedPurchase: boolean;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
  product: {
    name: string;
  };
}

export interface StoreReviewsResponse {
  reviews: StoreReview[];
  stats: {
    average: number;
    total: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StoresResponse {
  stores: Store[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// GET /api/stores - Fetch all stores with optional filtering
export async function fetchStores(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: number;
  sort?: string;
}): Promise<StoresResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.search) searchParams.append("search", params.search);
  if (params?.category)
    searchParams.append("category", params.category.toString());
  if (params?.sort) searchParams.append("sort", params.sort);

  const response = await fetch(
    `${getBaseUrl()}/api/stores?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch stores: ${response.statusText}`);
  }

  return response.json() as Promise<StoresResponse>;
}

// GET /api/stores/by-id/[id] - Fetch store by ID
export async function fetchStoreById(id: string): Promise<Store> {
  const response = await fetch(`${getBaseUrl()}/api/stores/by-id/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Store not found");
    }
    throw new Error(`Failed to fetch store: ${response.statusText}`);
  }

  return response.json() as Promise<Store>;
}

// GET /api/stores/featured - Fetch featured stores for homepage
export async function fetchFeaturedStores(limit = 6): Promise<Store[]> {
  const response = await fetch(
    `${getBaseUrl()}/api/stores?limit=${limit}&sort=rating-high`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch featured stores: ${response.statusText}`);
  }

  const data = (await response.json()) as StoresResponse;
  return data.stores;
}

// GET /api/stores/[slug] - Fetch complete store details with settings by slug
export async function fetchStoreDetailsBySlug(
  slug: string,
): Promise<StoreWithStats> {
  const response = await fetch(`${getBaseUrl()}/api/stores/${slug}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Store not found");
    }
    throw new Error(`Failed to fetch store details: ${response.statusText}`);
  }

  return response.json() as Promise<StoreWithStats>;
}

// GET /api/stores/[id] - Fetch complete store details with settings
export async function fetchStoreDetails(id: string): Promise<StoreWithStats> {
  const response = await fetch(`${getBaseUrl()}/api/stores/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Store not found");
    }
    throw new Error(`Failed to fetch store details: ${response.statusText}`);
  }

  return response.json() as Promise<StoreWithStats>;
}

// GET /api/stores/[id]/products - Fetch products for a specific store
export async function fetchStoreProducts(
  slug: string,
  params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
  },
): Promise<StoreProductsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.category) searchParams.append("category", params.category);
  if (params?.search) searchParams.append("search", params.search);
  if (params?.sort) searchParams.append("sort", params.sort);

  const response = await fetch(
    `${getBaseUrl()}/api/stores/${slug}/products?${searchParams.toString()}`,
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Store not found");
    }
    throw new Error(`Failed to fetch store products: ${response.statusText}`);
  }

  return response.json() as Promise<StoreProductsResponse>;
}

// GET /api/stores/[slug]/reviews - Fetch aggregated reviews from all store products

// PATCH /api/stores/[slug] - Update store and settings in one call
export async function updateStoreComplete(data: {
  slug: string;
  name?: string;
  description?: string;
  newSlug?: string;
  contactEmail?: string;
  shippingPolicy?: string;
  returnPolicy?: string;
  privacyPolicy?: string;
  termsOfService?: string;
}): Promise<{ store: Store; settings: StoreSettings }> {
  const { slug, newSlug, ...updateData } = data;

  const response = await fetch(`${getBaseUrl()}/api/stores/${slug}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...updateData,
      ...(newSlug && { slug: newSlug }),
    }),
  });

  if (!response.ok) {
    const error = (await response
      .json()
      .catch(() => ({ error: "Unknown error" }))) as { error?: string };
    throw new Error(
      error.error ?? `Failed to update store: ${response.statusText}`,
    );
  }

  return response.json() as Promise<{ store: Store; settings: StoreSettings }>;
}
export async function fetchStoreReviews(
  slug: string,
  params?: {
    page?: number;
    limit?: number;
    sort?: string;
  },
): Promise<StoreReviewsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.sort) searchParams.append("sort", params.sort);

  const response = await fetch(
    `${getBaseUrl()}/api/stores/${slug}/reviews?${searchParams.toString()}`,
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Store not found");
    }
    throw new Error(`Failed to fetch store reviews: ${response.statusText}`);
  }

  return response.json() as Promise<StoreReviewsResponse>;
}

// GET /api/stores/[slug]/stats - Fetch store statistics
export async function fetchStoreStats(slug: string): Promise<StoreStats> {
  const response = await fetch(`${getBaseUrl()}/api/stores/${slug}/stats`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Store not found");
    }
    throw new Error(`Failed to fetch store stats: ${response.statusText}`);
  }

  return response.json() as Promise<StoreStats>;
}

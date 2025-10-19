// Store API utility functions
import { getBaseUrl } from "./config";

export interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  productCount?: number; // Only included when fetched with product count
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

export interface CreateStoreData {
  name: string;
  description?: string;
  ownerId: string;
}

export interface UpdateStoreData {
  name?: string;
  description?: string;
}

// GET /api/stores - Fetch all stores with optional filtering
export async function fetchStores(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<StoresResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.search) searchParams.append("search", params.search);

  const response = await fetch(
    `${getBaseUrl()}/api/stores?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch stores: ${response.statusText}`);
  }

  return response.json() as Promise<StoresResponse>;
}

// GET /api/stores/[id] - Fetch a single store by ID
export async function fetchStore(id: string): Promise<Store> {
  const response = await fetch(`${getBaseUrl()}/api/stores/${id}`);

  console.log(response);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Store not found");
    }
    throw new Error(`Failed to fetch store: ${response.statusText}`);
  }

  return response.json() as Promise<Store>;
}

// POST /api/stores - Create a new store
export async function createStore(data: CreateStoreData): Promise<Store> {
  const response = await fetch(`${getBaseUrl()}/api/stores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      errorData.error ?? `Failed to create store: ${response.statusText}`,
    );
  }

  return response.json() as Promise<Store>;
}

// PUT /api/stores/[id] - Update a store
export async function updateStore(
  id: string,
  data: UpdateStoreData,
): Promise<Store> {
  const response = await fetch(`${getBaseUrl()}/api/stores/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (response.status === 404) {
      throw new Error("Store not found");
    }
    throw new Error(
      errorData.error ?? `Failed to update store: ${response.statusText}`,
    );
  }

  return response.json() as Promise<Store>;
}

// DELETE /api/stores/[id] - Delete a store
export async function deleteStore(id: string): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/stores/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (response.status === 404) {
      throw new Error("Store not found");
    }
    throw new Error(
      errorData.error ?? `Failed to delete store: ${response.statusText}`,
    );
  }
}

// GET /api/stores/featured - Fetch featured stores for homepage
export async function fetchFeaturedStores(limit = 6): Promise<Store[]> {
  const response = await fetch(`${getBaseUrl()}/api/stores?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch featured stores: ${response.statusText}`);
  }

  const data = (await response.json()) as StoresResponse;
  return data.stores;
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

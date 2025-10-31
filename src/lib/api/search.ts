export interface SearchProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  storeId: string;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
  store: {
    id: string;
    name: string;
    slug: string;
  } | null;
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
  rating: number;
  reviewCount: number;
  slug: string | null;
}

export interface SearchStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
}

export interface SearchCategory {
  id: number;
  name: string;
  description: string | null;
}

export interface SearchResults {
  products: SearchProduct[];
  stores: SearchStore[];
  categories: SearchCategory[];
  query: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchProductsParams {
  query: string;
  page: number;
  limit: number;
  sort?:
    | "price-low"
    | "price-high"
    | "rating-low"
    | "rating-high"
    | "name-asc"
    | "name-desc"
    | "release-newest"
    | "release-oldest";
}

export async function searchContent(query: string): Promise<SearchResults> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error("Failed to search content");
  }

  return (await response.json()) as Promise<SearchResults>;
}

export async function searchProducts(
  params: SearchProductsParams,
): Promise<SearchResults> {
  const searchParams = new URLSearchParams();
  searchParams.append("q", params.query);
  searchParams.append("type", "products");
  searchParams.append("page", params.page.toString());
  searchParams.append("limit", params.limit.toString());
  if (params.sort) {
    searchParams.append("sort", params.sort);
  }

  const response = await fetch(`/api/search?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to search products");
  }

  return (await response.json()) as Promise<SearchResults>;
}

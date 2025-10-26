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

export async function searchContent(query: string): Promise<SearchResults> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error("Failed to search content");
  }

  return (await response.json()) as Promise<SearchResults>;
}

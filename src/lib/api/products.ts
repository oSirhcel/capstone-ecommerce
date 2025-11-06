// Product API utility functions
import { getBaseUrl, type ApiResponse } from "./config";
import { type SearchProduct } from "./search";

export interface Product {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  price: number | null;
  compareAtPrice: number | null;
  costPerItem: number | null;
  stock: number;
  trackQuantity: boolean;
  allowBackorders: boolean;
  weight: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  slug: string | null; // Nullable for drafts
  status: string;
  featured: boolean;
  tags: Array<{ id: number; name: string; slug: string }> | null;
  storeId: string;
  categoryId: number | null;
  createdAt: Date;
  updatedAt: Date;
  rating: number; // Average rating from reviews
  reviewCount: number; // Total number of reviews
  store: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    createdAt?: Date;
    productCount?: number;
    averageRating?: number;
  };
  category?: {
    id: number;
    name: string;
  };
  images: Array<{
    id: number;
    imageUrl: string;
    altText: string | null;
    isPrimary: boolean;
    displayOrder: number;
  }>;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateProductData {
  name: string;
  sku?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  costPerItem?: number;
  stock?: number;
  trackQuantity?: boolean;
  allowBackorders?: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  status?: "Active" | "Draft" | "Archived";
  featured?: boolean;
  tagIds?: number[];
  storeId: string;
  categoryId?: number;
  images?: string[];
}

export interface UpdateProductData {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  costPerItem?: number;
  stock?: number;
  trackQuantity?: boolean;
  allowBackorders?: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  status?: "Active" | "Draft" | "Archived";
  featured?: boolean;
  tagIds?: number[];
  categoryId?: number;
  images?: string[];
}

// GET /api/products - Fetch all products with optional filtering
export async function fetchProducts(params?: {
  page?: number;
  limit?: number;
  category?: number;
  store?: string;
  search?: string;
  status?: "Active" | "Draft" | "Archived" | "all";
  featured?: boolean;
  sort?:
    | "price-low"
    | "price-high"
    | "rating-low"
    | "rating-high"
    | "name-asc"
    | "name-desc"
    | "release-newest"
    | "release-oldest";
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.category)
    searchParams.append("category", params.category.toString());
  if (params?.store) searchParams.append("store", params.store);
  if (params?.search) searchParams.append("search", params.search);
  if (params?.status) searchParams.append("status", params.status);
  if (params?.featured) searchParams.append("featured", "true");
  if (params?.sort) searchParams.append("sort", params.sort);

  const response = await fetch(
    `${getBaseUrl()}/api/products?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json() as Promise<ProductsResponse>;
}

// GET /api/products/[id] - Fetch a single product by ID
export async function fetchProduct(id: number): Promise<Product> {
  const response = await fetch(`${getBaseUrl()}/api/products/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Product not found");
    }
    throw new Error(`Failed to fetch product: ${response.statusText}`);
  }

  return response.json() as Promise<Product>;
}

// GET /api/products/[slug] - Fetch a single product by slug
export async function fetchProductBySlug(slug: string): Promise<Product> {
  const response = await fetch(`${getBaseUrl()}/api/products/${slug}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Product not found");
    }
    throw new Error(`Failed to fetch product: ${response.statusText}`);
  }

  return response.json() as Promise<Product>;
}

// POST /api/products - Create a new product (admin/owner only)
export async function createProduct(
  productData: CreateProductData,
): Promise<ApiResponse<{ product: Product }>> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    const data = (await response.json()) as
      | { product: Product }
      | { error: string };

    if (!response.ok) {
      return {
        error: (data as { error: string }).error ?? "Failed to create product",
      };
    }

    return { data: data as { product: Product } };
  } catch {
    return { error: "Network error occurred" };
  }
}

// PUT /api/products/[id] - Update a product (admin/owner only)
export async function updateProduct(
  id: number,
  updates: UpdateProductData,
): Promise<ApiResponse<{ product: Product }>> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    const data = (await response.json()) as
      | { product: Product }
      | { error: string };

    if (!response.ok) {
      return {
        error: (data as { error: string }).error ?? "Failed to update product",
      };
    }

    return { data: data as { product: Product } };
  } catch {
    return { error: "Network error occurred" };
  }
}

// DELETE /api/products/[id] - Delete a product (admin/owner only)
export async function deleteProduct(
  id: number,
): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/products/${id}`, {
      method: "DELETE",
    });

    const data = (await response.json()) as
      | { message: string }
      | { error: string };

    if (!response.ok) {
      return {
        error: (data as { error: string }).error ?? "Failed to delete product",
      };
    }

    return { data: data as { message: string } };
  } catch {
    return { error: "Network error occurred" };
  }
}

// Utility function to check if a product is in stock
export function isProductInStock(product: Product): boolean {
  return product.stock > 0;
}

// Utility function to format price (from cents to dollars)
export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

// Utility function to parse tags from JSON string
export function parseTags(tags: string[] | null): string[] {
  return tags ?? [];
}

// Utility function to format dimensions
export function formatDimensions(product: Product): string {
  const { length, width, height } = product;
  if (!length || !width || !height) return "Not specified";
  return `${length}cm × ${width}cm × ${height}cm`;
}

// Utility function to format weight
export function formatWeight(weight: string | null): string {
  if (!weight) return "Not specified";
  return `${weight}kg`;
}

// Utility function to get primary image URL
export function getPrimaryImageUrl(product: Product | SearchProduct): string {
  const primaryImage = product.images.find((img) => img.isPrimary);
  return (
    primaryImage?.imageUrl ?? product.images[0]?.imageUrl ?? "/placeholder.svg"
  );
}

// GET /api/products/[slug]/related - Fetch related products for a specific product
export async function fetchRelatedProducts(
  productSlug: string,
  limit?: number,
): Promise<{ products: Product[] }> {
  const searchParams = new URLSearchParams();
  if (limit) searchParams.append("limit", limit.toString());

  const response = await fetch(
    `${getBaseUrl()}/api/products/${productSlug}/related?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch related products: ${response.statusText}`);
  }

  return response.json() as Promise<{ products: Product[] }>;
}

// GET /api/products - Fetch featured products sorted by highest rating
export async function fetchFeaturedProducts(
  limit = 20,
): Promise<ProductsResponse> {
  return fetchProducts({
    featured: true,
    limit,
    sort: "rating-high",
  });
}

// Transform API Product to ProductCard props
export const transformProductToCardProps = (
  product: Product | SearchProduct,
) => {
  return {
    id: product.id,
    slug: product.slug!,
    name: product.name,
    price: (product.price ?? 0) / 100, // Convert from cents to dollars
    compareAtPrice:
      "compareAtPrice" in product && product.compareAtPrice != null
        ? product.compareAtPrice / 100 // Convert from cents to dollars
        : null,
    image: getPrimaryImageUrl(product),
    rating: product.rating, // Use actual rating from reviews
    reviewCount: product.reviewCount, // Include review count
    store: product.store.name,
    category: product.category!.name,
  };
};

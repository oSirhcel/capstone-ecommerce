// Product API utility functions
import { getBaseUrl, type ApiResponse } from "./config";

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
  tags: string | null;
  storeId: string;
  categoryId: number | null;
  createdAt: Date;
  updatedAt: Date;
  store?: {
    id: string;
    name: string;
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
  status?: "active" | "draft" | "archived";
  featured?: boolean;
  tags?: string;
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
  status?: "active" | "draft" | "archived";
  featured?: boolean;
  tags?: string;
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
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.category)
    searchParams.append("category", params.category.toString());
  if (params?.store) searchParams.append("store", params.store);
  if (params?.search) searchParams.append("search", params.search);

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
export function parseTags(tagsJson: string | null): string[] {
  if (!tagsJson) return [];
  try {
    return JSON.parse(tagsJson) as string[];
  } catch {
    return [];
  }
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
export function getPrimaryImageUrl(product: Product): string {
  const primaryImage = product.images.find((img) => img.isPrimary);
  return (
    primaryImage?.imageUrl ?? product.images[0]?.imageUrl ?? "/placeholder.svg"
  );
}

// Utility function to check if user can edit product (placeholder for auth)
export function canEditProduct(_product: Product, _userId?: string): boolean {
  // TODO: Implement proper authorization logic
  // For now, return false (will be updated when auth is implemented)
  return false;
}

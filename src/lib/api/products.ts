// Product API utility functions
import { getBaseUrl, type ApiResponse } from './config';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
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
  description?: string;
  price: number;
  stock?: number;
  storeId: string;
  categoryId?: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: number;
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
  
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.category) searchParams.append('category', params.category.toString());
  if (params?.store) searchParams.append('store', params.store);
  if (params?.search) searchParams.append('search', params.search);

  const response = await fetch(`${getBaseUrl()}/api/products?${searchParams.toString()}`);
  
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
      throw new Error('Product not found');
    }
    throw new Error(`Failed to fetch product: ${response.statusText}`);
  }

  return response.json() as Promise<Product>;
}

// POST /api/products - Create a new product (admin/owner only)
export async function createProduct(productData: CreateProductData): Promise<ApiResponse<{ product: Product }>> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error ?? 'Failed to create product' };
    }

    return { data };
  } catch (error) {
    return { error: 'Network error occurred' };
  }
}

// PUT /api/products/[id] - Update a product (admin/owner only)
export async function updateProduct(id: number, updates: UpdateProductData): Promise<ApiResponse<{ product: Product }>> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error ?? 'Failed to update product' };
    }

    return { data };
  } catch (error) {
    return { error: 'Network error occurred' };
  }
}

// DELETE /api/products/[id] - Delete a product (admin/owner only)
export async function deleteProduct(id: number): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/products/${id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error ?? 'Failed to delete product' };
    }

    return { data };
  } catch (error) {
    return { error: 'Network error occurred' };
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

// Utility function to get primary image URL
export function getPrimaryImageUrl(product: Product): string {
  const primaryImage = product.images.find(img => img.isPrimary);
  return primaryImage?.imageUrl ?? product.images[0]?.imageUrl ?? '/placeholder.svg';
}

// Utility function to check if user can edit product (placeholder for auth)
export function canEditProduct(product: Product, userId?: string): boolean {
  // TODO: Implement proper authorization logic
  // For now, return false (will be updated when auth is implemented)
  return false;
}

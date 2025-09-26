// Store API utility functions
import { getBaseUrl, type ApiResponse } from './config';

export interface Store {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  productCount?: number; // Only included when fetched with product count
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
  
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.search) searchParams.append('search', params.search);

  const response = await fetch(`${getBaseUrl()}/api/stores?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch stores: ${response.statusText}`);
  }

  return response.json() as Promise<StoresResponse>;
}

// GET /api/stores/[id] - Fetch a single store by ID
export async function fetchStore(id: string): Promise<Store> {
  const response = await fetch(`${getBaseUrl()}/api/stores/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Store not found');
    }
    throw new Error(`Failed to fetch store: ${response.statusText}`);
  }

  return response.json() as Promise<Store>;
}

// POST /api/stores - Create a new store
export async function createStore(data: CreateStoreData): Promise<Store> {
  const response = await fetch(`${getBaseUrl()}/api/stores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create store: ${response.statusText}`);
  }

  return response.json() as Promise<Store>;
}

// PUT /api/stores/[id] - Update a store
export async function updateStore(id: string, data: UpdateStoreData): Promise<Store> {
  const response = await fetch(`${getBaseUrl()}/api/stores/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw new Error('Store not found');
    }
    throw new Error(errorData.error || `Failed to update store: ${response.statusText}`);
  }

  return response.json() as Promise<Store>;
}

// DELETE /api/stores/[id] - Delete a store
export async function deleteStore(id: string): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/stores/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw new Error('Store not found');
    }
    throw new Error(errorData.error || `Failed to delete store: ${response.statusText}`);
  }
}

// GET /api/stores/featured - Fetch featured stores for homepage
export async function fetchFeaturedStores(limit: number = 6): Promise<Store[]> {
  const response = await fetch(`${getBaseUrl()}/api/stores?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch featured stores: ${response.statusText}`);
  }

  const data: StoresResponse = await response.json();
  return data.stores;
}

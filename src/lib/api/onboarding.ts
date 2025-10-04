// Store/Onboarding API utility functions
import { getBaseUrl, type ApiResponse } from "./config";

export interface Store {
  id: string;
  name: string;
  description: string;
}

export interface CreateStoreData {
  name: string;
  description: string;
}

export interface StoreAvailabilityResponse {
  available: boolean;
  name: string;
}

// POST /api/onboarding - Create a new store
export async function createStore(
  storeData: CreateStoreData,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(storeData),
    });

    const data = (await response.json()) as { id: string } | { error: string };

    if (!response.ok) {
      return {
        error: (data as { error: string }).error ?? "Failed to create store",
      };
    }

    return { data: data as { id: string } };
  } catch {
    return { error: "Network error occurred" };
  }
}

// GET /api/onboarding/[name] - Check if a store name is available
export async function checkStoreNameAvailability(
  name: string,
): Promise<boolean> {
  const response = await fetch(`${getBaseUrl()}/api/onboarding/${name}`);

  if (!response.ok) {
    throw new Error(
      `Failed to check store name availability: ${response.statusText}`,
    );
  }

  const json = (await response.json()) as { hasStore: boolean };
  return !json.hasStore; // true means available
}

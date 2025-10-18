import { getBaseUrl } from "./config";

export type Address = {
  id: number;
  userId: string;
  type: "shipping" | "billing";
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postcode: string;
  country: string;
  isDefault: boolean;
  version: number;
  isArchived: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAddressInput = {
  type: "shipping" | "billing";
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  isDefault?: boolean;
};

export type UpdateAddressInput = {
  id: number;
  type?: "shipping" | "billing";
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  isDefault?: boolean;
};

export async function fetchAddresses(): Promise<{
  addresses: Address[];
}> {
  const base = getBaseUrl();
  const url = new URL("/api/addresses", base);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch addresses: ${res.status}`);

  const data = (await res.json()) as { addresses: Address[] };

  return data;
}

export async function createAddress(
  data: CreateAddressInput,
): Promise<{ address: Address }> {
  const base = getBaseUrl();
  const url = new URL("/api/addresses", base);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      message?: string;
    };
    const message = errorData.message ?? "Failed to create address";
    throw new Error(message);
  }
  return (await res.json()) as { address: Address };
}

export async function updateAddress(
  data: UpdateAddressInput,
): Promise<{ address: Address }> {
  const base = getBaseUrl();
  const url = new URL("/api/addresses", base);
  const res = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      message?: string;
    };
    const message = errorData.message ?? "Failed to update address";
    throw new Error(message);
  }
  return (await res.json()) as { address: Address };
}

export async function deleteAddress(
  id: number,
): Promise<{ success: boolean; message: string }> {
  const base = getBaseUrl();
  const url = new URL("/api/addresses", base);
  url.searchParams.set("id", id.toString());
  const res = await fetch(url.toString(), {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      message?: string;
    };
    const message = errorData.message ?? "Failed to delete address";
    throw new Error(message);
  }
  return (await res.json()) as { success: boolean; message: string };
}

export async function setDefaultAddress(
  id: number,
  type: "shipping" | "billing",
): Promise<{ address: Address }> {
  return updateAddress({ id, isDefault: true, type });
}

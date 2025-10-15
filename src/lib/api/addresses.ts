import { getBaseUrl } from "./config";

export type AddressDTO = {
  id: number;
  userId: string;
  type: "shipping" | "billing";
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
};

export type CreateAddressInput = {
  type: "shipping" | "billing";
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
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
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
};

export async function fetchAddresses(): Promise<{ addresses: AddressDTO[] }> {
  const base = getBaseUrl();
  const url = new URL("/api/addresses", base);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch addresses: ${res.status}`);
  return res.json();
}

export async function createAddress(data: CreateAddressInput): Promise<{ address: AddressDTO }> {
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
    const error = await res.json().catch(() => ({ error: "Failed to create address" }));
    throw new Error(error.error || "Failed to create address");
  }
  return res.json();
}

export async function updateAddress(data: UpdateAddressInput): Promise<{ address: AddressDTO }> {
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
    const error = await res.json().catch(() => ({ error: "Failed to update address" }));
    throw new Error(error.error || "Failed to update address");
  }
  return res.json();
}

export async function deleteAddress(id: number): Promise<{ success: boolean; message: string }> {
  const base = getBaseUrl();
  const url = new URL("/api/addresses", base);
  url.searchParams.set("id", id.toString());
  const res = await fetch(url.toString(), {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to delete address" }));
    throw new Error(error.error || "Failed to delete address");
  }
  return res.json();
}

export async function setDefaultAddress(id: number, type: "shipping" | "billing"): Promise<{ address: AddressDTO }> {
  return updateAddress({ id, isDefault: true, type });
}

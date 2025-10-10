import { getBaseUrl } from "./config";

export type AddressResponse = {
  id: number;
  userId: string;
  type: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  version: number;
  isArchived: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchAddresses(): Promise<{
  addresses: AddressResponse[];
}> {
  const base = getBaseUrl();
  const url = new URL("/api/addresses", base);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch addresses: ${res.status}`);
  return res.json() as Promise<{ addresses: AddressResponse[] }>;
}

export interface AddressCreateInput {
  type: "shipping" | "billing";
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface AddressUpdateInput extends Partial<AddressCreateInput> {
  version: number;
}

export async function createAddress(
  input: AddressCreateInput,
): Promise<{ address: AddressResponse }> {
  const base = getBaseUrl();
  const url = new URL("/api/addresses", base);
  const res = await fetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create address: ${res.status}`);
  return res.json() as Promise<{ address: AddressResponse }>;
}

export async function updateAddress(
  id: number,
  input: AddressUpdateInput,
): Promise<{ address: AddressResponse }> {
  const base = getBaseUrl();
  const url = new URL("/api/addresses", base);
  url.searchParams.set("id", String(id));
  const res = await fetch(url.toString(), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 409) throw new Error("Conflict");
  if (!res.ok) throw new Error(`Failed to update address: ${res.status}`);
  return res.json() as Promise<{ address: AddressResponse }>;
}

export async function deleteAddress(id: number): Promise<{ success: boolean }> {
  const base = getBaseUrl();
  const url = new URL("/api/addresses", base);
  url.searchParams.set("id", String(id));
  const res = await fetch(url.toString(), {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete address: ${res.status}`);
  return res.json() as Promise<{ success: boolean }>;
}

// Admin endpoints
export async function adminFetchCustomerAddresses(
  customerId: string,
  storeId: string,
): Promise<{ addresses: AddressResponse[] }> {
  const base = getBaseUrl();
  const url = new URL(`/api/admin/customers/${customerId}/addresses`, base);
  url.searchParams.set("storeId", storeId);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok)
    throw new Error(`Failed to fetch customer addresses: ${res.status}`);
  return res.json() as Promise<{ addresses: AddressResponse[] }>;
}

export async function adminCreateCustomerAddress(
  customerId: string,
  storeId: string,
  input: AddressCreateInput,
): Promise<{ address: AddressResponse }> {
  const base = getBaseUrl();
  const url = new URL(`/api/admin/customers/${customerId}/addresses`, base);
  url.searchParams.set("storeId", storeId);
  const res = await fetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok)
    throw new Error(`Failed to create customer address: ${res.status}`);
  return res.json() as Promise<{ address: AddressResponse }>;
}

export async function adminUpdateCustomerAddress(
  customerId: string,
  storeId: string,
  addressId: number,
  input: AddressUpdateInput,
): Promise<{ address: AddressResponse }> {
  const base = getBaseUrl();
  const url = new URL(`/api/admin/customers/${customerId}/addresses`, base);
  url.searchParams.set("storeId", storeId);
  url.searchParams.set("addressId", String(addressId));
  const res = await fetch(url.toString(), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 409) throw new Error("Conflict");
  if (!res.ok)
    throw new Error(`Failed to update customer address: ${res.status}`);
  return res.json() as Promise<{ address: AddressResponse }>;
}

export async function adminDeleteCustomerAddress(
  customerId: string,
  storeId: string,
  addressId: number,
): Promise<{ success: boolean }> {
  const base = getBaseUrl();
  const url = new URL(`/api/admin/customers/${customerId}/addresses`, base);
  url.searchParams.set("storeId", storeId);
  url.searchParams.set("addressId", String(addressId));
  const res = await fetch(url.toString(), {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok)
    throw new Error(`Failed to delete customer address: ${res.status}`);
  return res.json() as Promise<{ success: boolean }>;
}

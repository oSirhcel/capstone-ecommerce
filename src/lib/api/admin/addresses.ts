import { getBaseUrl } from "../config";

import {
  type CreateAddressInput,
  type Address,
  type UpdateAddressInput,
} from "../addresses";

// Admin endpoints
export async function adminFetchCustomerAddresses(
  customerId: string,
  storeId: string,
): Promise<{ addresses: Address[] }> {
  const base = getBaseUrl();
  const url = new URL(`/api/admin/customers/${customerId}/addresses`, base);
  url.searchParams.set("storeId", storeId);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok)
    throw new Error(`Failed to fetch customer addresses: ${res.status}`);
  return res.json() as Promise<{ addresses: Address[] }>;
}

export async function adminCreateCustomerAddress(
  customerId: string,
  storeId: string,
  input: CreateAddressInput,
): Promise<{ address: Address }> {
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
  return res.json() as Promise<{ address: Address }>;
}

export async function adminUpdateCustomerAddress(
  customerId: string,
  storeId: string,
  addressId: number,
  input: UpdateAddressInput,
): Promise<{ address: Address }> {
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
  return res.json() as Promise<{ address: Address }>;
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

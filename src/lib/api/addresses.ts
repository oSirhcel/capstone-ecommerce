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
  createdAt: string;
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

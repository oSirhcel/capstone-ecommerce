import { getBaseUrl } from "./config";

export type OrderItemDTO = {
  id: number;
  productId: number;
  productName?: string | null;
  quantity: number;
  priceAtTime: number; // cents
};

export type OrderDTO = {
  id: number;
  status: string;
  totalAmount: number; // cents
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
};

export async function fetchOrders(params?: { page?: number; limit?: number }): Promise<{ orders: OrderDTO[]; pagination: { page: number; limit: number; hasMore: boolean } }> {
  const base = getBaseUrl();
  const url = new URL("/api/orders", base);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
  return res.json();
}

export async function fetchOrderById(id: number): Promise<{ order: OrderDTO }> {
  const base = getBaseUrl();
  const url = new URL("/api/orders", base);
  url.searchParams.set("id", String(id));
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch order ${id}: ${res.status}`);
  return res.json();
}



import { z } from "zod";

export const ordersListQuerySchema = z.object({
  storeId: z.string().min(1),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().nullish(),
  status: z
    .enum([
      "pending",
      "processing",
      "shipped",
      "completed",
      "cancelled",
      "refunded",
      "on-hold",
      "failed",
    ])
    .nullish(),
  sortBy: z.enum(["createdAt", "totalAmount", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  dateFrom: z.string().nullish(),
  dateTo: z.string().nullish(),
});

export type OrdersListQuery = z.infer<typeof ordersListQuerySchema>;

export const orderUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "processing",
    "shipped",
    "completed",
    "cancelled",
    "refunded",
    "on-hold",
    "failed",
  ]),
});

export type OrderUpdate = z.infer<typeof orderUpdateSchema>;

export interface OrderListItem {
  id: number;
  customer: { name: string; email: string };
  amount: number; // dollars
  status: string;
  date: string; // ISO
  items: number;
  paymentStatus: string; // placeholder
}

export interface OrderDetailItem {
  id: number;
  productId: number;
  productName: string | null;
  quantity: number;
  priceAtTime: number; // cents
}

export interface OrderDetail {
  id: number;
  status: string;
  totalAmount: number; // cents
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; email: string };
  items: OrderDetailItem[];
  addresses: Array<{
    id: number;
    type: "shipping" | "billing";
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    createdAt: string;
  }>;
  payment: { status: string };
  timeline: Array<unknown>;
}

export interface OrderStats {
  totalOrders: number;
  revenue: string; // dollars as fixed string
  averageOrderValue: string; // dollars as fixed string
  activeCustomers: number;
  changes: {
    totalOrders: number;
    revenue: number;
    averageOrderValue: number;
    activeCustomers: number;
  };
}

export async function fetchOrders(params: Partial<OrdersListQuery>) {
  const sp = new URLSearchParams();
  if (params.storeId) sp.set("storeId", params.storeId);
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.sortBy) sp.set("sortBy", params.sortBy);
  if (params.sortOrder) sp.set("sortOrder", params.sortOrder);
  if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
  if (params.dateTo) sp.set("dateTo", params.dateTo);

  const res = await fetch(`/api/admin/orders?${sp.toString()}`);
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to fetch orders");
  }
  return res.json() as Promise<{
    orders: OrderListItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;
}

export async function fetchOrder(id: number, storeId: string) {
  const res = await fetch(`/api/admin/orders/${id}?storeId=${storeId}`);
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to fetch order");
  }
  return res.json() as Promise<OrderDetail>;
}

export async function updateOrder(
  id: number,
  storeId: string,
  data: OrderUpdate,
) {
  const res = await fetch(`/api/admin/orders/${id}?storeId=${storeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to update order");
  }
  return res.json() as Promise<{
    success: boolean;
    order: { id: number; status: string };
  }>;
}

export async function fetchOrderStats(params: {
  storeId: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const sp = new URLSearchParams({ storeId: params.storeId });
  if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
  if (params.dateTo) sp.set("dateTo", params.dateTo);
  const res = await fetch(`/api/admin/orders/stats?${sp.toString()}`);
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to fetch order stats");
  }
  return res.json() as Promise<OrderStats>;
}

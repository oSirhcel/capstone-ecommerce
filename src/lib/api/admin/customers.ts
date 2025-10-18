import { z } from "zod";

// Query parameters for customer list
export const customersListQuerySchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().nullish(),
  status: z.enum(["Active", "Inactive", "Suspended"]).nullish(),
  sortBy: z.enum(["name", "joinDate", "totalSpent"]).default("joinDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CustomersListQuery = z.infer<typeof customersListQuerySchema>;

// Customer update schema (admin-editable fields only)
export const customerUpdateSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  tags: z.array(z.string()).optional(),
  adminNotes: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Suspended"]).optional(),
});

export type CustomerUpdate = z.infer<typeof customerUpdateSchema>;

// Address schemas
export const addressCreateSchema = z.object({
  type: z.enum(["shipping", "billing"]),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postcode: z.string().min(3),
  country: z.string().min(2),
  isDefault: z.boolean().default(false),
});

export type AddressCreate = z.infer<typeof addressCreateSchema>;

export const addressUpdateSchema = addressCreateSchema.partial();

export type AddressUpdate = z.infer<typeof addressUpdateSchema>;

// Orders query schema
export const ordersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.string().nullish(),
});

export type OrdersQuery = z.infer<typeof ordersQuerySchema>;

// API Response Types
export interface CustomerListItem {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Inactive" | "Suspended";
  tags: string[];
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
}

export interface CustomerDetail {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: "Active" | "Inactive" | "Suspended";
  customerSince: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  tags: string[];
  notes: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrder?: string;
}

export interface CustomerAddress {
  id: number;
  type: "shipping" | "billing";
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CustomerOrder {
  id: number;
  orderNumber: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  paymentStatus: string;
}

// API Client Functions
export async function fetchCustomers(params?: {
  storeId?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.storeId) searchParams.set("storeId", params.storeId);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.search) searchParams.set("search", params.search);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const response = await fetch(`/api/admin/customers?${searchParams}`);

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to fetch customers");
  }

  return response.json() as Promise<{
    customers: CustomerListItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;
}

export async function fetchCustomer(customerId: string, storeId: string) {
  const response = await fetch(
    `/api/admin/customers/${customerId}?storeId=${storeId}`,
  );

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to fetch customer");
  }

  return response.json() as Promise<CustomerDetail>;
}

export async function updateCustomer(
  customerId: string,
  storeId: string,
  data: CustomerUpdate,
) {
  const response = await fetch(
    `/api/admin/customers/${customerId}?storeId=${storeId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to update customer");
  }

  return response.json() as Promise<CustomerDetail>;
}

export async function fetchCustomerAddresses(
  customerId: string,
  storeId: string,
) {
  const response = await fetch(
    `/api/admin/customers/${customerId}/addresses?storeId=${storeId}`,
  );

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to fetch addresses");
  }

  return response.json() as Promise<{ addresses: CustomerAddress[] }>;
}

export async function createCustomerAddress(
  customerId: string,
  storeId: string,
  data: AddressCreate,
) {
  const response = await fetch(
    `/api/admin/customers/${customerId}/addresses?storeId=${storeId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to create address");
  }

  return response.json() as Promise<{ address: CustomerAddress }>;
}

export async function updateCustomerAddress(
  customerId: string,
  addressId: string,
  storeId: string,
  data: AddressUpdate,
) {
  const response = await fetch(
    `/api/admin/customers/${customerId}/addresses/${addressId}?storeId=${storeId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to update address");
  }

  return response.json() as Promise<{ address: CustomerAddress }>;
}

export async function deleteCustomerAddress(
  customerId: string,
  addressId: string,
  storeId: string,
) {
  const response = await fetch(
    `/api/admin/customers/${customerId}/addresses/${addressId}?storeId=${storeId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to delete address");
  }

  return response.json() as Promise<{ success: boolean }>;
}

export async function fetchCustomerOrders(
  customerId: string,
  storeId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
  },
) {
  const searchParams = new URLSearchParams({ storeId });

  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.status) searchParams.set("status", params.status);

  const response = await fetch(
    `/api/admin/customers/${customerId}/orders?${searchParams}`,
  );

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to fetch orders");
  }

  return response.json() as Promise<{
    orders: CustomerOrder[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;
}

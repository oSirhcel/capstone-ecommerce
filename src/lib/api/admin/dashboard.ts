import { z } from "zod";

export const dashboardMetricsSchema = z.object({
  revenue: z.object({
    value: z.string(),
    change: z.string(),
    trend: z.enum(["up", "down"]),
  }),
  activeUsers: z.object({
    value: z.string(),
    change: z.string(),
    trend: z.enum(["up", "down"]),
  }),
  totalProducts: z.object({
    value: z.string(),
    change: z.string(),
    trend: z.enum(["up", "down"]),
  }),
  totalOrders: z.object({
    value: z.string(),
    change: z.string(),
    trend: z.enum(["up", "down"]),
  }),
});

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;

export const salesDataSchema = z.array(
  z.object({
    name: z.string(),
    sales: z.number(),
    orders: z.number(),
  }),
);

export type SalesData = z.infer<typeof salesDataSchema>;

export const activitySchema = z.object({
  id: z.number(),
  user: z.string(),
  avatar: z.string().nullable(),
  action: z.string(),
  target: z.string(),
  time: z.string(),
  type: z.string(),
});

export const activityResponseSchema = z.object({
  activities: z.array(activitySchema),
});

export type Activity = z.infer<typeof activitySchema>;
export type ActivityResponse = z.infer<typeof activityResponseSchema>;

export const recentOrderSchema = z.object({
  id: z.string(),
  customer: z.string(),
  amount: z.string(),
  status: z.string(),
  date: z.string(),
});

export const recentOrdersResponseSchema = z.object({
  orders: z.array(recentOrderSchema),
});

export type RecentOrder = z.infer<typeof recentOrderSchema>;
export type RecentOrdersResponse = z.infer<typeof recentOrdersResponseSchema>;

export interface DashboardMetricsParams {
  storeId: string;
  period?: "month" | "year";
}

export interface SalesDataParams {
  storeId: string;
  year?: number;
}

export interface ActivityParams {
  storeId: string;
  limit?: number;
}

export interface RecentOrdersParams {
  storeId: string;
  limit?: number;
}

export async function fetchDashboardMetrics(
  params: DashboardMetricsParams,
): Promise<DashboardMetrics> {
  const searchParams = new URLSearchParams({
    storeId: params.storeId,
  });

  if (params.period) {
    searchParams.append("period", params.period);
  }

  const response = await fetch(`/api/admin/dashboard/metrics?${searchParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = (await response.json()) as { error: string };
    throw new Error(error.error ?? "Failed to fetch dashboard metrics");
  }

  const data = (await response.json()) as DashboardMetrics;
  const result = dashboardMetricsSchema.safeParse(data);

  if (!result.success) {
    console.error("Metrics validation error:", result.error);
    throw new Error("Invalid metrics data received from server");
  }

  return result.data;
}

export async function fetchSalesData(
  params: SalesDataParams,
): Promise<SalesData> {
  const searchParams = new URLSearchParams({
    storeId: params.storeId,
  });

  if (params.year) {
    searchParams.append("year", params.year.toString());
  }

  const response = await fetch(`/api/admin/dashboard/sales?${searchParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = (await response.json()) as { error: string };
    throw new Error(error.error ?? "Failed to fetch sales data");
  }

  const data = (await response.json()) as SalesData;
  const result = salesDataSchema.safeParse(data);

  if (!result.success) {
    console.error("Sales data validation error:", result.error);
    throw new Error("Invalid sales data received from server");
  }

  return result.data;
}

export async function fetchActivity(
  params: ActivityParams,
): Promise<ActivityResponse> {
  const searchParams = new URLSearchParams({
    storeId: params.storeId,
  });

  if (params.limit) {
    searchParams.append("limit", params.limit.toString());
  }

  const response = await fetch(
    `/api/admin/dashboard/activity?${searchParams}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { error: string };
    throw new Error(error.error ?? "Failed to fetch activity data");
  }

  const data = (await response.json()) as ActivityResponse;
  const result = activityResponseSchema.safeParse(data);

  if (!result.success) {
    console.error("Activity validation error:", result.error);
    throw new Error("Invalid activity data received from server");
  }

  return result.data;
}

export async function fetchRecentOrders(
  params: RecentOrdersParams,
): Promise<RecentOrdersResponse> {
  const searchParams = new URLSearchParams({
    storeId: params.storeId,
  });

  if (params.limit) {
    searchParams.append("limit", params.limit.toString());
  }

  const response = await fetch(
    `/api/admin/dashboard/recent-orders?${searchParams}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { error: string };
    throw new Error(error.error ?? "Failed to fetch recent orders");
  }

  const data = (await response.json()) as RecentOrdersResponse;
  const result = recentOrdersResponseSchema.safeParse(data);

  if (!result.success) {
    console.error("Recent orders validation error:", result.error);
    throw new Error("Invalid recent orders data received from server");
  }

  return result.data;
}

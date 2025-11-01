export interface KeyMetricsResponse {
  totalRevenue: {
    value: string;
    change: string;
    trend: "up" | "down";
  };
  conversionRate: {
    value: string;
    change: string;
    trend: "up" | "down";
  };
  avgOrderValue: {
    value: string;
    change: string;
    trend: "up" | "down";
  };
  customerLifetimeValue: {
    value: string;
    change: string;
    trend: "up" | "down";
  };
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  orders: number;
  profit: number;
}

export interface CategoryPerformance {
  category: string;
  sales: number;
  orders: number;
  growth: number;
}

export interface ConversionStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface TrafficSource {
  name: string;
  value: number;
  percentage: number;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  revenue: number;
  avgOrder: number;
}

export async function fetchMetrics(
  dateFrom?: string,
  dateTo?: string,
  categoryId?: string,
): Promise<KeyMetricsResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);

  const res = await fetch(`/api/admin/analytics/metrics?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json() as Promise<KeyMetricsResponse>;
}

export async function fetchRevenue(year?: number): Promise<RevenueDataPoint[]> {
  const params = new URLSearchParams();
  if (year) params.set("year", year.toString());

  const res = await fetch(`/api/admin/analytics/revenue?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch revenue");
  return res.json() as Promise<RevenueDataPoint[]>;
}

export async function fetchCategories(
  dateFrom?: string,
  dateTo?: string,
): Promise<CategoryPerformance[]> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const res = await fetch(
    `/api/admin/analytics/categories?${params.toString()}`,
  );
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json() as Promise<CategoryPerformance[]>;
}

export async function fetchConversion(
  dateFrom?: string,
  dateTo?: string,
): Promise<ConversionStage[]> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const res = await fetch(
    `/api/admin/analytics/conversion?${params.toString()}`,
  );
  if (!res.ok) throw new Error("Failed to fetch conversion");
  return res.json() as Promise<ConversionStage[]>;
}

export async function fetchTraffic(
  dateFrom?: string,
  dateTo?: string,
): Promise<TrafficSource[]> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const res = await fetch(`/api/admin/analytics/traffic?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch traffic");
  return res.json() as Promise<TrafficSource[]>;
}

export async function fetchCustomers(
  dateFrom?: string,
  dateTo?: string,
): Promise<CustomerSegment[]> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const res = await fetch(
    `/api/admin/analytics/customers?${params.toString()}`,
  );
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json() as Promise<CustomerSegment[]>;
}

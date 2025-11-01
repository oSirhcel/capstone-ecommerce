"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchMetrics,
  fetchRevenue,
  fetchCategories,
  fetchConversion,
  fetchTraffic,
  fetchCustomers,
  type KeyMetricsResponse,
  type RevenueDataPoint,
  type CategoryPerformance,
  type ConversionStage,
  type TrafficSource,
  type CustomerSegment,
} from "@/lib/api/admin/analytics";

export function useAnalyticsMetricsQuery(
  dateFrom?: string,
  dateTo?: string,
  categoryId?: string,
) {
  return useQuery<KeyMetricsResponse>({
    queryKey: ["analytics", "metrics", dateFrom, dateTo, categoryId],
    queryFn: () => fetchMetrics(dateFrom, dateTo, categoryId),
  });
}

export function useAnalyticsRevenueQuery(year?: number) {
  return useQuery<RevenueDataPoint[]>({
    queryKey: ["analytics", "revenue", year],
    queryFn: () => fetchRevenue(year),
  });
}

export function useAnalyticsCategoriesQuery(
  dateFrom?: string,
  dateTo?: string,
) {
  return useQuery<CategoryPerformance[]>({
    queryKey: ["analytics", "categories", dateFrom, dateTo],
    queryFn: () => fetchCategories(dateFrom, dateTo),
  });
}

export function useAnalyticsConversionQuery(
  dateFrom?: string,
  dateTo?: string,
) {
  return useQuery<ConversionStage[]>({
    queryKey: ["analytics", "conversion", dateFrom, dateTo],
    queryFn: () => fetchConversion(dateFrom, dateTo),
  });
}

export function useAnalyticsTrafficQuery(dateFrom?: string, dateTo?: string) {
  return useQuery<TrafficSource[]>({
    queryKey: ["analytics", "traffic", dateFrom, dateTo],
    queryFn: () => fetchTraffic(dateFrom, dateTo),
  });
}

export function useAnalyticsCustomersQuery(dateFrom?: string, dateTo?: string) {
  return useQuery<CustomerSegment[]>({
    queryKey: ["analytics", "customers", dateFrom, dateTo],
    queryFn: () => fetchCustomers(dateFrom, dateTo),
  });
}

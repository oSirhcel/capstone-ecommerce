import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardMetrics,
  fetchSalesData,
  fetchActivity,
  fetchRecentOrders,
  type DashboardMetrics,
  type SalesData,
  type ActivityResponse,
  type RecentOrdersResponse,
} from "@/lib/api/admin/dashboard";

export function useDashboardMetricsQuery(storeId: string | undefined) {
  return useQuery<DashboardMetrics, Error>({
    queryKey: ["dashboard-metrics", storeId],
    queryFn: () => fetchDashboardMetrics({ storeId: storeId! }),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useSalesDataQuery(storeId: string | undefined, year?: number) {
  return useQuery<SalesData, Error>({
    queryKey: ["sales-data", storeId, year],
    queryFn: () => fetchSalesData({ storeId: storeId!, year }),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useActivityQuery(storeId: string | undefined, limit?: number) {
  return useQuery<ActivityResponse, Error>({
    queryKey: ["activity", storeId, limit],
    queryFn: () => fetchActivity({ storeId: storeId!, limit }),
    enabled: !!storeId,
    staleTime: 1 * 60 * 1000, // 1 minute - activity updates more frequently
    refetchOnWindowFocus: true,
  });
}

export function useRecentOrdersQuery(
  storeId: string | undefined,
  limit?: number,
) {
  return useQuery<RecentOrdersResponse, Error>({
    queryKey: ["recent-orders", storeId, limit],
    queryFn: () => fetchRecentOrders({ storeId: storeId!, limit }),
    enabled: !!storeId,
    staleTime: 1 * 60 * 1000, // 1 minute - orders update more frequently
    refetchOnWindowFocus: true,
  });
}

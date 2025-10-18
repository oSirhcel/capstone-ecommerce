import { useQuery } from "@tanstack/react-query";
import { fetchOrderStats } from "@/lib/api/admin/orders";

export function useOrderStats(params: {
  storeId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    enabled: !!params.storeId,
    queryKey: ["admin-order-stats", params],
    queryFn: () =>
      fetchOrderStats({
        storeId: params.storeId!,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      }),
  });
}

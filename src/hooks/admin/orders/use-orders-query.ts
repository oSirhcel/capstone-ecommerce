import { useQuery } from "@tanstack/react-query";
import { fetchOrders, type OrdersListQuery } from "@/lib/api/admin/orders";

export function useOrdersQuery(params: Partial<OrdersListQuery>) {
  return useQuery({
    enabled: !!params.storeId,
    queryKey: ["admin-orders", params],
    queryFn: () => fetchOrders(params),
  });
}

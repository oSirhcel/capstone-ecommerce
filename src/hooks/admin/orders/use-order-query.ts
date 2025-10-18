import { useQuery } from "@tanstack/react-query";
import { fetchOrder } from "@/lib/api/admin/orders";

export function useOrderQuery(params: { id?: number; storeId?: string }) {
  return useQuery({
    enabled: !!params.id && !!params.storeId,
    queryKey: ["admin-order", params.id, params.storeId],
    queryFn: () => fetchOrder(params.id!, params.storeId!),
  });
}

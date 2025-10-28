import { useQuery } from "@tanstack/react-query";
import { fetchOrderById } from "@/lib/api/orders";

export function useOrderQuery(orderId: number) {
  return useQuery({
    enabled: !!orderId,
    queryKey: ["order", orderId],
    queryFn: () => fetchOrderById(orderId),
  });
}

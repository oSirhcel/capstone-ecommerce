import { useQuery } from "@tanstack/react-query";
import { fetchStores } from "@/lib/api/stores";

export function useStoresQuery(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["stores", params],
    queryFn: () => fetchStores(params),
  });
}

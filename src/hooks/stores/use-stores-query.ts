import { useQuery } from "@tanstack/react-query";
import { fetchStores } from "@/lib/api/stores";

export function useStoresQuery(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: number;
  sort?: string;
}) {
  return useQuery({
    queryKey: ["stores", params],
    queryFn: () => fetchStores(params),
  });
}

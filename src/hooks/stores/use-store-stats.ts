import { useQuery } from "@tanstack/react-query";
import { fetchStoreStats } from "@/lib/api/stores";

export function useStoreStats(storeId: string) {
  return useQuery({
    queryKey: ["store-stats", storeId],
    queryFn: () => fetchStoreStats(storeId),
    enabled: !!storeId,
  });
}

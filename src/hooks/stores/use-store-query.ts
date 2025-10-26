import { useQuery } from "@tanstack/react-query";
import { fetchStoreDetails } from "@/lib/api/stores";

export function useStoreQuery(storeId: string) {
  return useQuery({
    queryKey: ["store", storeId],
    queryFn: () => fetchStoreDetails(storeId),
    enabled: !!storeId,
  });
}

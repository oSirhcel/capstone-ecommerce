import { useQuery } from "@tanstack/react-query";
import { fetchStoreDetailsBySlug } from "@/lib/api/stores";

export function useStoreQueryBySlug(slug: string) {
  return useQuery({
    queryKey: ["store", "slug", slug],
    queryFn: () => fetchStoreDetailsBySlug(slug),
    enabled: !!slug,
  });
}

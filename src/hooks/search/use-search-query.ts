import { useQuery } from "@tanstack/react-query";
import { searchContent } from "@/lib/api/search";

export function useSearchQuery(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchContent(query),
    enabled: query.trim().length > 0,
  });
}

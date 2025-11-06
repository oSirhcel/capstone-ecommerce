import { useQuery } from "@tanstack/react-query";
import { fetchTags } from "@/lib/api/tags";

export function useTagsQuery() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

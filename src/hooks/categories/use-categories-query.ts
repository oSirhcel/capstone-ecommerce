import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/api/categories";

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });
}

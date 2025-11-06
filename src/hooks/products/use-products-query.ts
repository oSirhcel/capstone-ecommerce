import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api/products";

export function useProductsQuery(params?: {
  page?: number;
  limit?: number;
  category?: number;
  store?: string;
  search?: string;
  status?: "Active" | "Draft" | "Archived" | "all";
  sort?:
    | "price-low"
    | "price-high"
    | "rating-low"
    | "rating-high"
    | "name-asc"
    | "name-desc"
    | "release-newest"
    | "release-oldest";
}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts(params),
  });
}

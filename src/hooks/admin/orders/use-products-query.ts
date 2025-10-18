import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api/products";

export function useProductsQuery(storeId: string, search?: string) {
  return useQuery({
    queryKey: ["admin-products", storeId, search],
    queryFn: () =>
      fetchProducts({
        store: storeId,
        search,
        limit: 50, // Get more products for selection
      }),
    enabled: !!storeId,
  });
}

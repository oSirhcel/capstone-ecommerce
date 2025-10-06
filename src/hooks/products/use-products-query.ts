import { useQuery } from "@tanstack/react-query";
import { fetchProducts, type ProductsResponse } from "@/lib/api/products";

export function useProductsQuery(params?: {
  page?: number;
  limit?: number;
  category?: number;
  store?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts(params),
  });
}

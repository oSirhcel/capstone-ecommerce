import { useQuery } from "@tanstack/react-query";
import { fetchProduct } from "@/lib/api/products";

export function useProductQuery(id: number) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });
}

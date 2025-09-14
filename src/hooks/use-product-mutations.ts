import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct, type CreateProductData } from "@/lib/api/products";
import { toast } from "sonner";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData: CreateProductData) => createProduct(productData),
    onSuccess: (response) => {
      if (response.data) {
        // Invalidate and refetch products list
        void queryClient.invalidateQueries({ queryKey: ["products"] });

        // Add the new product to the cache
        queryClient.setQueryData(
          ["product", response.data.product.id],
          response.data.product,
        );

        toast.success("Product created successfully!");
      } else if (response.error) {
        toast.error(response.error);
      }
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast.error("Failed to create product. Please try again.");
    },
  });
}

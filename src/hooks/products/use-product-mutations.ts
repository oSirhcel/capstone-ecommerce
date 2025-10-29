import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  type CreateProductData,
  type UpdateProductData,
} from "@/lib/api/products";
import { toast } from "sonner";

interface GenerateProductShotData {
  image: string;
  productName: string;
  description: string;
  preset: string;
  includeHands: boolean;
  size: string;
  variations: number;
  replaceBackground: boolean;
  highDetail: boolean;
}

interface GenerateProductShotResponse {
  success: boolean;
  images?: string[];
  text?: string;
  usage?: unknown;
  error?: string;
}

async function generateProductShot(
  data: GenerateProductShotData,
): Promise<GenerateProductShotResponse> {
  const response = await fetch("/api/generate-product-shot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { error?: string };
    throw new Error(errorData.error ?? "Failed to generate product shots");
  }

  return (await response.json()) as GenerateProductShotResponse;
}

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

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateProductData }) =>
      updateProduct(id, updates),
    onSuccess: (response, variables) => {
      if (response.data) {
        // Invalidate and refetch products list
        void queryClient.invalidateQueries({ queryKey: ["products"] });

        // Update the product in the cache
        queryClient.setQueryData(
          ["product", variables.id],
          response.data.product,
        );

        toast.success("Product updated successfully!");
      } else if (response.error) {
        toast.error(response.error);
      }
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast.error("Failed to update product. Please try again.");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: (response, productId) => {
      if (response.data) {
        // Invalidate and refetch products list
        void queryClient.invalidateQueries({ queryKey: ["products"] });

        // Remove the product from the cache
        queryClient.removeQueries({ queryKey: ["product", productId] });

        toast.success("Product deleted successfully!");
      } else if (response.error) {
        toast.error(response.error);
      }
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product. Please try again.");
    },
  });
}

export function useGenerateProductShot() {
  return useMutation<
    GenerateProductShotResponse,
    Error,
    GenerateProductShotData
  >({
    mutationFn: generateProductShot,
    onSuccess: (data) => {
      if (data.success && data.images) {
        toast.success(
          `Successfully generated ${data.images.length} product shot${data.images.length > 1 ? "s" : ""}!`,
        );
      } else {
        toast.error("No images were generated");
      }
    },
    onError: (error) => {
      console.error("Error generating product shots:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Failed to generate product shots"}`,
      );
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStore, type CreateStoreData } from "@/lib/api/onboarding";
import { toast } from "sonner";

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeData: CreateStoreData) => createStore(storeData),
    onSuccess: (response) => {
      if (response.data) {
        // Invalidate any store-related queries
        void queryClient.invalidateQueries({ queryKey: ["stores"] });

        toast.success("Store created successfully!");
      } else if (response.error) {
        toast.error(response.error);
      }
    },
    onError: (error) => {
      console.error("Error creating store:", error);
      toast.error("Failed to create store. Please try again.");
    },
  });
}

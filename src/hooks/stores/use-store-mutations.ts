import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateStoreComplete } from "@/lib/api/stores";

interface UpdateStoreCompleteData {
  slug: string;
  name?: string;
  description?: string;
  newSlug?: string;
  contactEmail?: string;
  shippingPolicy?: string;
  returnPolicy?: string;
  privacyPolicy?: string;
  termsOfService?: string;
}

export function useStoreMutations() {
  const queryClient = useQueryClient();

  const updateStoreMutation = useMutation({
    mutationFn: async (data: UpdateStoreCompleteData) => {
      return updateStoreComplete(data);
    },
    onSuccess: () => {
      // Invalidate store queries
      void queryClient.invalidateQueries({ queryKey: ["store"] });
      void queryClient.invalidateQueries({ queryKey: ["stores"] });

      toast.success("Store updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update store");
    },
  });

  return {
    updateStore: updateStoreMutation.mutateAsync,
    isUpdating: updateStoreMutation.isPending,
  };
}

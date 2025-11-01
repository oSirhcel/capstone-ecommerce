import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTag, deleteTag, type Tag } from "@/lib/api/tags";

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      // Invalidate tags query to refetch updated list
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      // Invalidate tags query to refetch updated list
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

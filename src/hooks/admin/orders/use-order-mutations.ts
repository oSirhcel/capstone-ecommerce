import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrder, type OrderUpdate } from "@/lib/api/admin/orders";

export function useOrderMutations(storeId: string) {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: (vars: { id: number; data: OrderUpdate }) =>
      updateOrder(vars.id, storeId, vars.data),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["admin-order", vars.id, storeId],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  return { updateStatus };
}

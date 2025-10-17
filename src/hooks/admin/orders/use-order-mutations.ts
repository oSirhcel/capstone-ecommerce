import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateOrder,
  createOrder,
  updateOrderDetails,
  type OrderUpdate,
  type OrderCreateInput,
  type OrderEditInput,
} from "@/lib/api/admin/orders";

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

  const create = useMutation({
    mutationFn: (data: OrderCreateInput) => createOrder(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-order-stats"] });
    },
  });

  const updateDetails = useMutation({
    mutationFn: (vars: { id: number; data: OrderEditInput }) =>
      updateOrderDetails(vars.id, storeId, vars.data),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["admin-order", vars.id, storeId],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-order-stats"] });
    },
  });

  return { updateStatus, create, updateDetails };
}

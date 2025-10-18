import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCustomer,
  updateCustomer,
  type CustomerDetail,
  type CustomerUpdate,
} from "@/lib/api/admin/customers";

export function customerQueryKey(customerId: string, storeId: string) {
  return ["admin", "customer", customerId, storeId] as const;
}

export function useCustomer(customerId: string, storeId: string) {
  return useQuery({
    queryKey: customerQueryKey(customerId, storeId),
    queryFn: () => fetchCustomer(customerId, storeId),
    enabled: Boolean(customerId && storeId),
  });
}

export function useUpdateCustomer(customerId: string, storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerUpdate) =>
      updateCustomer(customerId, storeId, data),
    onSuccess: (updatedCustomer: CustomerDetail) => {
      queryClient.setQueryData(
        customerQueryKey(customerId, storeId),
        updatedCustomer,
      );
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

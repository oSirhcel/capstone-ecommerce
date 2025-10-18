import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  type AddressCreate,
  type AddressUpdate,
  type CustomerAddress,
} from "@/lib/api/admin/customers";

export function useCustomerAddresses(
  customerId: string | null,
  storeId: string,
) {
  return useQuery({
    queryKey: ["admin-customer-addresses", customerId, storeId],
    queryFn: () => fetchCustomerAddresses(customerId!, storeId),
    enabled: !!customerId && !!storeId,
  });
}

export function useCreateCustomerAddress(customerId: string, storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddressCreate) =>
      createCustomerAddress(customerId, storeId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin-customer-addresses", customerId, storeId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin-customer", customerId, storeId],
      });
    },
  });
}

export function useUpdateCustomerAddress(customerId: string, storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      id: number;
      values: AddressUpdate & { id: number };
    }) =>
      updateCustomerAddress(customerId, String(vars.id), storeId, vars.values),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin-customer-addresses", customerId, storeId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin-customer", customerId, storeId],
      });
    },
  });
}

export function useDeleteCustomerAddress(customerId: string, storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (address: CustomerAddress) =>
      deleteCustomerAddress(customerId, String(address.id), storeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin-customer-addresses", customerId, storeId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin-customer", customerId, storeId],
      });
    },
  });
}

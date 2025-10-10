import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminCreateCustomerAddress,
  adminDeleteCustomerAddress,
  adminFetchCustomerAddresses,
  adminUpdateCustomerAddress,
  type AddressCreateInput,
  type AddressResponse,
  type AddressUpdateInput,
} from "@/lib/api/addresses";

export function addressesQueryKey(customerId: string, storeId: string) {
  return ["admin", "customer-addresses", customerId, storeId] as const;
}

export function useCustomerAddresses(customerId: string, storeId: string) {
  return useQuery({
    queryKey: addressesQueryKey(customerId, storeId),
    queryFn: () => adminFetchCustomerAddresses(customerId, storeId),
    enabled: Boolean(customerId && storeId),
  });
}

export function useCreateCustomerAddress(customerId: string, storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AddressCreateInput) =>
      adminCreateCustomerAddress(customerId, storeId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: addressesQueryKey(customerId, storeId),
      });
    },
  });
}

export function useUpdateCustomerAddress(customerId: string, storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number; values: AddressUpdateInput }) =>
      adminUpdateCustomerAddress(
        customerId,
        storeId,
        payload.id,
        payload.values,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: addressesQueryKey(customerId, storeId),
      });
    },
  });
}

export function useDeleteCustomerAddress(customerId: string, storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addr: AddressResponse) =>
      adminDeleteCustomerAddress(customerId, storeId, addr.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: addressesQueryKey(customerId, storeId),
      });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminCreateCustomerAddress,
  adminDeleteCustomerAddress,
  adminFetchCustomerAddresses,
  adminUpdateCustomerAddress,
} from "@/lib/api/admin/addresses";
import {
  type CreateAddressInput,
  type Address,
  type UpdateAddressInput,
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
    mutationFn: (values: CreateAddressInput) =>
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
    mutationFn: (payload: { id: number; values: UpdateAddressInput }) =>
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
    mutationFn: (addr: Address) =>
      adminDeleteCustomerAddress(customerId, storeId, addr.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: addressesQueryKey(customerId, storeId),
      });
    },
  });
}

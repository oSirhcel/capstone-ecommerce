import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressDTO,
  type CreateAddressInput,
  type UpdateAddressInput,
} from "@/lib/api/addresses";
import { toast } from "sonner";

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: fetchAddresses,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address added successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to add address", {
        description: error.message,
      });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update address", {
        description: error.message,
      });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete address", {
        description: error.message,
      });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, type }: { id: number; type: "shipping" | "billing" }) =>
      setDefaultAddress(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Default address updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to set default address", {
        description: error.message,
      });
    },
  });
}

// Helper function to get addresses by type
export function useAddressesByType(type: "shipping" | "billing") {
  const { data, ...rest } = useAddresses();
  
  const addresses = data?.addresses.filter((addr) => addr.type === type) || [];
  const defaultAddress = addresses.find((addr) => addr.isDefault);

  return {
    ...rest,
    addresses,
    defaultAddress,
  };
}


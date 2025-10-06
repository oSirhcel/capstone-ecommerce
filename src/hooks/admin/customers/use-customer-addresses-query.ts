import { useQuery } from "@tanstack/react-query";
import { fetchCustomerAddresses } from "@/lib/api/admin/customers";

export const useCustomerAddressesQuery = (params: {
  customerId: string;
  storeId: string;
}) => {
  return useQuery({
    enabled: !!params.customerId && !!params.storeId,
    queryKey: ["customers", params.customerId, "addresses", params.storeId],
    queryFn: () => fetchCustomerAddresses(params.customerId, params.storeId),
  });
};

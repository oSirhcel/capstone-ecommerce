import { fetchCustomer } from "@/lib/api/admin/customers";
import { useQuery } from "@tanstack/react-query";

export const useCustomerQuery = (params: {
  customerId: string;
  storeId?: string;
}) => {
  return useQuery({
    enabled: !!params.customerId && !!params.storeId,
    queryKey: ["customers", params],
    queryFn: () => fetchCustomer(params.customerId, params?.storeId ?? ""),
  });
};

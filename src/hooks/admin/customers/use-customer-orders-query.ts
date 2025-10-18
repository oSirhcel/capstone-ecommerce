import { useQuery } from "@tanstack/react-query";
import { fetchCustomerOrders } from "@/lib/api/admin/customers";

export const useCustomerOrdersQuery = (params: {
  customerId: string;
  storeId: string;
  page?: number;
  limit?: number;
  status?: string;
}) => {
  return useQuery({
    enabled: !!params.customerId && !!params.storeId,
    queryKey: ["customers", params.customerId, "orders", params],
    queryFn: () =>
      fetchCustomerOrders(params.customerId, params.storeId, {
        page: params.page,
        limit: params.limit,
        status: params.status,
      }),
  });
};

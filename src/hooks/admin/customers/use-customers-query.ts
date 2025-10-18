import { fetchCustomers } from "@/lib/api/admin/customers";
import { useQuery } from "@tanstack/react-query";

export const useCustomersQuery = (params?: {
  storeId?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  return useQuery({
    enabled: !!params?.storeId,
    queryKey: ["customers", params],

    queryFn: () => fetchCustomers(params),
  });
};

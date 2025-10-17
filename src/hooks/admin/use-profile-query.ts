import { useQuery } from "@tanstack/react-query";
import { fetchAdminProfile } from "@/lib/api/admin/profile";
import type { AdminProfile } from "@/types/admin";

export function useProfileQuery() {
  return useQuery<AdminProfile, Error>({
    queryKey: ["admin-profile"],
    queryFn: fetchAdminProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

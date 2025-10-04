import { useQuery } from "@tanstack/react-query";
import { checkStoreNameAvailability } from "@/lib/api/onboarding";

export function useStoreNameAvailability(name: string) {
  return useQuery({
    queryKey: ["store-name-availability", name],
    queryFn: () => checkStoreNameAvailability(name),
    enabled: name.length >= 4,
  });
}

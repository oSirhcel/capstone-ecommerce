import { useQuery } from "@tanstack/react-query";
import { checkSlugAvailability } from "@/lib/api/onboarding";

export function useSlugAvailability(slug: string) {
  return useQuery({
    queryKey: ["slug-availability", slug],
    queryFn: () => checkSlugAvailability(slug),
    enabled: slug.length >= 3 && /^[a-z0-9-]{3,50}$/.test(slug),
  });
}

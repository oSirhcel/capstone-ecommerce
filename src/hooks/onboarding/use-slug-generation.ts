import { useMutation } from "@tanstack/react-query";
import { generateStoreSlugs } from "@/lib/api/onboarding";

export function useSlugGeneration() {
  return useMutation({
    mutationFn: (storeName: string) => generateStoreSlugs(storeName),
  });
}

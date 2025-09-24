import { useQuery, useMutation } from "@tanstack/react-query";

export function useCreateStore() {
  return useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
        }),
      });
      return response.json() as Promise<{ id: string }>;
    },
  });
}

export const useQueryHandle = (name: string) => {
  return useQuery({
    enabled: name.length >= 4,
    queryKey: ["onboarding-name-availability", name],
    queryFn: async () => {
      const response = await fetch(`/api/onboarding/${name}`);
      const json = (await response.json()) as { hasStore: boolean };
      return !json.hasStore; // true means available
    },
  });
};

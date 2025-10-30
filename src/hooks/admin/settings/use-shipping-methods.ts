"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ShippingMethod {
  id: number;
  name: string;
  description: string | null;
  basePrice: number; // cents
  estimatedDays: number;
  isActive: boolean;
}

export function useShippingMethodsQuery() {
  return useQuery({
    queryKey: ["admin", "settings", "shipping"],
    queryFn: async (): Promise<ShippingMethod[]> => {
      const res = await fetch("/api/admin/settings/shipping", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch shipping methods");
      const data = (await res.json()) as { methods: ShippingMethod[] };
      return data.methods ?? [];
    },
  });
}

export function useCreateShippingMethodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Pick<
        ShippingMethod,
        "name" | "description" | "basePrice" | "estimatedDays"
      > & { isActive?: boolean },
    ) => {
      const res = await fetch("/api/admin/settings/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create shipping method");
      return (await res.json()) as { method: ShippingMethod };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["admin", "settings", "shipping"],
      });
    },
  });
}

export function useUpdateShippingMethodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: number } & Partial<ShippingMethod>) => {
      const { id, ...data } = params;
      const res = await fetch(`/api/admin/settings/shipping/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update shipping method");
      return (await res.json()) as { method: ShippingMethod };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["admin", "settings", "shipping"],
      });
    },
  });
}

export function useDeleteShippingMethodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/settings/shipping/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete shipping method");
      return (await res.json()) as { success: boolean };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["admin", "settings", "shipping"],
      });
    },
  });
}

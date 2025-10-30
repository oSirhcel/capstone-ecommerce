"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface TaxSettings {
  gstRegistered: boolean;
  abn: string | null;
  businessName: string | null;
  taxRate: number;
  contactEmail: string | null;
}

export function useTaxSettingsQuery() {
  return useQuery({
    queryKey: ["admin", "settings", "tax"],
    queryFn: async (): Promise<TaxSettings | null> => {
      const res = await fetch("/api/admin/settings/tax", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch tax settings");
      const data = (await res.json()) as { settings: TaxSettings | null };
      return data.settings ?? null;
    },
  });
}

export function useUpdateTaxSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<TaxSettings>) => {
      const res = await fetch("/api/admin/settings/tax", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to update tax settings");
      }
      return (await res.json()) as { success: boolean };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "settings", "tax"] });
    },
  });
}

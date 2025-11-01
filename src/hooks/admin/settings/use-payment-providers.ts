import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface StorePaymentProvider {
  id: number;
  storeId: string;
  provider: string;
  stripeAccountId: string | null;
  stripeAccountStatus: string | null;
  isActive: boolean;
  connectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function usePaymentProvidersQuery() {
  return useQuery({
    queryKey: ["admin", "settings", "payments"],
    queryFn: async (): Promise<StorePaymentProvider[]> => {
      const res = await fetch("/api/admin/settings/payments", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch payment providers");
      const data = (await res.json()) as { providers: StorePaymentProvider[] };
      return data.providers ?? [];
    },
  });
}

export function useConnectStripeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/settings/payments/stripe/connect", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to initiate Stripe connect");
      const data = (await res.json()) as { url: string };
      // Redirect user to connect URL
      window.location.href = data.url;
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["admin", "settings", "payments"],
      });
    },
  });
}

export function useDisconnectPaymentProviderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetch(
        `/api/admin/settings/payments?provider=${encodeURIComponent(provider)}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to disconnect provider");
      return (await res.json()) as { success: boolean };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["admin", "settings", "payments"],
      });
    },
  });
}

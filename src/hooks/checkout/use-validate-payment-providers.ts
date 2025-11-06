import { useQuery } from "@tanstack/react-query";
import type { StoreGroup } from "@/contexts/cart-context";

interface PaymentProviderValidation {
  valid: boolean;
  missingStores: Array<{ storeId: string; storeName: string }>;
}

export function useValidatePaymentProviders(storeGroups: StoreGroup[]): {
  isValid: boolean;
  isLoading: boolean;
  error: Error | null;
  missingStores: Array<{ storeId: string; storeName: string }>;
} {
  const storeIds = storeGroups.map((group) => group.storeId);

  const { data, isLoading, error } = useQuery<PaymentProviderValidation>({
    queryKey: ["validate-payment-providers", storeIds.sort().join(",")],
    queryFn: async () => {
      if (storeIds.length === 0) {
        return { valid: true, missingStores: [] };
      }

      const res = await fetch(
        `/api/checkout/validate-payment-providers?${new URLSearchParams(
          storeIds.map((id) => ["storeId", id]),
        )}`,
        {
          cache: "no-store",
        },
      );

      if (!res.ok) {
        throw new Error("Failed to validate payment providers");
      }

      const result = (await res.json()) as PaymentProviderValidation;

      // Enrich with store names
      const missingStoresWithNames = result.missingStores.map((missing) => {
        const storeGroup = storeGroups.find(
          (g) => g.storeId === missing.storeId,
        );
        return {
          storeId: missing.storeId,
          storeName: storeGroup?.storeName ?? "Unknown Store",
        };
      });

      return {
        valid: result.valid,
        missingStores: missingStoresWithNames,
      };
    },
    enabled: storeIds.length > 0,
  });

  return {
    isValid: data?.valid ?? false,
    isLoading,
    error: error,
    missingStores: data?.missingStores ?? [],
  };
}

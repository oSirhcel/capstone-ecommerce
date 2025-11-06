import { db } from "@/server/db";
import { storePaymentProviders } from "@/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export interface StorePaymentProvider {
  id: number;
  storeId: string;
  provider: string;
  stripeAccountId: string | null;
  stripeAccountStatus: string | null;
  isActive: boolean;
  connectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get active payment provider for a specific store
 */
export async function getStorePaymentProvider(
  storeId: string,
): Promise<StorePaymentProvider | null> {
  const [provider] = await db
    .select()
    .from(storePaymentProviders)
    .where(
      and(
        eq(storePaymentProviders.storeId, storeId),
        eq(storePaymentProviders.isActive, true),
      ),
    )
    .limit(1);

  return provider || null;
}

/**
 * Get Stripe account ID for a store
 */
export async function getStripeAccountForStore(
  storeId: string,
): Promise<string | null> {
  const provider = await getStorePaymentProvider(storeId);
  if (!provider || provider.provider !== "stripe") {
    return null;
  }
  return provider.stripeAccountId;
}

/**
 * Validate that all stores have active payment providers
 * Returns validation result with missing stores info
 */
export async function validateStoresHaveProviders(
  storeIds: string[],
): Promise<{
  valid: boolean;
  missingStores: Array<{ storeId: string; storeName?: string }>;
  providers: Map<string, StorePaymentProvider>;
}> {
  if (storeIds.length === 0) {
    return { valid: false, missingStores: [], providers: new Map() };
  }

  const providers = await db
    .select()
    .from(storePaymentProviders)
    .where(
      and(
        inArray(storePaymentProviders.storeId, storeIds),
        eq(storePaymentProviders.isActive, true),
      ),
    );

  const providerMap = new Map<string, StorePaymentProvider>();
  for (const provider of providers) {
    providerMap.set(provider.storeId, provider);
  }

  const missingStores: Array<{ storeId: string; storeName?: string }> = [];
  for (const storeId of storeIds) {
    if (!providerMap.has(storeId)) {
      missingStores.push({ storeId });
    }
  }

  return {
    valid: missingStores.length === 0,
    missingStores,
    providers: providerMap,
  };
}

/**
 * Get all payment providers for multiple stores
 */
export async function getPaymentProvidersForStores(
  storeIds: string[],
): Promise<Map<string, StorePaymentProvider>> {
  if (storeIds.length === 0) {
    return new Map();
  }

  const providers = await db
    .select()
    .from(storePaymentProviders)
    .where(
      and(
        inArray(storePaymentProviders.storeId, storeIds),
        eq(storePaymentProviders.isActive, true),
      ),
    );

  const providerMap = new Map<string, StorePaymentProvider>();
  for (const provider of providers) {
    providerMap.set(provider.storeId, provider);
  }

  return providerMap;
}


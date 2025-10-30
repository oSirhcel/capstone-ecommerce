import type { ChatContext } from "@/types/ai-assistant";
import { db } from "@/server/db";
import { stores } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export interface EnhancedChatContext extends ChatContext {
  currentPage?: string;
  storeStats?: {
    productCount: number;
    activeProducts: number;
    totalOrders?: number;
    revenue?: string;
    averageOrderValue?: string;
    activeCustomers?: number;
  };
  setupStatus?: {
    hasStore: boolean;
    progress: number;
    completedSteps: string[];
    nextSteps: string[];
  };
  userRole?: "admin" | "owner";
}

interface StoreStats {
  totalOrders?: number;
  revenue?: string;
  averageOrderValue?: string;
  activeCustomers?: number;
}

interface SetupStatus {
  hasStore: boolean;
  progress: number;
  completedSteps: string[];
  nextSteps: string[];
}

/**
 * Fetch user's store ID from database
 */
export async function getUserStoreId(userId: string): Promise<string | null> {
  try {
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, userId))
      .limit(1);

    return store?.id ?? null;
  } catch (error) {
    console.error("Error fetching user store:", error);
    return null;
  }
}

/**
 * Build enhanced context for the AI assistant
 */
export async function buildChatContext(options: {
  pathname?: string;
  storeId?: string;
  userId?: string;
}): Promise<EnhancedChatContext> {
  const context: EnhancedChatContext = {
    pageContext: options.pathname,
    currentPage: mapPathnameToPageName(options.pathname),
    userRole: "admin",
  };

  // Fetch store stats if store ID available
  if (options.storeId) {
    try {
      const statsResponse = await fetch(
        `/api/admin/orders/stats?storeId=${options.storeId}`,
        { cache: "no-store" },
      );
      if (statsResponse.ok) {
        const stats = (await statsResponse.json()) as StoreStats;
        context.storeStats = {
          productCount: 0,
          activeProducts: 0,
          totalOrders: stats.totalOrders,
          revenue: stats.revenue,
          averageOrderValue: stats.averageOrderValue,
          activeCustomers: stats.activeCustomers,
        };
      }
    } catch {
      // Silently fail - stats not critical
    }
  }

  // Fetch setup status
  try {
    const setupResponse = await fetch("/api/ai/onboarding-status", {
      cache: "no-store",
    });
    if (setupResponse.ok) {
      const setup = (await setupResponse.json()) as SetupStatus;
      context.setupStatus = {
        hasStore: setup.hasStore,
        progress: setup.progress,
        completedSteps: setup.completedSteps,
        nextSteps: setup.nextSteps,
      };
    }
  } catch {
    // Silently fail - setup status not critical
  }

  return context;
}

/**
 * Convert pathname to user-friendly page name
 */
function mapPathnameToPageName(pathname?: string): string {
  if (!pathname) return "unknown";

  if (pathname.includes("/admin/products/add")) return "add-product";
  if (pathname.includes("/admin/products")) return "products";
  if (pathname.includes("/admin/orders")) return "orders";
  if (pathname.includes("/admin/customers")) return "customers";
  if (pathname.includes("/admin/analytics")) return "analytics";
  if (pathname.includes("/admin/settings/shipping")) return "shipping-settings";
  if (pathname.includes("/admin/settings/payments")) return "payment-settings";
  if (pathname.includes("/admin/settings/tax")) return "tax-settings";
  if (pathname.includes("/admin/settings/store")) return "store-settings";
  if (pathname.includes("/admin/risk-assessments")) return "risk-assessments";
  if (pathname.includes("/admin")) return "dashboard";

  return "unknown";
}

/**
 * Format context for system prompt injection
 */
export function formatContextForPrompt(context: EnhancedChatContext): string {
  let contextStr = "";

  if (context.currentPage) {
    contextStr += `Current page: ${context.currentPage}\n`;
  }

  if (context.storeStats) {
    contextStr += `Store Stats:\n`;
    contextStr += `- Active products: ${context.storeStats.activeProducts}/${context.storeStats.productCount}\n`;
    if (context.storeStats.totalOrders !== undefined) {
      contextStr += `- Recent orders: ${context.storeStats.totalOrders}\n`;
    }
  }

  if (context.setupStatus) {
    contextStr += `Store Setup Progress: ${context.setupStatus.progress}%\n`;
    if (context.setupStatus.nextSteps.length > 0) {
      contextStr += `Next steps: ${context.setupStatus.nextSteps.slice(0, 2).join(", ")}\n`;
    }
  }

  return contextStr;
}

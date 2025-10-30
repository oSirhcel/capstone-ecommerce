import { getBaseUrl } from "@/lib/api/config";
import { extractProductData } from "@/lib/ai/extractors/product-extractor";

interface StoreStats {
  totalOrders?: number;
  revenue?: string;
  averageOrderValue?: string;
  activeCustomers?: number;
}

interface OrdersResponse {
  orders?: unknown[];
}

interface ProductsResponse {
  pagination?: {
    total?: number;
  };
  products?: unknown[];
}

interface SetupStatusResponse {
  progress: number;
  nextSteps: string[];
}

export interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  message: string;
  error?: string;
}

/**
 * Execute the create_product_draft tool
 */
export async function executeCreateProductDraft(
  description: string,
): Promise<ToolExecutionResult> {
  try {
    const result = await extractProductData(description);
    return {
      success: true,
      data: result.data,
      message: "Product data extracted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to extract product data",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute the navigate_to_page tool
 */
export async function executeNavigateToPage(
  page: string,
  reason: string,
): Promise<ToolExecutionResult> {
  const pageMap: Record<string, string> = {
    dashboard: "/admin",
    products: "/admin/products",
    "add-product": "/admin/products/add",
    orders: "/admin/orders",
    customers: "/admin/customers",
    analytics: "/admin/analytics",
    "settings-store": "/admin/settings/store",
    "settings-shipping": "/admin/settings/shipping",
    "settings-payments": "/admin/settings/payments",
    "settings-tax": "/admin/settings/tax",
    "risk-assessments": "/admin/risk-assessments",
  };

  const targetPage = pageMap[page];
  if (!targetPage) {
    return {
      success: false,
      message: `Unknown page: ${page}`,
    };
  }

  return {
    success: true,
    data: { page: targetPage, reason },
    message: `Ready to navigate to ${page}`,
  };
}

/**
 * Execute the get_store_overview tool
 */
export async function executeGetStoreOverview(
  storeId: string,
  headers?: Headers,
): Promise<ToolExecutionResult> {
  try {
    const url = getBaseUrl() + `/api/admin/orders/stats?storeId=${storeId}`;

    const statsResponse = await fetch(url, { cache: "no-store", headers });

    if (!statsResponse.ok) {
      throw new Error("Failed to fetch stats");
    }

    const stats = (await statsResponse.json()) as StoreStats;

    return {
      success: true,
      data: stats,
      message: `Store overview: ${stats.totalOrders ?? 0} orders, $${stats.revenue ?? "0"} revenue`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch store overview",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute the get_recent_orders tool
 */
export async function executeGetRecentOrders(
  storeId: string,
  limit?: number,
  headers?: Headers,
): Promise<ToolExecutionResult> {
  try {
    const url =
      getBaseUrl() + `/api/admin/orders?storeId=${storeId}&limit=${limit ?? 5}`;

    const response = await fetch(url, { cache: "no-store", headers });

    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }

    const orders = (await response.json()) as OrdersResponse;

    return {
      success: true,
      data: orders,
      message: `Retrieved ${Array.isArray(orders.orders) ? orders.orders.length : 0} recent orders`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch recent orders",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute the get_products_summary tool
 */
export async function executeGetProductsSummary(
  storeId: string,
  headers?: Headers,
): Promise<ToolExecutionResult> {
  try {
    const url = getBaseUrl() + `/api/admin/products?storeId=${storeId}&limit=1`;

    const response = await fetch(url, { cache: "no-store", headers });

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = (await response.json()) as ProductsResponse;

    return {
      success: true,
      data: {
        total: data.pagination?.total ?? 0,
        products: data.products ?? [],
      },
      message: `Store has ${data.pagination?.total ?? 0} products`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch products summary",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute the get_setup_status tool
 */
export async function executeGetSetupStatus(): Promise<ToolExecutionResult> {
  try {
    const response = await fetch("/api/ai/onboarding-status", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch setup status");
    }

    const setup = (await response.json()) as SetupStatusResponse;

    const message =
      setup.progress === 100
        ? "Your store is fully set up!"
        : `Store setup is ${setup.progress}% complete. Next steps: ${setup.nextSteps.slice(0, 2).join(", ")}`;

    return {
      success: true,
      data: setup,
      message,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch setup status",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Main tool execution dispatcher
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  storeId?: string,
  headers?: Headers,
): Promise<ToolExecutionResult> {
  switch (toolName) {
    case "create_product_draft":
      return executeCreateProductDraft(args.description as string);

    case "navigate_to_page":
      return executeNavigateToPage(args.page as string, args.reason as string);

    case "get_store_overview":
      if (!storeId) {
        return {
          success: false,
          message: "Store ID required for this tool",
        };
      }
      return executeGetStoreOverview(storeId, headers);

    case "get_recent_orders":
      if (!storeId) {
        return {
          success: false,
          message: "Store ID required for this tool",
        };
      }
      return executeGetRecentOrders(
        storeId,
        args.limit as number | undefined,
        headers,
      );

    case "get_products_summary":
      if (!storeId) {
        return {
          success: false,
          message: "Store ID required for this tool",
        };
      }
      return executeGetProductsSummary(storeId, headers);

    case "get_setup_status":
      return executeGetSetupStatus();

    default:
      return {
        success: false,
        message: `Unknown tool: ${toolName}`,
      };
  }
}

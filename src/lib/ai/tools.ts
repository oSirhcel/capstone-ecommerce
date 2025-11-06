import { tool } from "ai";
import { z } from "zod";
import { extractProductData } from "@/lib/ai/extractors/product-extractor";

/**
 * Tool to create a product draft from natural language description
 */
export const createProductDraftTool = tool({
  description:
    "Extract product information from a user description and create a product draft. Use this when the user describes a product they want to create.",
  inputSchema: z.object({
    description: z
      .string()
      .describe("The user's product description to extract data from"),
  }),
  execute: async ({ description }) => {
    const result = await extractProductData(description);
    if (!result.success) {
      throw new Error("Failed to extract product data");
    }
    return result.data;
  },
});

/**
 * Tool to navigate user to a specific admin page
 */
export const navigateToPageTool = tool({
  description:
    "Navigate the user to a specific page in the admin dashboard. Use this to guide users to relevant sections.",
  inputSchema: z.object({
    page: z.enum([
      "dashboard",
      "products",
      "add-product",
      "orders",
      "customers",
      "analytics",
      "settings-store",
      "settings-shipping",
      "settings-payments",
      "settings-tax",
      "risk-assessments",
    ]),
    reason: z
      .string()
      .describe("Brief explanation of why navigating to this page"),
  }),
  execute: async ({ page, reason }) => {
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
    const targetPage = pageMap[page] ?? "/admin";
    return {
      page: targetPage,
      reason,
    };
  },
});

/**
 * Tool to get setup status
 */
export const getSetupStatusTool = tool({
  description:
    "Check the store setup progress and see what steps need to be completed.",
  inputSchema: z.object({
    detailed: z
      .boolean()
      .optional()
      .describe("Whether to include detailed setup steps"),
  }),
  execute: async () => {
    const { executeGetSetupStatus } = await import("@/lib/ai/tool-handlers");
    const result = await executeGetSetupStatus();
    if (!result.success) {
      throw new Error(result.message);
    }
    return result.data;
  },
});

/**
 * Tool to acknowledge completion of an onboarding step
 */
export const completeOnboardingStepTool = tool({
  description:
    "Acknowledge that a user has completed an onboarding step. Use this to provide encouragement and suggest the next step. The system will verify completion automatically.",
  inputSchema: z.object({
    stepKey: z
      .enum([
        "storeCreated",
        "storeDetails",
        "taxConfigured",
        "shippingConfigured",
        "paymentConfigured",
        "policiesCreated",
        "firstProductAdded",
      ])
      .describe("The onboarding step that was completed"),
  }),
  execute: async ({ stepKey }) => {
    const { executeCompleteOnboardingStep } = await import(
      "@/lib/ai/tool-handlers"
    );
    const result = await executeCompleteOnboardingStep(stepKey);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result.data;
  },
});

/**
 * Tool to update specific product fields from natural language instruction
 */
export const updateProductFieldsTool = tool({
  description:
    "Extract and update specific product fields from a user's edit instruction. Use this when the user wants to modify specific fields of an existing product (e.g., 'change price to $50', 'make description more concise', 'update the name').",
  inputSchema: z.object({
    instruction: z
      .string()
      .describe(
        "The user's instruction describing which fields to update and how",
      ),
    currentFormData: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        "Current form data (optional, helps provide better context for updates)",
      ),
  }),
  execute: async ({ instruction, currentFormData }) => {
    const { extractFieldUpdates } = await import(
      "@/lib/ai/extractors/field-update-extractor"
    );
    const result = await extractFieldUpdates(
      instruction,
      currentFormData ?? {},
    );
    return {
      updates: result.updates,
      reasoning: result.reasoning,
    };
  },
});

/**
 * Create tools with storeId context
 */
export function createChatbotTools(storeId?: string) {
  const getStoreOverviewToolWithContext = tool({
    description:
      "Get an overview of the store including product count, revenue, active status, and other key metrics.",
    inputSchema: z.object({
      includeStats: z
        .boolean()
        .optional()
        .describe("Whether to include detailed statistics"),
    }),
    execute: async () => {
      if (!storeId) {
        throw new Error("Store ID is required");
      }
      const { executeGetStoreOverview } = await import(
        "@/lib/ai/tool-handlers"
      );
      const result = await executeGetStoreOverview(storeId);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  const getRecentOrdersToolWithContext = tool({
    description:
      "Retrieve recent orders from the store. Use this to show order history or status.",
    inputSchema: z.object({
      limit: z
        .number()
        .optional()
        .default(5)
        .describe("Number of recent orders to retrieve (default 5)"),
    }),
    execute: async ({ limit }) => {
      if (!storeId) {
        throw new Error("Store ID is required");
      }
      const { executeGetRecentOrders } = await import("@/lib/ai/tool-handlers");
      const result = await executeGetRecentOrders(storeId, limit);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  const getProductsSummaryToolWithContext = tool({
    description:
      "Get a summary of store products including count and status breakdown.",
    inputSchema: z.object({
      includeList: z
        .boolean()
        .optional()
        .describe("Whether to include a list of products"),
    }),
    execute: async () => {
      if (!storeId) {
        throw new Error("Store ID is required");
      }
      const { executeGetProductsSummary } = await import(
        "@/lib/ai/tool-handlers"
      );
      const result = await executeGetProductsSummary(storeId);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  return {
    create_product_draft: createProductDraftTool,
    navigate_to_page: navigateToPageTool,
    get_store_overview: getStoreOverviewToolWithContext,
    get_recent_orders: getRecentOrdersToolWithContext,
    get_products_summary: getProductsSummaryToolWithContext,
    get_setup_status: getSetupStatusTool,
    complete_onboarding_step: completeOnboardingStepTool,
    update_product_fields: updateProductFieldsTool,
  };
}

/**
 * All available tools for the chatbot (default, without storeId context)
 */
export const chatbotTools = createChatbotTools();

export type AvailableTools = ReturnType<typeof createChatbotTools>;

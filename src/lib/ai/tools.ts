import { tool } from "ai";
import { z } from "zod";

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
  execute: async ({ description }) => ({
    toolName: "create_product_draft",
    description,
  }),
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
  execute: async ({ page, reason }) => ({
    toolName: "navigate_to_page",
    page,
    reason,
  }),
});

/**
 * Tool to get store overview with statistics
 */
export const getStoreOverviewTool = tool({
  description:
    "Get an overview of the store including product count, revenue, active status, and other key metrics.",
  inputSchema: z.object({
    includeStats: z
      .boolean()
      .optional()
      .describe("Whether to include detailed statistics"),
  }),
  execute: async ({ includeStats }) => ({
    toolName: "get_store_overview",
    includeStats: includeStats ?? true,
  }),
});

/**
 * Tool to get recent orders
 */
export const getRecentOrdersTool = tool({
  description:
    "Retrieve recent orders from the store. Use this to show order history or status.",
  inputSchema: z.object({
    limit: z
      .number()
      .optional()
      .default(5)
      .describe("Number of recent orders to retrieve (default 5)"),
  }),
  execute: async ({ limit }) => ({
    toolName: "get_recent_orders",
    limit: limit ?? 5,
  }),
});

/**
 * Tool to get products summary
 */
export const getProductsSummaryTool = tool({
  description:
    "Get a summary of store products including count and status breakdown.",
  inputSchema: z.object({
    includeList: z
      .boolean()
      .optional()
      .describe("Whether to include a list of products"),
  }),
  execute: async ({ includeList }) => ({
    toolName: "get_products_summary",
    includeList: includeList ?? false,
  }),
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
  execute: async ({ detailed }) => ({
    toolName: "get_setup_status",
    detailed: detailed ?? false,
  }),
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
  execute: async ({ stepKey }) => ({
    toolName: "complete_onboarding_step",
    stepKey,
  }),
});

/**
 * All available tools for the chatbot
 */
export const chatbotTools = {
  create_product_draft: createProductDraftTool,
  navigate_to_page: navigateToPageTool,
  get_store_overview: getStoreOverviewTool,
  get_recent_orders: getRecentOrdersTool,
  get_products_summary: getProductsSummaryTool,
  get_setup_status: getSetupStatusTool,
  complete_onboarding_step: completeOnboardingStepTool,
};

export type AvailableTools = typeof chatbotTools;

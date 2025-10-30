export interface OnboardingStepConfig {
  key: string;
  label: string;
  route?: string;
  guidance: string;
  estimatedTime?: string;
  complexity?: "easy" | "medium" | "hard";
}

export const ONBOARDING_STEP_CONFIGS: Record<string, OnboardingStepConfig> = {
  storeCreated: {
    key: "storeCreated",
    label: "Store created",
    guidance:
      "The store has been successfully created. This is the foundation of your e-commerce presence.",
  },
  storeDetails: {
    key: "storeDetails",
    label: "Add store details",
    route: "/admin/settings/store",
    guidance:
      "Add a description and details about your store. This helps customers understand what you offer and improves SEO.",
    estimatedTime: "5 minutes",
    complexity: "easy",
  },
  taxConfigured: {
    key: "taxConfigured",
    label: "Configure tax settings",
    route: "/admin/settings/tax",
    guidance:
      "Set up GST registration status and tax rates. Required for Australian businesses to comply with tax regulations.",
    estimatedTime: "10 minutes",
    complexity: "medium",
  },
  shippingConfigured: {
    key: "shippingConfigured",
    label: "Set up shipping",
    route: "/admin/settings/shipping",
    guidance:
      "Configure shipping methods and rates so customers can receive their orders. Essential for fulfilling orders.",
    estimatedTime: "15 minutes",
    complexity: "medium",
  },
  paymentConfigured: {
    key: "paymentConfigured",
    label: "Connect payment method",
    route: "/admin/settings/payments",
    guidance:
      "Connect Stripe or another payment provider to accept payments. Required before you can receive orders.",
    estimatedTime: "10 minutes",
    complexity: "medium",
  },
  policiesCreated: {
    key: "policiesCreated",
    label: "Create store policies",
    route: "/admin/settings/store",
    guidance:
      "Add shipping, return, privacy, and terms of service policies. Builds customer trust and legal compliance.",
    estimatedTime: "20 minutes",
    complexity: "medium",
  },
  firstProductAdded: {
    key: "firstProductAdded",
    label: "Add your first product",
    route: "/admin/products/add",
    guidance:
      "Create your first product listing. Add images, descriptions, pricing, and inventory to start selling.",
    estimatedTime: "15 minutes",
    complexity: "easy",
  },
} as const;


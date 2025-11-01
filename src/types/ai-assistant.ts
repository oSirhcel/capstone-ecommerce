import { z } from "zod";

// Widget types
export type WidgetState = "minimized" | "expanded" | "maximized";

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetPreferences {
  soundEnabled: boolean;
  autoExpand: boolean;
  defaultSize: {
    width: number;
    height: number;
  };
}

// Message types
export type MessageRole = "user" | "assistant" | "system";

export type MessageType = "text" | "action" | "form-fill" | "suggestion";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  type?: MessageType;
  metadata?: Record<string, unknown>;
}

// Context types
export interface ChatContext {
  pageContext?: string;
  storeData?: unknown;
  userIntent?: string;
}

export interface OnboardingProgress {
  completedSteps: string[];
  currentStep: string;
  nextActions: string[];
  progressPercentage: number;
}

// Action types
export type ActionType =
  | "fill-form"
  | "create-draft"
  | "navigate"
  | "trigger-api";

export interface AIAction {
  type: ActionType;
  payload: unknown;
  validation?: z.ZodSchema;
}

export interface FormFillAction {
  formId: string;
  fieldMappings: Record<string, unknown>;
  values: Record<string, unknown>;
}

export interface ProductDraftAction {
  productData: unknown;
  validationResult: z.ZodSafeParseResult<unknown>;
}

// Response types
export interface AIResponse {
  message: string;
  actions?: AIAction[];
  suggestions?: SuggestionChip[];
  needsConfirmation: boolean;
}

export interface SuggestionChip {
  label: string;
  action: () => void;
  icon?: string;
}

// Notification types
export type NotificationType = "info" | "success" | "warning" | "error";

export interface NotificationBadge {
  count: number;
  type: NotificationType;
  priority: "low" | "medium" | "high";
}

// Schema for AI-generated product data
export const productDraftSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  stock: z.number().min(0, "Stock must be non-negative").optional(),
  sku: z.string().optional(),
  categoryId: z.number().optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type ProductDraft = z.infer<typeof productDraftSchema>;

// Widget state schema
export const widgetPreferencesSchema = z.object({
  soundEnabled: z.boolean().default(false),
  autoExpand: z.boolean().default(false),
  defaultSize: z.object({
    width: z.number().default(400),
    height: z.number().default(600),
  }),
});

export type WidgetPreferencesSchema = z.infer<typeof widgetPreferencesSchema>;

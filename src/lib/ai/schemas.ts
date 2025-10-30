import { z } from "zod";

/**
 * Shared Zod schemas for AI functionality
 */

// Chat Message Schemas
export const chatMessageRoleSchema = z.enum(["user", "assistant", "system"]);

export const chatMessageTypeSchema = z.enum([
  "text",
  "action",
  "form-fill",
  "suggestion",
]);

export const chatMessageSchema = z.object({
  id: z.string(),
  role: chatMessageRoleSchema,
  content: z.string(),
  timestamp: z.union([z.string(), z.date()]),
  type: chatMessageTypeSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema),
  stream: z.boolean().optional(),
});

export const chatResponseSchema = z.object({
  message: z.string(),
  timestamp: z.string(),
});

export const chatErrorResponseSchema = z.object({
  error: z.string(),
  details: z.array(z.unknown()).optional(),
});

// Product Extraction Schemas
export const productExtractionRequestSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

export const productExtractionResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    sku: z.string().optional(),
    categoryId: z.number().optional(),
    tags: z.array(z.string()).optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(200).optional(),
    compareAtPrice: z.number().min(0).optional(),
    costPerItem: z.number().min(0).optional(),
    weight: z.number().min(0).optional(),
    length: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
    trackQuantity: z.boolean().optional(),
    allowBackorders: z.boolean().optional(),
    featured: z.boolean().optional(),
  }),
});

// Field Update Schemas
export const fieldUpdateSchema = z.object({
  fieldName: z.string().describe("The name of the field to update"),
  value: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .describe("The new value for the field"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score for this update"),
});

export const productFieldUpdateRequestSchema = z.object({
  instruction: z.string().min(1, "Instruction is required"),
  currentFormData: z.record(z.string(), z.unknown()),
});

export const productFieldUpdateResponseSchema = z.object({
  updates: z.array(fieldUpdateSchema),
  reasoning: z.string().optional(),
});

// Tool Call Schemas
export const toolCallResultSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  message: z.string(),
  error: z.string().optional(),
});

export const toolCallSchema = z.object({
  toolName: z.string(),
  result: toolCallResultSchema,
});

// Suggestion Schemas
export const suggestionSchema = z.object({
  label: z.string().describe("The suggestion text"),
  actionType: z
    .enum(["chat", "navigate", "action"])
    .describe("Type of action for the suggestion"),
});

// Enhanced Chat Response Schemas
export const chatResponseWithToolsSchema = z.object({
  message: z.string(),
  timestamp: z.string(),
  toolCalls: z.array(toolCallSchema).optional(),
  suggestions: z.array(suggestionSchema).optional(),
});

// Type exports
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type ChatErrorResponse = z.infer<typeof chatErrorResponseSchema>;

export type ProductExtractionRequest = z.infer<
  typeof productExtractionRequestSchema
>;
export type ProductExtractionResponse = z.infer<
  typeof productExtractionResponseSchema
>;

export type FieldUpdate = z.infer<typeof fieldUpdateSchema>;
export type ProductFieldUpdateRequest = z.infer<
  typeof productFieldUpdateRequestSchema
>;
export type ProductFieldUpdateResponse = z.infer<
  typeof productFieldUpdateResponseSchema
>;

export type ToolCallResult = z.infer<typeof toolCallResultSchema>;
export type ToolCall = z.infer<typeof toolCallSchema>;
export type Suggestion = z.infer<typeof suggestionSchema>;
export type ChatResponseWithTools = z.infer<typeof chatResponseWithToolsSchema>;

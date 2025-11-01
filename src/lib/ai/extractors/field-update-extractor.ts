import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const fieldUpdateSchema = z.object({
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

const productFieldUpdateSchema = z.object({
  updates: z.array(fieldUpdateSchema).describe("Array of field updates"),
  reasoning: z.string().optional().describe("Brief explanation of the updates"),
});

export type FieldUpdate = z.infer<typeof fieldUpdateSchema>;
export type ProductFieldUpdateResult = z.infer<typeof productFieldUpdateSchema>;

const FIELD_MAPPINGS: Record<string, string[]> = {
  name: ["name", "product name", "title"],
  description: ["description", "product description", "details", "about"],
  price: ["price", "cost", "amount", "pricing"],
  compareAtPrice: [
    "compare at price",
    "original price",
    "was price",
    "before price",
  ],
  costPerItem: ["cost per item", "cost", "cost price"],
  stock: ["stock", "quantity", "inventory", "available"],
  sku: ["sku", "stock keeping unit", "product code"],
  category: ["category", "type", "classification"],
  tags: ["tags", "keywords", "labels"],
  seoTitle: ["seo title", "meta title", "search title"],
  seoDescription: ["seo description", "meta description", "search description"],
  weight: ["weight", "mass"],
  dimensions: ["dimensions", "size", "measurements"],
  trackQuantity: ["track quantity", "inventory tracking"],
  allowBackorders: ["allow backorders", "backorders", "oversell"],
  featured: ["featured", "feature"],
};

/**
 * Extract field updates from natural language instruction
 */
export async function extractFieldUpdates(
  instruction: string,
  currentFormData: Record<string, unknown>,
): Promise<ProductFieldUpdateResult> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Google AI API key not configured");
    }

    const model = google("gemini-2.5-flash");

    const prompt = `You are helping update a product form. Extract field updates from the user's instruction.

Current form data:
${JSON.stringify(currentFormData, null, 2)}

User instruction: "${instruction}"

Available fields and their aliases:
${Object.entries(FIELD_MAPPINGS)
  .map(([field, aliases]) => `- ${field}: ${aliases.join(", ")}`)
  .join("\n")}

Instructions:
1. Parse the user's instruction to identify which fields should be updated
2. Extract the new values for those fields - if the instruction asks to modify but doesn't provide a value, generate an appropriate value based on the request
3. Use the exact field names from the mapping above
4. For nested fields like dimensions, use dot notation (e.g., "dimensions.length")
5. Convert values to the appropriate types (strings, numbers, booleans, arrays)
6. Only include fields that are explicitly mentioned or strongly implied

CRITICAL: If the user asks to modify a field without providing the new value, generate a reasonable value:
- "make description more concise" → Generate a shorter version of the current description
- "update the description" → Generate an improved version
- "make it featured" → Set to true

Example:
- "change the description to a luxurious soap bar" → updates: [{fieldName: "description", value: "A luxurious soap bar", confidence: 0.95}]
- "update price to 15.99" → updates: [{fieldName: "price", value: 15.99, confidence: 0.98}]
- "make it featured" → updates: [{fieldName: "featured", value: true, confidence: 0.9}]
- "make the description more concise" → updates: [{fieldName: "description", value: "Shortened concise version here", confidence: 0.85}]

Return only the fields that need updating based on the instruction.`;

    const result = await generateObject({
      model,
      schema: productFieldUpdateSchema,
      prompt,
      temperature: 0.3,
    });

    return result.object;
  } catch (error) {
    console.error("Error extracting field updates:", error);
    throw error;
  }
}

/**
 * Check if a message is likely an edit instruction
 */
export function isEditInstruction(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const editKeywords = [
    "change",
    "update",
    "edit",
    "modify",
    "adjust",
    "set",
    "make",
    "remove",
    "delete",
    "clear",
    "replace",
    "switch",
  ];

  return editKeywords.some((keyword) => lowerMessage.includes(keyword));
}

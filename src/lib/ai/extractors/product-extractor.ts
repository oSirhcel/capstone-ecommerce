import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative").optional(),
  stock: z.number().int().min(0, "Stock must be non-negative").optional(),
  sku: z.string().optional(),
  categoryId: z.number().optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z
    .string()
    .max(60, "SEO title must be 60 characters or less")
    .optional(),
  seoDescription: z
    .string()
    .max(160, "SEO description must be 160 characters or less")
    .optional(),
  compareAtPrice: z.number().min(0).optional(),
  costPerItem: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  trackQuantity: z.boolean().optional(),
  allowBackorders: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export type ExtractedProduct = z.infer<typeof productSchema>;

export interface ProductExtractionResult {
  success: boolean;
  data?: ExtractedProduct;
  errors?: z.ZodError;
  warnings?: string[];
  confidence?: Record<string, number>;
}

/**
 * Extract product data from natural language description
 */
export async function extractProductData(
  description: string,
): Promise<ProductExtractionResult> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Google AI API key not configured");
    }

    const model = google("gemini-2.5-flash");

    const prompt = `Extract product information from the following description:

"${description}"

Return a structured product object with the following fields:
- name: Product name (required)
- description: Product description
- price: Price in dollars (convert from cents if needed)
- stock: Stock quantity
- sku: Product SKU or identifier
- categoryId: Category ID (optional, only if category name is mentioned)
- tags: Array of relevant tags/keywords
- seoTitle: SEO-friendly title (max 60 characters)
- seoDescription: SEO-friendly description (max 160 characters)
- compareAtPrice: Compare at price (original price before discount)
- costPerItem: Cost per item for profit calculation
- weight: Weight in kg
- length: Length in cm
- width: Width in cm
- height: Height in cm
- trackQuantity: Whether to track inventory
- allowBackorders: Whether to allow backorders
- featured: Whether product is featured

Extract as much information as possible. Use undefined/null for fields that cannot be determined from the description.`;

    const result = await generateObject({
      model,
      schema: productSchema,
      prompt,
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    // Generate warnings for missing fields
    const warnings: string[] = [];
    if (!result.object.price) {
      warnings.push("Price not specified - this is a required field");
    }
    if (!result.object.stock && result.object.stock !== 0) {
      warnings.push("Stock quantity not specified");
    }
    if (!result.object.description) {
      warnings.push("Product description not provided");
    }

    return {
      success: true,
      data: result.object,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error("Error extracting product data:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error,
      };
    }

    return {
      success: false,
      errors: new z.ZodError([
        {
          code: "custom",
          message: "Failed to extract product data",
          path: [],
        },
      ]),
    };
  }
}

/**
 * Generate SEO-friendly slug from product name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Suggest categories based on product description
 */
export async function suggestCategories(
  description: string,
  availableCategories: Array<{ id: number; name: string }>,
): Promise<number[]> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return [];
    }

    const model = google("gemini-2.5-flash");

    const categoryList = availableCategories
      .map((cat) => `${cat.id}: ${cat.name}`)
      .join("\n");

    const prompt = `Given this product description: "${description}"

And these available categories:
${categoryList}

Return only the numeric IDs of the most relevant categories (comma-separated). Return empty string if none match.

Example response: "1, 3"`;

    const result = await generateObject({
      model,
      schema: z.object({
        categoryIds: z.string().optional(),
      }),
      prompt,
      temperature: 0.3,
    });

    if (!result.object.categoryIds) {
      return [];
    }

    return result.object.categoryIds
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));
  } catch (error) {
    console.error("Error suggesting categories:", error);
    return [];
  }
}

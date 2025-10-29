import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

// Utility to ensure strings don't exceed max length
const truncateString = (value: unknown, maxLength: number): string => {
  if (typeof value === "string") {
    return value.substring(0, maxLength);
  }
  return "";
};

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
    .max(200, "SEO description must be 200 characters or less")
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
  data: ExtractedProduct;
}

/**
 * Generate SEO title - concise, under 60 characters
 */
function generateSeoTitle(productName: string): string {
  const title = `${productName} - Quality & Value`;
  return truncateString(title, 60);
}

/**
 * Generate SEO description - punchy, under 160 characters
 */
function generateSeoDescription(
  productName: string,
  description?: string,
): string {
  let seoDesc = `Shop ${productName}. Premium quality, great prices.`;

  if (description && description.length > 0) {
    // Extract first 80 chars of description if available
    seoDesc = description.substring(0, 80) + "...";
  }

  return truncateString(seoDesc, 200);
}

/**
 * Extract product data from natural language description
 * Refactored with robust SEO field handling and character limit enforcement
 */
export async function extractProductData(
  description: string,
): Promise<ProductExtractionResult> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Google AI API key not configured");
    }

    const model = google("gemini-2.5-flash");

    const prompt = `Extract product information from this description and generate reasonable defaults for missing fields.

Description: "${description}"

Return a JSON object with these fields:
- name: Product name (REQUIRED)
- description: Detailed product description (2-3 sentences)
- price: Price in USD (estimate if not given)
- stock: Quantity in stock (default 100)
- sku: Generate a SKU from the product name
- tags: Array of 3-5 relevant keywords
- seoTitle: SEO title (IMPORTANT: MUST be under 60 characters, be concise)
- seoDescription: SEO meta description (IMPORTANT: MUST be under 200 characters, be punchy)
- compareAtPrice: Original price before discount (default to price * 1.2)
- costPerItem: Cost per item (default to price * 0.4)
- weight: Weight in kg (estimate based on product)
- length: Length in cm
- width: Width in cm
- height: Height in cm
- trackQuantity: true (always track inventory)
- allowBackorders: false
- featured: false

CRITICAL CONSTRAINTS:
1. seoTitle MUST be 60 characters or fewer
2. seoDescription MUST be 200 characters or fewer
3. Count characters carefully for SEO fields
4. Generate concise, compelling text for SEO fields
5. Never include placeholder text`;

    let result;
    try {
      result = await generateObject({
        model,
        schema: productSchema,
        prompt,
        temperature: 0.3,
      });
    } catch (firstError) {
      const errorMessage =
        firstError instanceof Error ? firstError.message : String(firstError);
      const isValidationError =
        errorMessage.includes("validation") ||
        errorMessage.includes("characters") ||
        errorMessage.includes("too_big");

      if (!isValidationError) {
        throw firstError;
      }

      // If validation fails, generate with strict fallbacks
      try {
        result = await generateObject({
          model,
          schema: productSchema,
          prompt: `Extract ONLY basic product info from: "${description}"

Return:
- name: Product name
- price: Price (or 29.99)
- stock: 100
- description: 1 sentence
- seoTitle: Short title (under 60 chars!)
- seoDescription: Short description (under 200 chars!)
- All other fields: omit (will use defaults)

STRICT: Keep seoDescription under 200 characters!`,
          temperature: 0.2,
        });
      } catch (secondError) {
        console.error("Second extraction attempt failed:", secondError);
        throw secondError;
      }
    }

    // Build product with guaranteed field length compliance
    const completeProduct: ExtractedProduct = {
      name: truncateString(result.object.name ?? "Product", 255),
      description: truncateString(
        result.object.description ??
          `High-quality ${result.object.name ?? "product"} for your needs.`,
        5000,
      ),
      price: result.object.price ?? 29.99,
      stock: result.object.stock ?? 100,
      sku: truncateString(
        result.object.sku ?? generateSKU(result.object.name ?? "Product"),
        100,
      ),
      categoryId: result.object.categoryId,
      tags: Array.from(
        new Set(
          (result.object.tags ?? ["product"])
            .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
            .filter((t) => t.length > 0)
            .map((t) => truncateString(t, 100)),
        ),
      ).slice(0, 10),
      // Enforce character limits on SEO fields
      seoTitle: truncateString(
        result.object.seoTitle ??
          generateSeoTitle(result.object.name ?? "Product"),
        60,
      ),
      seoDescription: truncateString(
        result.object.seoDescription ??
          generateSeoDescription(
            result.object.name ?? "Product",
            result.object.description,
          ),
        200,
      ),
      compareAtPrice:
        result.object.compareAtPrice ?? (result.object.price ?? 29.99) * 1.2,
      costPerItem:
        result.object.costPerItem ?? (result.object.price ?? 29.99) * 0.4,
      weight: result.object.weight ?? 0.5,
      length: result.object.length ?? 10,
      width: result.object.width ?? 10,
      height: result.object.height ?? 10,
      trackQuantity: result.object.trackQuantity ?? true,
      allowBackorders: result.object.allowBackorders ?? false,
      featured: result.object.featured ?? false,
    };

    return {
      success: true,
      data: completeProduct,
    };
  } catch (error) {
    console.error("Error extracting product data:", error);

    // Return a guaranteed valid fallback
    return {
      success: true,
      data: {
        name: "New Product",
        description:
          "A new product added to your store. Edit details as needed.",
        price: 29.99,
        stock: 100,
        sku: generateSKU("New Product"),
        categoryId: undefined,
        tags: ["product", "new"],
        seoTitle: "New Product",
        seoDescription: "Shop new products. Premium quality, great prices.",
        compareAtPrice: 35.99,
        costPerItem: 11.99,
        weight: 0.5,
        length: 10,
        width: 10,
        height: 10,
        trackQuantity: true,
        allowBackorders: false,
        featured: false,
      },
    };
  }
}

/**
 * Generate a basic SKU from product name
 */
function generateSKU(name: string): string {
  const sanitized = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 4);
  const timestamp = Date.now().toString().slice(-4);
  return `${sanitized || "PROD"}-${timestamp}`;
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

import type { UseFormReturn } from "react-hook-form";
import type { ExtractedProduct } from "@/lib/ai/extractors/product-extractor";

/**
 * Type-safe mapping from ExtractedProduct to form values
 * Handles all field transformations in one place
 */
export interface ProductFormValues {
  name: string;
  sku?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  costPerItem?: number;
  category?: string;
  tags?: string[];
  trackQuantity: boolean;
  quantity: number;
  allowBackorders: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  status: "Active" | "Draft" | "Archived";
  featured: boolean;
  images?: string[];
}

/**
 * Maps ExtractedProduct to ProductFormValues
 * Pure function - easy to test
 */
export function mapDraftToFormValues(
  draft: ExtractedProduct,
): Partial<ProductFormValues> {
  const formValues: Partial<ProductFormValues> = {};

  // Direct mappings
  if (draft.name) formValues.name = draft.name;
  if (draft.description) formValues.description = draft.description;
  if (draft.price !== undefined) formValues.price = draft.price;
  if (draft.sku) formValues.sku = draft.sku;
  if (draft.stock !== undefined) formValues.quantity = draft.stock;
  if (draft.compareAtPrice !== undefined)
    formValues.compareAtPrice = draft.compareAtPrice;
  if (draft.costPerItem !== undefined)
    formValues.costPerItem = draft.costPerItem;
  if (draft.weight !== undefined) formValues.weight = draft.weight;

  // Category mapping
  if (draft.categoryId) formValues.category = draft.categoryId.toString();

  // Tags mapping (keep as array)
  if (draft.tags && draft.tags.length > 0) {
    formValues.tags = draft.tags;
  }

  // SEO fields
  if (draft.seoTitle) formValues.seoTitle = draft.seoTitle;
  if (draft.seoDescription) formValues.seoDescription = draft.seoDescription;

  // Boolean fields
  if (draft.trackQuantity !== undefined)
    formValues.trackQuantity = draft.trackQuantity;
  if (draft.allowBackorders !== undefined)
    formValues.allowBackorders = draft.allowBackorders;
  if (draft.featured !== undefined) formValues.featured = draft.featured;

  // Dimensions
  if (
    draft.length !== undefined ||
    draft.width !== undefined ||
    draft.height !== undefined
  ) {
    formValues.dimensions = {
      length: draft.length,
      width: draft.width,
      height: draft.height,
    };
  }

  return formValues;
}

/**
 * Maps field update object to form values
 * Handles field name transformations
 */
export function mapFieldUpdatesToFormValues(
  updates: Record<string, unknown>,
): Partial<ProductFormValues> {
  const formValues: Partial<ProductFormValues> = {};

  Object.entries(updates).forEach(([fieldName, value]) => {
    // Handle special field name mappings
    const formFieldName = fieldName === "stock" ? "quantity" : fieldName;

    // Type-safe assignment
    (formValues as Record<string, unknown>)[formFieldName] = value;
  });

  return formValues;
}

/**
 * Service class for form integration
 * Encapsulates all form-filling logic
 */
export class FormIntegrationService {
  /**
   * Apply product draft to form using batch update
   * Much more efficient than field-by-field updates
   */
  static applyDraftToForm<T extends Record<string, unknown>>(
    form: UseFormReturn<T>,
    draft: ExtractedProduct,
    options?: {
      shouldValidate?: boolean;
      shouldDirty?: boolean;
    },
  ): string[] {
    const formValues = mapDraftToFormValues(draft);
    const fieldNames = Object.keys(formValues);

    // Batch update using reset - triggers only one re-render
    form.reset(
      {
        ...form.getValues(),
        ...formValues,
      } as T,
      {
        keepDefaultValues: true,
        keepErrors: false,
        keepDirty: options?.shouldDirty ?? false,
        keepTouched: false,
      },
    );

    return fieldNames;
  }

  /**
   * Apply field updates to form using batch update
   */
  static applyFieldUpdates<T extends Record<string, unknown>>(
    form: UseFormReturn<T>,
    updates: Record<string, unknown>,
    options?: {
      shouldValidate?: boolean;
      shouldDirty?: boolean;
    },
  ): string[] {
    const formValues = mapFieldUpdatesToFormValues(updates);
    const fieldNames = Object.keys(formValues);

    // Batch update
    form.reset(
      {
        ...form.getValues(),
        ...formValues,
      } as T,
      {
        keepDefaultValues: true,
        keepErrors: false,
        keepDirty: options?.shouldDirty ?? true,
        keepTouched: true,
      },
    );

    return fieldNames;
  }

  /**
   * Get list of fields that would be updated by a draft
   * Useful for preview/highlighting
   */
  static getAffectedFields(draft: ExtractedProduct): string[] {
    const formValues = mapDraftToFormValues(draft);
    return Object.keys(formValues);
  }

  /**
   * Validate if a field name is valid for the form
   */
  static isValidFieldName(
    fieldName: string,
    validFields: readonly string[],
  ): boolean {
    // Handle nested fields (e.g., "dimensions.length")
    const baseField = fieldName.split(".")[0];
    return validFields.includes(baseField as never);
  }
}

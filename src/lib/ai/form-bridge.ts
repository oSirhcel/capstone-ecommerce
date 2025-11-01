import type { FieldValues, Path } from "react-hook-form";

/**
 * Utility to programmatically set form values using React Hook Form
 */
export interface FormFillOptions<T extends FieldValues> {
  onFill?: (field: Path<T>, value: unknown) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  scrollToField?: boolean;
}

/**
 * Fill a React Hook Form with data programmatically
 */
export function fillForm<T extends FieldValues>(
  setValue: (name: Path<T>, value: unknown) => void,
  data: Partial<T>,
  options?: FormFillOptions<T>,
): void {
  try {
    Object.entries(data).forEach(([key, value]) => {
      const fieldName = key as Path<T>;
      setValue(fieldName, value);
      options?.onFill?.(fieldName, value);
    });

    options?.onSuccess?.();
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    options?.onError?.(err);
  }
}

/**
 * Map AI output fields to form field names
 */
export function mapFields<T extends FieldValues>(
  mappings: Record<string, Path<T>>,
  data: Record<string, unknown>,
): Partial<T> {
  const mapped: Partial<T> = {};

  Object.entries(mappings).forEach(([aiField, formField]) => {
    if (data[aiField] !== undefined) {
      mapped[formField] = data[aiField] as T[Path<T>];
    }
  });

  return mapped;
}

/**
 * Generate a field mapping for product form
 */
export function getProductFieldMapping<T extends FieldValues>(): Record<
  string,
  Path<T>
> {
  return {
    name: "name" as Path<T>,
    description: "description" as Path<T>,
    price: "price" as Path<T>,
    stock: "stock" as Path<T>,
    sku: "sku" as Path<T>,
    categoryId: "categoryId" as Path<T>,
    tags: "tags" as Path<T>,
    seoTitle: "seoTitle" as Path<T>,
    seoDescription: "seoDescription" as Path<T>,
    compareAtPrice: "compareAtPrice" as Path<T>,
    costPerItem: "costPerItem" as Path<T>,
    weight: "weight" as Path<T>,
    length: "length" as Path<T>,
    width: "width" as Path<T>,
    height: "height" as Path<T>,
    trackQuantity: "trackQuantity" as Path<T>,
    allowBackorders: "allowBackorders" as Path<T>,
    featured: "featured" as Path<T>,
  };
}

/**
 * Scroll to the first filled field
 */
export function scrollToFirstField(fieldId: string): void {
  const element = document.getElementById(fieldId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus();
  }
}

/**
 * Highlight a filled field temporarily
 */
export function highlightField(fieldId: string, duration = 2000): void {
  const element = document.getElementById(fieldId);
  if (element) {
    element.classList.add("animate-pulse", "ring-2", "ring-primary");
    setTimeout(() => {
      element.classList.remove("animate-pulse", "ring-2", "ring-primary");
    }, duration);
  }
}

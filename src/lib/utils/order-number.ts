/**
 * Formats an order ID to a display-friendly order number
 * @param id - The numeric order ID
 * @returns Formatted order number (e.g., #001, #042, #1234)
 */
export function formatOrderNumber(id: number | string): string {
  const numericId = typeof id === "string" ? parseInt(id, 10) : id;
  return `#${numericId.toString().padStart(3, "0")}`;
}

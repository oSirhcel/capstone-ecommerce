// Utility functions for converting between category names and URL slugs

export function categoryNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/&/g, 'and')  // Replace & with 'and'
    .replace(/[^a-z0-9-]/g, ''); // Remove any other special characters
}

export function slugToCategoryName(slug: string): string {
  return slug
    .replace(/-/g, ' ')     // Replace hyphens with spaces
    .replace(/and/g, '&')   // Replace 'and' with &
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
}

// Map of known category slugs to their actual names for better accuracy
const CATEGORY_SLUG_MAP: Record<string, string> = {
  'accessories': 'Accessories',
  'appliances': 'Appliances', 
  'bags': 'Bags',
  'clothing': 'Clothing',
  'cosmetics': 'Cosmetics',
  'electronics': 'Electronics',
  'equipment': 'Equipment',
  'handmade': 'Handmade',
  'home-and-living': 'Home & Living',
  'stationery': 'Stationery',
  'toys-and-games': 'Toys & Games',
};

export function getKnownCategoryName(slug: string): string | null {
  return CATEGORY_SLUG_MAP[slug] || null;
}

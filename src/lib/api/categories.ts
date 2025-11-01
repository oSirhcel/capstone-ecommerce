export interface Category {
  id: number;
  name: string;
  description: string | null;
  count: number;
  imageUrl: string;
}

export interface CategoriesResponse {
  categories: Category[];
}

export async function fetchCategories(): Promise<CategoriesResponse> {
  const response = await fetch("/api/categories");
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json() as Promise<CategoriesResponse>;
}

import { getBaseUrl, type ApiResponse } from "./config";

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface TagsResponse {
  tags: Tag[];
}

// GET /api/tags - Fetch all tags
export async function fetchTags(): Promise<Tag[]> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/tags`);

    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.statusText}`);
    }

    const data = (await response.json()) as TagsResponse;
    return data.tags;
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}

// POST /api/tags - Create a new tag
export async function createTag(name: string): Promise<ApiResponse<Tag>> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    const data = (await response.json()) as Tag | { error: string };

    if (!response.ok) {
      return {
        error: (data as { error: string }).error ?? "Failed to create tag",
      };
    }

    return { data: data as Tag };
  } catch (error) {
    return { error: "Network error occurred" };
  }
}

// DELETE /api/tags/[id] - Delete a tag
export async function deleteTag(
  id: number,
): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/tags/${id}`, {
      method: "DELETE",
    });

    const data = (await response.json()) as
      | { message: string }
      | { error: string };

    if (!response.ok) {
      return {
        error: (data as { error: string }).error ?? "Failed to delete tag",
      };
    }

    return { data: data as { message: string } };
  } catch (error) {
    return { error: "Network error occurred" };
  }
}

// Utility to generate slug from tag name
export function generateTagSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

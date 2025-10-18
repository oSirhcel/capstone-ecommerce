import { adminProfileSchema } from "@/types/admin";
import type {
  AdminProfile,
  AdminProfileResponse,
  ApiErrorResponse,
} from "@/types/admin";

export async function fetchAdminProfile(): Promise<AdminProfile> {
  const response = await fetch("/api/admin/profile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new Error(error.error ?? "Failed to fetch admin profile");
  }

  const data = (await response.json()) as AdminProfileResponse;

  const result = adminProfileSchema.safeParse(data);

  if (!result.success) {
    console.error("Profile validation error:", result.error);
    throw new Error("Invalid profile data received from server");
  }

  return result.data;
}

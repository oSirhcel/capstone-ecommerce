export interface ProfileData {
  id: string;
  username: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse {
  user: ProfileData;
}

export interface ApiErrorResponse {
  error?: string;
  details?: unknown;
}

export async function fetchProfile(): Promise<ProfileData> {
  const response = await fetch("/api/profile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new Error(error.error ?? "Failed to fetch profile");
  }

  const data = (await response.json()) as ProfileResponse;
  return data.user;
}

export interface UpdateProfileInput {
  username?: string;
}

export async function updateProfile(
  data: UpdateProfileInput,
): Promise<{ message: string }> {
  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new Error(error.error ?? "Failed to update profile");
  }

  return (await response.json()) as { message: string };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function changePassword(
  data: ChangePasswordInput,
): Promise<{ message: string }> {
  const response = await fetch("/api/profile/password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new Error(error.error ?? "Failed to change password");
  }

  return (await response.json()) as { message: string };
}

export interface DeleteAccountInput {
  confirmDelete: boolean;
  password: string;
}

export async function deleteAccount(
  data: DeleteAccountInput,
): Promise<{ message: string }> {
  const response = await fetch("/api/profile/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new Error(error.error ?? "Failed to delete account");
  }

  return (await response.json()) as { message: string };
}


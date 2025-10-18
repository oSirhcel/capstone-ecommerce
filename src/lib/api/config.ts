// API configuration utilities

// Base URL for API calls
export const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // Client-side: use current origin
    return window.location.origin;
  }
  // Server-side: use localhost for development
  return process.env.NEXTAUTH_URL ?? "";
};

// Common API response interface
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

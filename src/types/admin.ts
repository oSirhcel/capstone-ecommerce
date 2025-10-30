import { z } from "zod";

// Zod schemas for runtime validation
export const adminUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().nullable(),
  createdAt: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
});

export const adminStoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  createdAt: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
});

export const adminProfileSchema = z.object({
  user: adminUserSchema,
  store: adminStoreSchema.nullable(),
});

// TypeScript types inferred from schemas
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminStore = z.infer<typeof adminStoreSchema>;
export type AdminProfile = z.infer<typeof adminProfileSchema>;

// API Response type (before transformation)
export interface AdminProfileResponse {
  user: {
    id: string;
    username: string;
    email: string | null;
    createdAt: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: string;
  } | null;
}

// Error response type
export interface ApiErrorResponse {
  error: string;
}

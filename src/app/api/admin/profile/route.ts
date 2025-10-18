import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { users, stores } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { AdminProfileResponse, ApiErrorResponse } from "@/types/admin";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// GET /api/admin/profile - Get current user profile with store information
export async function GET(): Promise<
  NextResponse<AdminProfileResponse | ApiErrorResponse>
> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = (session.user as SessionUser).id;

    // Fetch user data
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "User not found" },
        { status: 404 },
      );
    }

    // Fetch store data if exists
    const [store] = await db
      .select({
        id: stores.id,
        name: stores.name,
        description: stores.description,
        createdAt: stores.createdAt,
      })
      .from(stores)
      .where(eq(stores.ownerId, userId))
      .limit(1);

    const response: AdminProfileResponse = {
      user: {
        id: user.id,
        username: user.username,
        email: (session.user as SessionUser).email ?? null,
        createdAt: user.createdAt.toISOString(),
      },
      store: store
        ? {
            id: store.id,
            name: store.name,
            description: store.description,
            createdAt: store.createdAt.toISOString(),
          }
        : null,
    };

    return NextResponse.json<AdminProfileResponse>(response);
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

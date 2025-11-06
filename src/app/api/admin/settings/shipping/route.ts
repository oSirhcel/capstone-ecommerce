import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { shippingMethods, stores } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userStore = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, session.user.id))
      .limit(1);

    if (userStore.length === 0) {
      return NextResponse.json({ methods: [] });
    }
    const storeId = String(userStore[0].id);

    const methods = await db
      .select()
      .from(shippingMethods)
      .where(eq(shippingMethods.storeId, storeId));

    return NextResponse.json({ methods });
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping methods" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      name: string;
      description?: string | null;
      basePrice: number; // cents
      estimatedDays: number;
      isActive?: boolean;
    };

    if (!body?.name || typeof body.basePrice !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const userStore = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, session.user.id))
      .limit(1);

    if (userStore.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    const storeId = String(userStore[0].id);

    const [created] = await db
      .insert(shippingMethods)
      .values({
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        basePrice: Math.max(0, Math.round(body.basePrice)),
        estimatedDays: Math.max(1, Math.floor(body.estimatedDays)),
        isActive: body.isActive ?? true,
        storeId,
      })
      .returning();

    return NextResponse.json({ method: created });
  } catch (error) {
    console.error("Error creating shipping method:", error);
    return NextResponse.json(
      { error: "Failed to create shipping method" },
      { status: 500 },
    );
  }
}

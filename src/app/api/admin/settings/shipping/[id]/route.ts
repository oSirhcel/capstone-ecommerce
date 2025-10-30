import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { shippingMethods, stores } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getOwnedStoreId(userId: string) {
  const rows = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.ownerId, userId))
    .limit(1);
  return rows[0]?.id ? String(rows[0].id) : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const storeId = await getOwnedStoreId(session.user.id);
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const rows = await db
      .select()
      .from(shippingMethods)
      .where(
        and(
          eq(shippingMethods.id, Number(id)),
          eq(shippingMethods.storeId, storeId),
        ),
      )
      .limit(1);

    if (rows.length === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ method: rows[0] });
  } catch (error) {
    console.error("Error fetching shipping method:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping method" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const storeId = await getOwnedStoreId(session.user.id);
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const body = (await request.json()) as Partial<{
      name: string;
      description: string | null;
      basePrice: number; // cents
      estimatedDays: number;
      isActive: boolean;
    }>;

    const [updated] = await db
      .update(shippingMethods)
      .set({
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && {
          description: body.description ? body.description.trim() : null,
        }),
        ...(body.basePrice !== undefined && {
          basePrice: Math.max(0, Math.round(body.basePrice)),
        }),
        ...(body.estimatedDays !== undefined && {
          estimatedDays: Math.max(1, Math.floor(body.estimatedDays)),
        }),
        ...(body.isActive !== undefined && { isActive: !!body.isActive }),
      })
      .where(
        and(
          eq(shippingMethods.id, Number(id)),
          eq(shippingMethods.storeId, storeId),
        ),
      )
      .returning();

    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ method: updated });
  } catch (error) {
    console.error("Error updating shipping method:", error);
    return NextResponse.json(
      { error: "Failed to update shipping method" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const storeId = await getOwnedStoreId(session.user.id);
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const [deleted] = await db
      .delete(shippingMethods)
      .where(
        and(
          eq(shippingMethods.id, Number(id)),
          eq(shippingMethods.storeId, storeId),
        ),
      )
      .returning();

    if (!deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shipping method:", error);
    return NextResponse.json(
      { error: "Failed to delete shipping method" },
      { status: 500 },
    );
  }
}

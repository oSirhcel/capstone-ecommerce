import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { addresses, stores } from "@/server/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/customers/[id]/addresses?storeId=...
export async function GET(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  if (!storeId)
    return NextResponse.json(
      { error: "Store ID is required" },
      { status: 400 },
    );
  const [store] = await db
    .select({ ownerId: stores.ownerId })
    .from(stores)
    .where(eq(stores.id, storeId));
  if (!store)
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  if (store.ownerId !== session.user.id)
    return NextResponse.json(
      { error: "You do not have access to this store" },
      { status: 403 },
    );

  const { id } = await params;
  const rows = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.userId, id), isNull(addresses.archivedAt)));
  return NextResponse.json({ addresses: rows });
}

// POST /api/admin/customers/[id]/addresses?storeId=...
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId)
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 },
      );
    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, storeId));
    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    if (store.ownerId !== session.user.id)
      return NextResponse.json(
        { error: "You do not have access to this store" },
        { status: 403 },
      );

    const { id } = await params;
    const schema = z.object({
      type: z.enum(["shipping", "billing"]),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional().nullable(),
      city: z.string().min(1),
      state: z.string().min(1),
      postcode: z.string().min(1),
      country: z.string().min(2),
      isDefault: z.boolean().optional(),
    });
    const {
      type,
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      state,
      postcode,
      country,
      isDefault,
    } = schema.parse(await request.json());

    const created = await db.transaction(async (tx) => {
      if (isDefault === true) {
        await tx
          .update(addresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(addresses.userId, id), eq(addresses.type, type)));
      }
      const [row] = await tx
        .insert(addresses)
        .values({
          userId: id,
          type,
          firstName,
          lastName,
          addressLine1,
          addressLine2,
          city,
          state,
          postcode,
          country,
          isDefault: Boolean(isDefault),
        })
        .returning();
      return row;
    });

    return NextResponse.json({ address: created }, { status: 201 });
  } catch (error) {
    console.error("Admin create address error:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/customers/[id]/addresses?storeId=...&addressId=123
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId)
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 },
      );
    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, storeId));
    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    if (store.ownerId !== session.user.id)
      return NextResponse.json(
        { error: "You do not have access to this store" },
        { status: 403 },
      );

    const { id } = await params;
    const addressIdStr = searchParams.get("addressId");
    const addressId = addressIdStr ? parseInt(addressIdStr, 10) : NaN;
    if (!addressId || Number.isNaN(addressId))
      return NextResponse.json({ error: "Invalid addressId" }, { status: 400 });

    const schema = z
      .object({
        version: z.number(),
        isDefault: z.boolean().optional(),
        type: z.enum(["shipping", "billing"]).optional(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        addressLine1: z.string().min(1).optional(),
        addressLine2: z.string().optional().nullable(),
        city: z.string().min(1).optional(),
        state: z.string().min(1).optional(),
        postcode: z.string().min(1).optional(),
        country: z.string().min(2).optional(),
      })
      .strict();
    const parsed = schema.parse(await request.json());
    const { version, isDefault, ...updates } = parsed;

    const updated = await db.transaction(async (tx) => {
      if (isDefault === true && updates.type) {
        await tx
          .update(addresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(
            and(eq(addresses.userId, id), eq(addresses.type, updates.type)),
          );
      }

      const [row] = await tx
        .update(addresses)
        .set({
          ...updates,
          isDefault: isDefault === undefined ? undefined : Boolean(isDefault),
          version: version + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(addresses.id, addressId),
            eq(addresses.userId, id),
            eq(addresses.version, version),
          ),
        )
        .returning();

      return row ?? null;
    });

    if (!updated)
      return NextResponse.json({ error: "Conflict" }, { status: 409 });
    return NextResponse.json({ address: updated });
  } catch (error) {
    console.error("Admin update address error:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/customers/[id]/addresses?storeId=...&addressId=123
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId)
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 },
      );
    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, storeId));
    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    if (store.ownerId !== session.user.id)
      return NextResponse.json(
        { error: "You do not have access to this store" },
        { status: 403 },
      );

    const { id } = await params;
    const addressIdStr = searchParams.get("addressId");
    const addressId = addressIdStr ? parseInt(addressIdStr, 10) : NaN;
    if (!addressId || Number.isNaN(addressId))
      return NextResponse.json({ error: "Invalid addressId" }, { status: 400 });

    const [row] = await db
      .update(addresses)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, id)))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete address error:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 },
    );
  }
}

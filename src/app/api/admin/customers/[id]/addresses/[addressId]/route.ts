import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { addresses, orders, stores } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

import {
  type AddressUpdate,
  addressUpdateSchema,
} from "@/lib/api/admin/customers";
import { auth } from "@/lib/auth";

/**
 * PATCH /api/admin/customers/[id]/addresses/[addressId]
 * Update an existing address
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; addressId: string } },
) {
  // Check admin authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get storeId from query params
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 },
      );
    }

    // Verify user owns the store
    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, storeId));

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (store.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have access to this store" },
        { status: 403 },
      );
    }

    // Verify customer has ordered from this store
    const [hasOrderedFromStore] = await db
      .select({ orderId: orders.id })
      .from(orders)
      .where(and(eq(orders.userId, params.id), eq(orders.storeId, storeId)))
      .limit(1);

    if (!hasOrderedFromStore) {
      return NextResponse.json(
        { error: "Customer not found for this store" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as AddressUpdate;

    // Validate request body
    const updateData = addressUpdateSchema.parse(body);

    // Verify address exists and belongs to customer
    const [existingAddress] = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, parseInt(params.addressId)),
          eq(addresses.userId, params.id),
        ),
      );

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // If setting as default, unset other defaults of the same type
    if (updateData.isDefault) {
      const addressType = updateData.type ?? existingAddress.type;
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(
          and(eq(addresses.userId, params.id), eq(addresses.type, addressType)),
        );
    }

    // Update address
    const [updatedAddress] = await db
      .update(addresses)
      .set(updateData)
      .where(eq(addresses.id, parseInt(params.addressId)))
      .returning();

    return NextResponse.json({
      address: {
        id: updatedAddress.id,
        type: updatedAddress.type,
        firstName: updatedAddress.firstName,
        lastName: updatedAddress.lastName,
        addressLine1: updatedAddress.addressLine1,
        addressLine2: updatedAddress.addressLine2,
        city: updatedAddress.city,
        state: updatedAddress.state,
        postalCode: updatedAddress.postalCode,
        country: updatedAddress.country,
        isDefault: updatedAddress.isDefault,
        createdAt: updatedAddress.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/customers/[id]/addresses/[addressId]
 * Delete an address
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> },
) {
  const { id, addressId } = await params;
  // Check admin authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get storeId from query params
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 },
      );
    }

    // Verify user owns the store
    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, storeId));

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (store.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have access to this store" },
        { status: 403 },
      );
    }

    // Verify customer has ordered from this store
    const [hasOrderedFromStore] = await db
      .select({ orderId: orders.id })
      .from(orders)
      .where(and(eq(orders.userId, id), eq(orders.storeId, storeId)))
      .limit(1);

    if (!hasOrderedFromStore) {
      return NextResponse.json(
        { error: "Customer not found for this store" },
        { status: 404 },
      );
    }

    // Verify address exists and belongs to customer
    const [existingAddress] = await db
      .select()
      .from(addresses)
      .where(
        and(eq(addresses.id, parseInt(addressId)), eq(addresses.userId, id)),
      );

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Delete address
    await db.delete(addresses).where(eq(addresses.id, parseInt(addressId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 },
    );
  }
}

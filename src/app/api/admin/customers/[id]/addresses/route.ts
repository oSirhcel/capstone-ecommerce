import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { addresses, orders, stores } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import {
  type AddressCreate,
  addressCreateSchema,
} from "@/lib/api/admin/customers";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/customers/[id]/addresses
 * Get all addresses for a customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    // Get all addresses
    const customerAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, params.id));

    // Format response
    const formattedAddresses = customerAddresses.map((addr) => ({
      id: addr.id,
      type: addr.type,
      firstName: addr.firstName,
      lastName: addr.lastName,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
      createdAt: addr.createdAt.toISOString(),
    }));

    return NextResponse.json({ addresses: formattedAddresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/customers/[id]/addresses
 * Add a new address for a customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    const body = (await request.json()) as AddressCreate;

    // Validate request body
    const addressData = addressCreateSchema.parse(body);

    // If setting as default, unset other defaults of the same type
    if (addressData.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(
          and(
            eq(addresses.userId, params.id),
            eq(addresses.type, addressData.type),
          ),
        );
    }

    // Insert new address
    const [newAddress] = await db
      .insert(addresses)
      .values({
        userId: params.id,
        ...addressData,
      })
      .returning();

    return NextResponse.json(
      {
        address: {
          id: newAddress.id,
          type: newAddress.type,
          firstName: newAddress.firstName,
          lastName: newAddress.lastName,
          addressLine1: newAddress.addressLine1,
          addressLine2: newAddress.addressLine2,
          city: newAddress.city,
          state: newAddress.state,
          postalCode: newAddress.postalCode,
          country: newAddress.country,
          isDefault: newAddress.isDefault,
          createdAt: newAddress.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 },
    );
  }
}

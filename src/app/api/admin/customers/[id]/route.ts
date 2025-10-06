import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  users,
  userProfiles,
  orders,
  addresses,
  stores,
} from "@/server/db/schema";
import { eq, count, sum, desc, and } from "drizzle-orm";
import {
  type CustomerUpdate,
  customerUpdateSchema,
} from "@/lib/api/admin/customers";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/customers/[id]
 * Get detailed customer information
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

    // Get customer basic info
    const [customer] = await db
      .select({
        id: users.id,
        username: users.username,
        createdAt: users.createdAt,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: userProfiles.email,
        phone: userProfiles.phone,
        dateOfBirth: userProfiles.dateOfBirth,
        location: userProfiles.location,
        tags: userProfiles.tags,
        adminNotes: userProfiles.adminNotes,
        status: userProfiles.status,
      })
      .from(users)
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(users.id, params.id));

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Get order statistics (only for THIS store)
    const [orderStats] = await db
      .select({
        totalOrders: count(orders.id),
        totalSpent: sum(orders.totalAmount),
      })
      .from(orders)
      .where(and(eq(orders.userId, params.id), eq(orders.storeId, storeId)));

    // Get last order (from THIS store)
    const [lastOrderResult] = await db
      .select({ createdAt: orders.createdAt })
      .from(orders)
      .where(and(eq(orders.userId, params.id), eq(orders.storeId, storeId)))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    // Get default address for location fallback
    const [defaultAddress] = await db
      .select({
        city: addresses.city,
        state: addresses.state,
      })
      .from(addresses)
      .where(eq(addresses.userId, params.id))
      .limit(1);

    // Calculate average order value
    const totalOrders = orderStats?.totalOrders || 0;
    const totalSpent = orderStats?.totalSpent
      ? parseInt(orderStats.totalSpent as unknown as string)
      : 0;
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Format response
    const response = {
      // Basic info
      id: customer.id,
      username: customer.username,
      email: customer.email,
      firstName: customer.firstName ?? "",
      lastName: customer.lastName ?? "",
      phone: customer.phone ?? "",
      dateOfBirth: customer.dateOfBirth?.toISOString(),

      // Account info
      status: customer.status,
      customerSince: customer.createdAt.toISOString(),
      emailVerified: true, // TODO: Implement email verification tracking
      phoneVerified: false, // TODO: Implement phone verification tracking

      // Admin fields
      location:
        customer.location ??
        (defaultAddress
          ? `${defaultAddress.city}, ${defaultAddress.state}`
          : ""),
      tags: customer.tags ? (JSON.parse(customer.tags) as string[]) : [],
      notes: customer.adminNotes ?? "",

      // Stats
      totalOrders,
      totalSpent,
      averageOrderValue: Math.round(averageOrderValue),
      lastOrder: lastOrderResult?.createdAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching customer details:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer details" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/customers/[id]
 * Update customer information (admin-editable fields only)
 */
export async function PATCH(
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

    const body = (await request.json()) as CustomerUpdate;

    // Validate request body
    const updateData = customerUpdateSchema.parse(body);

    // Check if customer exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, params.id));

    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Prepare update object
    const updateObject: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updateData.firstName !== undefined)
      updateObject.firstName = updateData.firstName;
    if (updateData.lastName !== undefined)
      updateObject.lastName = updateData.lastName;
    if (updateData.phone !== undefined) updateObject.phone = updateData.phone;
    if (updateData.location !== undefined)
      updateObject.location = updateData.location;
    if (updateData.tags !== undefined)
      updateObject.tags = JSON.stringify(updateData.tags);
    if (updateData.adminNotes !== undefined)
      updateObject.adminNotes = updateData.adminNotes;
    if (updateData.status !== undefined)
      updateObject.status = updateData.status;

    // Update customer profile
    await db
      .update(userProfiles)
      .set(updateObject)
      .where(eq(userProfiles.userId, params.id));

    // Fetch and return updated customer data
    const updatedCustomerResponse = await GET(request, { params });

    return updatedCustomerResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 },
    );
  }
}

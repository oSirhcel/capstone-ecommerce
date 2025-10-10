import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  users,
  userProfiles,
  orders,
  addresses,
  stores,
  storeCustomerProfiles,
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
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
        tags: storeCustomerProfiles.tags,
        adminNotes: storeCustomerProfiles.adminNotes,
        status: storeCustomerProfiles.status,
      })
      .from(users)
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(
        storeCustomerProfiles,
        and(
          eq(storeCustomerProfiles.userId, users.id),
          eq(storeCustomerProfiles.storeId, storeId),
        ),
      )
      .where(eq(users.id, id));

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
      .where(and(eq(orders.userId, id), eq(orders.storeId, storeId)));

    // Get last order (from THIS store)
    const [lastOrderResult] = await db
      .select({ createdAt: orders.createdAt })
      .from(orders)
      .where(and(eq(orders.userId, id), eq(orders.storeId, storeId)))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    // Get default address for potential UI fallback (optional)
    const [defaultAddress] = await db
      .select({ city: addresses.city, state: addresses.state })
      .from(addresses)
      .where(eq(addresses.userId, id))
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
      // Account info (store-scoped)
      status: customer.status ?? "Active",
      customerSince: customer.createdAt.toISOString(),
      emailVerified: true, // TODO: Implement email verification tracking
      phoneVerified: false, // TODO: Implement phone verification tracking

      // Admin fields
      location: defaultAddress
        ? `${defaultAddress.city}, ${defaultAddress.state}`
        : "",
      tags: (customer.tags as unknown as string[]) ?? [],
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
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

    const body = (await request.json()) as CustomerUpdate;

    // Validate request body
    const updateData = customerUpdateSchema.parse(body);

    // Check if customer exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id));

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
    // store-level fields will be updated in storeCustomerProfiles below

    // Update global user profile (personal fields only)
    await db
      .update(userProfiles)
      .set(updateObject)
      .where(eq(userProfiles.userId, id));

    // Upsert store-scoped profile for tags/adminNotes/status
    const storeProfileUpdate: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (updateData.tags !== undefined)
      storeProfileUpdate.tags = updateData.tags;
    if (updateData.adminNotes !== undefined)
      storeProfileUpdate.adminNotes = updateData.adminNotes;
    if (updateData.status !== undefined)
      storeProfileUpdate.status = updateData.status;

    if (Object.keys(storeProfileUpdate).length > 1) {
      // ensure row exists
      const [existingStoreProfile] = await db
        .select({ id: storeCustomerProfiles.id })
        .from(storeCustomerProfiles)
        .where(
          and(
            eq(storeCustomerProfiles.userId, id),
            eq(storeCustomerProfiles.storeId, storeId),
          ),
        )
        .limit(1);

      if (existingStoreProfile) {
        await db
          .update(storeCustomerProfiles)
          .set(storeProfileUpdate)
          .where(eq(storeCustomerProfiles.id, existingStoreProfile.id));
      } else {
        await db.insert(storeCustomerProfiles).values({
          userId: id,
          storeId,
          status: (updateData.status as string) ?? "Active",
          adminNotes: updateData.adminNotes ?? null,
          tags: updateData.tags ?? [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

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

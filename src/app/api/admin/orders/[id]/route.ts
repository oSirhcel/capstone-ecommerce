import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  orders,
  stores,
  users,
  userProfiles,
  orderItems,
  products,
  orderAddresses,
} from "@/server/db/schema";
import { and, eq, sql } from "drizzle-orm";

function isValidStatus(status: string) {
  const allowed = [
    "pending",
    "processing",
    "shipped",
    "completed",
    "cancelled",
    "refunded",
    "on-hold",
    "failed",
  ];
  return allowed.includes(status);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId || Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify store ownership
    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, storeId));
    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    if (store.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch order
    const [orderRow] = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(and(eq(orders.id, Number(id)), eq(orders.storeId, storeId)));
    if (!orderRow)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [customer] = await db
      .select({
        id: users.id,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: userProfiles.email,
        username: users.username,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.id, orderRow.userId));

    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtTime: orderItems.priceAtTime,
        productName: products.name,
      })
      .from(orderItems)
      .leftJoin(products, eq(products.id, orderItems.productId))
      .where(eq(orderItems.orderId, Number(id)));

    const addresses = await db
      .select({
        id: orderAddresses.id,
        type: orderAddresses.type,
        firstName: orderAddresses.firstName,
        lastName: orderAddresses.lastName,
        addressLine1: orderAddresses.addressLine1,
        addressLine2: orderAddresses.addressLine2,
        city: orderAddresses.city,
        state: orderAddresses.state,
        postalCode: orderAddresses.postalCode,
        country: orderAddresses.country,
        createdAt: orderAddresses.createdAt,
      })
      .from(orderAddresses)
      .where(eq(orderAddresses.orderId, Number(id)));

    return NextResponse.json({
      id: orderRow.id,
      status: orderRow.status,
      totalAmount: orderRow.totalAmount,
      createdAt: orderRow.createdAt,
      updatedAt: orderRow.updatedAt,
      customer: {
        id: customer?.id ?? "",
        name:
          `${customer?.firstName ?? ""} ${customer?.lastName ?? ""}`.trim() ||
          customer?.username ||
          "",
        email: customer?.email ?? "",
      },
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        priceAtTime: i.priceAtTime,
      })),
      addresses,
      payment: {
        status: "pending", // placeholder as requested
      },
      timeline: [], // placeholder
    });
  } catch (error) {
    console.error("Admin Order detail GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId || Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify store ownership
    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, storeId));
    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    if (store.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { status?: string };
    if (!body.status || !isValidStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const result = await db
      .update(orders)
      .set({ status: body.status })
      .where(and(eq(orders.id, Number(id)), eq(orders.storeId, storeId)))
      .returning({ id: orders.id, status: orders.status });
    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: result[0] });
  } catch (error) {
    console.error("Admin Order detail PATCH error", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}

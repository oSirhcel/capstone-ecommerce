import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  orders,
  orderItems,
  orderAddresses,
  products,
} from "@/server/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const body = await request.json();

    const { items, totalAmount, contactData, shippingData } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 },
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: "Valid total amount is required" },
        { status: 400 },
      );
    }

    if (!contactData?.email || !shippingData?.firstName) {
      return NextResponse.json(
        { error: "Contact and shipping information are required" },
        { status: 400 },
      );
    }

    // Create the order
    const [order] = await db
      .insert(orders)
      .values({
        userId: user.id,
        status: "pending",
        totalAmount: totalAmount,
      })
      .returning();

    // Persist shipping address snapshot in normalized table
    await db.insert(orderAddresses).values({
      orderId: order.id,
      type: "shipping",
      firstName: shippingData.firstName,
      lastName: shippingData.lastName,
      addressLine1: shippingData.address,
      city: shippingData.city,
      state: shippingData.state,
      postalCode: shippingData.postcode,
      country: shippingData.country || "AU",
    });

    // Create order items
    // NOTE: schema expects `priceAtTime` (not `price`)
    const orderItemsData = items.map((item: any) => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      priceAtTime: Math.round(item.price * 100), // Convert to cents
    }));

    await db.insert(orderItems).values(orderItemsData);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
      shippingAddress: {
        type: "shipping",
        firstName: shippingData.firstName,
        lastName: shippingData.lastName,
        addressLine1: shippingData.address,
        addressLine2: null,
        city: shippingData.city,
        state: shippingData.state,
        postalCode: shippingData.postcode,
        country: shippingData.country || "AU",
      },
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}

// GET /api/orders - Get user's orders or a single order by id
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // If an id is provided, return a single order
    if (idParam) {
      const id = parseInt(idParam);
      if (Number.isNaN(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      }

      const [orderRow] = await db
        .select({
          id: orders.id,
          status: orders.status,
          totalAmount: orders.totalAmount,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(and(eq(orders.userId, user.id), eq(orders.id, id)));

      if (!orderRow) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const items = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          priceAtTime: orderItems.priceAtTime,
          productName: products.name,
        })
        .from(orderItems)
        .leftJoin(products, eq(products.id, orderItems.productId))
        .where(eq(orderItems.orderId, id));

      return NextResponse.json({
        order: {
          id: orderRow.id,
          status: orderRow.status,
          totalAmount: orderRow.totalAmount,
          createdAt: orderRow.createdAt,
          updatedAt: orderRow.updatedAt,
          items: items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            priceAtTime: item.priceAtTime,
          })),
        },
      });
    }

    // Get user's orders with order items (paginated)
    const orderRows = await db
      .select({
        id: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const orderIds = orderRows.map((o) => o.id);
    let itemsByOrderId: Record<
      number,
      Array<{
        id: number;
        productId: number;
        quantity: number;
        priceAtTime: number;
        productName: string | null;
      }>
    > = {};
    if (orderIds.length > 0) {
      const items = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          priceAtTime: orderItems.priceAtTime,
          productName: products.name,
        })
        .from(orderItems)
        .leftJoin(products, eq(products.id, orderItems.productId))
        .where(inArray(orderItems.orderId, orderIds));

      for (const item of items) {
        const bucket =
          itemsByOrderId[item.orderId] || (itemsByOrderId[item.orderId] = []);
        bucket.push({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
          productName: item.productName ?? null,
        });
      }
    }

    return NextResponse.json({
      orders: orderRows.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: itemsByOrderId[order.id] || [],
      })),
      pagination: {
        page,
        limit,
        hasMore: orderRows.length === limit,
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Failed to get orders" },
      { status: 500 },
    );
  }
}

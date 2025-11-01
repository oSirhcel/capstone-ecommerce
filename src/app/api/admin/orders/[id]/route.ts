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
  productImages,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { orderStatusSchema, paymentStatusSchema } from "@/lib/api/admin/orders";

// Validation schema for order updates
const orderUpdateSchema = z.object({
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        priceAtTime: z.number().int().nonnegative(),
      }),
    )
    .optional(),
  shippingAddress: z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postcode: z.string().min(1),
      country: z.string().min(1),
    })
    .optional(),
});

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
        paymentStatus: orders.paymentStatus,
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
        imageUrl: productImages.imageUrl,
      })
      .from(orderItems)
      .leftJoin(products, eq(products.id, orderItems.productId))
      .leftJoin(
        productImages,
        and(
          eq(productImages.productId, products.id),
          eq(productImages.isPrimary, true),
        ),
      )
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
        postcode: orderAddresses.postcode,
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
        imageUrl: i.imageUrl ?? null,
      })),
      addresses,
      payment: {
        status: "Pending",
      },
      timeline: [],
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

    // Fetch existing order to validate status
    const [existingOrder] = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(and(eq(orders.id, Number(id)), eq(orders.storeId, storeId)));

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const bodyJson = (await request.json()) as unknown;
    const parseResult = orderUpdateSchema.safeParse(bodyJson);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const {
      status: newStatus,
      paymentStatus: newPaymentStatus,
      items: newItems,
      shippingAddress: newShippingAddress,
    } = parseResult.data;

    // Validate that Shipped/Completed orders cannot be edited (except status)
    if (
      (newItems || newShippingAddress) &&
      ["Shipped", "Completed"].includes(existingOrder.status)
    ) {
      return NextResponse.json(
        { error: "Cannot edit shipped or completed orders" },
        { status: 400 },
      );
    }

    // Handle full order editing (items + address)
    if (newItems || newShippingAddress) {
      // Update items if provided
      if (newItems) {
        // Delete all existing items and insert new ones (simpler than upsert)
        await db.delete(orderItems).where(eq(orderItems.orderId, Number(id)));

        if (newItems.length > 0) {
          await db.insert(orderItems).values(
            newItems.map((item) => ({
              orderId: Number(id),
              productId: item.productId,
              quantity: item.quantity,
              priceAtTime: item.priceAtTime,
            })),
          );
        }

        // Recalculate total amount
        const totalAmount = newItems.reduce(
          (sum, item) => sum + item.priceAtTime * item.quantity,
          0,
        );

        await db
          .update(orders)
          .set({ totalAmount, updatedAt: new Date() })
          .where(eq(orders.id, Number(id)));
      }

      // Update shipping address if provided
      if (newShippingAddress) {
        // Update existing shipping address or create if doesn't exist
        const [existingAddress] = await db
          .select({ id: orderAddresses.id })
          .from(orderAddresses)
          .where(
            and(
              eq(orderAddresses.orderId, Number(id)),
              eq(orderAddresses.type, "shipping"),
            ),
          );

        if (existingAddress) {
          await db
            .update(orderAddresses)
            .set({
              firstName: newShippingAddress.firstName,
              lastName: newShippingAddress.lastName,
              addressLine1: newShippingAddress.addressLine1,
              addressLine2: newShippingAddress.addressLine2 ?? null,
              city: newShippingAddress.city,
              state: newShippingAddress.state,
              postcode: newShippingAddress.postcode,
              country: newShippingAddress.country,
            })
            .where(eq(orderAddresses.id, existingAddress.id));
        } else {
          await db.insert(orderAddresses).values({
            orderId: Number(id),
            type: "shipping",
            firstName: newShippingAddress.firstName,
            lastName: newShippingAddress.lastName,
            addressLine1: newShippingAddress.addressLine1,
            addressLine2: newShippingAddress.addressLine2 ?? null,
            city: newShippingAddress.city,
            state: newShippingAddress.state,
            postcode: newShippingAddress.postcode,
            country: newShippingAddress.country,
          });
        }
      }

      // Fetch updated order data to return
      const [orderRow] = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          totalAmount: orders.totalAmount,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(eq(orders.id, Number(id)));

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
          imageUrl: productImages.imageUrl,
        })
        .from(orderItems)
        .leftJoin(products, eq(products.id, orderItems.productId))
        .leftJoin(
          productImages,
          and(
            eq(productImages.productId, products.id),
            eq(productImages.isPrimary, true),
          ),
        )
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
          postcode: orderAddresses.postcode,
          country: orderAddresses.country,
          createdAt: orderAddresses.createdAt,
        })
        .from(orderAddresses)
        .where(eq(orderAddresses.orderId, Number(id)));

      return NextResponse.json({
        success: true,
        order: {
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
            imageUrl: i.imageUrl ?? null,
          })),
          addresses,
          payment: {
            status: "Pending",
          },
          timeline: [],
        },
      });
    }

    // Handle simple status/payment status updates
    const updateData: {
      status?: typeof newStatus;
      paymentStatus?: typeof newPaymentStatus;
    } = {};
    if (newStatus) updateData.status = newStatus;
    if (newPaymentStatus) updateData.paymentStatus = newPaymentStatus;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const result = await db
      .update(orders)
      .set(updateData)
      .where(and(eq(orders.id, Number(id)), eq(orders.storeId, storeId)))
      .returning({
        id: orders.id,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
      });
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

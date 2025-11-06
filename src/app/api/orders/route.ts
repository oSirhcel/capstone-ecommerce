import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  orders,
  orderItems,
  addresses,
  products,
  orderShipping,
  paymentTransactions,
  shippingMethods,
  paymentMethods,
  orderAddresses,
  productImages,
} from "@/server/db/schema";
import { and, desc, eq, inArray, asc } from "drizzle-orm";
import { z } from "zod";

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
    const AddressSchema = z.object({
      id: z.number().int().positive().optional(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      addressLine1: z.string().min(1).optional(),
      addressLine2: z.string().optional(),
      address: z.string().optional(),
      city: z.string().min(1).optional(),
      state: z.string().min(1).optional(),
      postcode: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().min(1).optional(),
    });

    const CreateOrderSchema = z.object({
      items: z
        .array(
          z.object({
            productId: z.number().int().positive(),
            quantity: z.number().int().positive(),
            price: z.number().positive(),
          }),
        )
        .min(1),
      totalAmount: z.number().positive(),
      contactData: z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
      }),
      storeId: z.string().min(1),
      shippingAddress: AddressSchema,
      billingAddress: AddressSchema.optional(),
    });

    const parsed = CreateOrderSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: z.treeifyError(parsed.error) },
        { status: 400 },
      );
    }
    const body = parsed.data;

    const {
      items,
      totalAmount,
      storeId,
      shippingAddress: shippingData,
      billingAddress: billingData,
    } = body;

    // Validate required fields
    // All critical validation handled by zod above

    // Note: For demo purposes, payment provider validation is skipped
    // Stores without payment setup will use the default Stripe account

    // Helper function to normalize address data (handles both old and new formats)
    const normalizeAddress = (addr: {
      firstName?: string;
      lastName?: string;
      addressLine1?: string;
      addressLine2?: string;
      address?: string;
      city?: string;
      state?: string;
      postcode?: string;
      zip?: string;
      country?: string;
    }) => ({
      firstName: addr.firstName ?? "",
      lastName: addr.lastName ?? "",
      addressLine1: addr.addressLine1 ?? addr.address ?? "",
      addressLine2: addr.addressLine2 ?? null,
      city: addr.city ?? "",
      state: addr.state ?? "",
      postcode: (addr.postcode ?? addr.zip ?? "").toString(),
      country: addr.country ?? "AU",
    });

    // Create or reference shipping address
    let shippingAddressId: number;

    // If the shipping address already has an ID, verify ownership before using it
    if (shippingData.id) {
      // Verify the address belongs to this user
      const [existingAddress] = await db
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.id, shippingData.id),
            eq(addresses.userId, user.id),
            eq(addresses.type, "shipping"),
          ),
        )
        .limit(1);

      if (!existingAddress) {
        return NextResponse.json(
          { error: "Shipping address not found or does not belong to you" },
          { status: 403 },
        );
      }

      shippingAddressId = shippingData.id;
    } else {
      // Create new shipping address
      const normalizedShipping = normalizeAddress(shippingData);
      const [shippingAddress] = await db
        .insert(addresses)
        .values({
          userId: user.id,
          type: "shipping",
          ...normalizedShipping,
          isDefault: false,
        })
        .returning();
      shippingAddressId = shippingAddress.id;
    }

    // Handle billing address
    let billingAddressId: number | null = null;
    if (billingData) {
      // If the billing address already has an ID, verify ownership before using it
      if (billingData.id) {
        // Check if it's the same as shipping address (when "same as shipping" is checked)
        const isSameAsShipping = billingData.id === shippingAddressId;

        if (isSameAsShipping) {
          // If using shipping address for billing, just reference it
          billingAddressId = shippingAddressId;
        } else {
          // Verify the address belongs to this user (type should be 'billing')
          const [existingAddress] = await db
            .select()
            .from(addresses)
            .where(
              and(
                eq(addresses.id, billingData.id),
                eq(addresses.userId, user.id),
                eq(addresses.type, "billing"),
              ),
            )
            .limit(1);

          if (!existingAddress) {
            return NextResponse.json(
              { error: "Billing address not found or does not belong to you" },
              { status: 403 },
            );
          }

          billingAddressId = billingData.id;
        }
      } else {
        // Create new billing address
        const normalizedBilling = normalizeAddress(billingData);
        const [billingAddress] = await db
          .insert(addresses)
          .values({
            userId: user.id,
            type: "billing",
            ...normalizedBilling,
            isDefault: false,
          })
          .returning();
        billingAddressId = billingAddress.id;
      }
    }

    // Idempotency: check for an existing recent pending order with identical items and total
    {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const recentOrders = await db
        .select({
          id: orders.id,
          totalAmount: orders.totalAmount,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(
          and(
            eq(orders.userId, user.id),
            eq(orders.totalAmount, totalAmount),
            // created recently to avoid matching old historical orders
            // We will perform item-level matching regardless
            // Note: We intentionally do not early-return here if none found
          ),
        )
        .orderBy(desc(orders.createdAt))
        .limit(30);

      for (const candidate of recentOrders) {
        if (candidate.status !== "Pending") continue;
        if (candidate.createdAt < twoHoursAgo) continue;

        const existingItems = await db
          .select({
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            priceAtTime: orderItems.priceAtTime,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, candidate.id));

        const requestedItems = items.map(
          (item: { productId: number; quantity: number; price: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtTime: Math.round(item.price * 100),
          }),
        );

        const sameLength = existingItems.length === requestedItems.length;
        const allMatch =
          sameLength &&
          requestedItems.every((req) => {
            const match = existingItems.find(
              (ex) => ex.productId === req.productId,
            );
            return (
              !!match &&
              match.quantity === req.quantity &&
              match.priceAtTime === req.priceAtTime
            );
          });

        if (allMatch) {
          return NextResponse.json({
            success: true,
            orderId: candidate.id,
            order: {
              id: candidate.id,
              status: candidate.status,
              totalAmount: candidate.totalAmount,
              createdAt: candidate.createdAt,
            },
            shippingAddressId,
            billingAddressId,
            idempotent: true,
          });
        }
      }
    }

    // Create the order (no matching pending order found)
    const [order] = await db
      .insert(orders)
      .values({
        userId: user.id,
        storeId,
        status: "Pending",
        totalAmount: totalAmount,
      })
      .returning();

    // Addresses are captured separately; order items below

    // Create order items
    // NOTE: schema expects `priceAtTime` (not `price`)
    const orderItemsData = items.map(
      (item: { productId: number; quantity: number; price: number }) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: Math.round(item.price * 100), // Convert to cents
      }),
    );

    await db.insert(orderItems).values(orderItemsData);

    // Create address snapshots for the order
    // Get the full address details for shipping address
    const [shippingAddressDetails] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, shippingAddressId))
      .limit(1);

    if (shippingAddressDetails) {
      await db.insert(orderAddresses).values({
        orderId: order.id,
        type: "shipping",
        firstName: shippingAddressDetails.firstName,
        lastName: shippingAddressDetails.lastName,
        addressLine1: shippingAddressDetails.addressLine1,
        addressLine2: shippingAddressDetails.addressLine2,
        city: shippingAddressDetails.city,
        state: shippingAddressDetails.state,
        postcode: shippingAddressDetails.postcode,
        country: shippingAddressDetails.country,
      });
    }

    // Create billing address snapshot if billing address exists
    if (billingAddressId) {
      const [billingAddressDetails] = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, billingAddressId))
        .limit(1);

      if (billingAddressDetails) {
        await db.insert(orderAddresses).values({
          orderId: order.id,
          type: "billing",
          firstName: billingAddressDetails.firstName,
          lastName: billingAddressDetails.lastName,
          addressLine1: billingAddressDetails.addressLine1,
          addressLine2: billingAddressDetails.addressLine2,
          city: billingAddressDetails.city,
          state: billingAddressDetails.state,
          postcode: billingAddressDetails.postcode,
          country: billingAddressDetails.country,
        });
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
      shippingAddressId,
      billingAddressId,
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
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
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

      // Get order items
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

      // Get product images for order items
      const productIds = items.map((item) => item.productId).filter(Boolean);
      const images =
        productIds.length > 0
          ? await db
              .select({
                productId: productImages.productId,
                imageUrl: productImages.imageUrl,
                isPrimary: productImages.isPrimary,
                displayOrder: productImages.displayOrder,
              })
              .from(productImages)
              .where(inArray(productImages.productId, productIds))
              .orderBy(
                desc(productImages.isPrimary),
                asc(productImages.displayOrder),
              )
          : [];

      // Create a map of productId -> imageUrl (primary or first)
      const imageMap = new Map<number, string>();
      for (const img of images) {
        if (img.productId && !imageMap.has(img.productId)) {
          imageMap.set(img.productId, img.imageUrl);
        }
      }

      // Get shipping information
      const [shippingInfo] = await db
        .select({
          id: orderShipping.id,
          trackingNumber: orderShipping.trackingNumber,
          shippedAt: orderShipping.shippedAt,
          deliveredAt: orderShipping.deliveredAt,
          methodName: shippingMethods.name,
          methodDescription: shippingMethods.description,
        })
        .from(orderShipping)
        .leftJoin(
          shippingMethods,
          eq(shippingMethods.id, orderShipping.shippingMethodId),
        )
        .where(eq(orderShipping.orderId, id));

      // Get shipping address from orderAddresses table
      const [shippingAddress] = await db
        .select({
          firstName: orderAddresses.firstName,
          lastName: orderAddresses.lastName,
          addressLine1: orderAddresses.addressLine1,
          addressLine2: orderAddresses.addressLine2,
          city: orderAddresses.city,
          state: orderAddresses.state,
          postcode: orderAddresses.postcode,
          country: orderAddresses.country,
        })
        .from(orderAddresses)
        .where(
          and(
            eq(orderAddresses.orderId, id),
            eq(orderAddresses.type, "shipping"),
          ),
        )
        .limit(1);

      // Get payment information with payment method details
      const [paymentInfo] = await db
        .select({
          id: paymentTransactions.id,
          amount: paymentTransactions.amount,
          currency: paymentTransactions.currency,
          status: paymentTransactions.status,
          transactionId: paymentTransactions.transactionId,
          createdAt: paymentTransactions.createdAt,
          paymentMethodId: paymentTransactions.paymentMethodId,
          paymentMethod: {
            type: paymentMethods.type,
            provider: paymentMethods.provider,
            lastFourDigits: paymentMethods.lastFourDigits,
            expiryMonth: paymentMethods.expiryMonth,
            expiryYear: paymentMethods.expiryYear,
          },
        })
        .from(paymentTransactions)
        .leftJoin(
          paymentMethods,
          eq(paymentMethods.id, paymentTransactions.paymentMethodId),
        )
        .where(eq(paymentTransactions.orderId, id));

      // Get billing address from orderAddresses table
      const [billingAddress] = await db
        .select({
          firstName: orderAddresses.firstName,
          lastName: orderAddresses.lastName,
          addressLine1: orderAddresses.addressLine1,
          addressLine2: orderAddresses.addressLine2,
          city: orderAddresses.city,
          state: orderAddresses.state,
          postcode: orderAddresses.postcode,
          country: orderAddresses.country,
        })
        .from(orderAddresses)
        .where(
          and(
            eq(orderAddresses.orderId, id),
            eq(orderAddresses.type, "billing"),
          ),
        )
        .limit(1);

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
            imageUrl: item.productId
              ? (imageMap.get(item.productId) ?? null)
              : null,
          })),
          shipping: shippingAddress
            ? {
                trackingNumber: shippingInfo?.trackingNumber,
                shippedAt: shippingInfo?.shippedAt,
                deliveredAt: shippingInfo?.deliveredAt,
                method: shippingInfo?.methodName ?? "Standard Shipping",
                description: shippingInfo?.methodDescription,
                address: shippingAddress,
              }
            : null,
          payment: paymentInfo
            ? {
                amount: paymentInfo.amount,
                currency: paymentInfo.currency,
                status: paymentInfo.status,
                transactionId: paymentInfo.transactionId,
                createdAt: paymentInfo.createdAt,
                paymentMethod: paymentInfo.paymentMethod
                  ? {
                      type: paymentInfo.paymentMethod.type,
                      provider: paymentInfo.paymentMethod.provider,
                      lastFourDigits: paymentInfo.paymentMethod.lastFourDigits,
                      expiryMonth: paymentInfo.paymentMethod.expiryMonth,
                      expiryYear: paymentInfo.paymentMethod.expiryYear,
                    }
                  : null,
                billingAddress: billingAddress,
              }
            : null,
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
    const itemsByOrderId: Record<
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
          itemsByOrderId[item.orderId] ?? (itemsByOrderId[item.orderId] = []);
        bucket.push({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
          productName: item.productName ?? null,
        });
      }

      // Get product images for all order items
      const allProductIds = Array.from(
        new Set(items.map((item) => item.productId).filter(Boolean)),
      );
      const images =
        allProductIds.length > 0
          ? await db
              .select({
                productId: productImages.productId,
                imageUrl: productImages.imageUrl,
                isPrimary: productImages.isPrimary,
                displayOrder: productImages.displayOrder,
              })
              .from(productImages)
              .where(inArray(productImages.productId, allProductIds))
              .orderBy(
                desc(productImages.isPrimary),
                asc(productImages.displayOrder),
              )
          : [];

      // Create a map of productId -> imageUrl (primary or first)
      const imageMap = new Map<number, string>();
      for (const img of images) {
        if (img.productId && !imageMap.has(img.productId)) {
          imageMap.set(img.productId, img.imageUrl);
        }
      }

      // Add imageUrl to items
      for (const orderId in itemsByOrderId) {
        itemsByOrderId[orderId] = itemsByOrderId[orderId].map((item) => ({
          ...item,
          imageUrl: item.productId
            ? (imageMap.get(item.productId) ?? null)
            : null,
        }));
      }
    }

    return NextResponse.json({
      orders: orderRows.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: itemsByOrderId[order.id] ?? [],
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

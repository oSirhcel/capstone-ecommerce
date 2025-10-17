import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/server/db';
import { orders, orderItems, addresses, products } from '@/server/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const body = await request.json();
    
    const {
      items,
      totalAmount,
      contactData,
      shippingAddress: shippingData,
      billingAddress: billingData,
    } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid total amount is required' },
        { status: 400 }
      );
    }

    if (!contactData?.email || !shippingData?.firstName) {
      return NextResponse.json(
        { error: 'Contact and shipping information are required' },
        { status: 400 }
      );
    }

    // Helper function to normalize address data (handles both old and new formats)
    const normalizeAddress = (addr: {
      firstName?: string;
      lastName?: string;
      addressLine1?: string;
      addressLine2?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      postcode?: string;
      country?: string;
    }) => ({
      firstName: addr.firstName ?? '',
      lastName: addr.lastName ?? '',
      addressLine1: addr.addressLine1 ?? addr.address ?? '',
      addressLine2: addr.addressLine2 ?? null,
      city: addr.city ?? '',
      state: addr.state ?? '',
      postalCode: addr.postalCode ?? addr.postcode ?? '',
      country: addr.country ?? 'AU',
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
            eq(addresses.type, 'shipping')
          )
        )
        .limit(1);
      
      if (!existingAddress) {
        return NextResponse.json(
          { error: 'Shipping address not found or does not belong to you' },
          { status: 403 }
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
          type: 'shipping',
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
                eq(addresses.type, 'billing')
              )
            )
            .limit(1);
          
          if (!existingAddress) {
            return NextResponse.json(
              { error: 'Billing address not found or does not belong to you' },
              { status: 403 }
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
            type: 'billing',
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
            // @ts-expect-error drizzle timestamp compare helper used below
            // drizzle-orm supports Date in comparisons
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // the gte helper is not imported here; keep simple by filtering after fetch if needed
            // We will perform item-level matching regardless
            // Note: We intentionally do not early-return here if none found
          )
        )
        .orderBy(desc(orders.createdAt))
        .limit(30);

      for (const candidate of recentOrders) {
        if (candidate.status !== 'pending') continue;
        if (candidate.createdAt < twoHoursAgo) continue;

        const existingItems = await db
          .select({
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            priceAtTime: orderItems.priceAtTime,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, candidate.id));

        const requestedItems = items.map((item: { productId: number; quantity: number; price: number; }) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: Math.round(item.price * 100),
        }));

        const sameLength = existingItems.length === requestedItems.length;
        const allMatch = sameLength && requestedItems.every((req) => {
          const match = existingItems.find((ex) => ex.productId === req.productId);
          return !!match && match.quantity === req.quantity && match.priceAtTime === req.priceAtTime;
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
        status: 'pending',
        totalAmount: totalAmount,
      })
      .returning();

    // Create order items
    // NOTE: schema expects `priceAtTime` (not `price`)
    const orderItemsData = items.map((item: {
      productId: number;
      quantity: number;
      price: number;
    }) => ({
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
      shippingAddressId,
      billingAddressId,
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET /api/orders - Get user's orders or a single order by id
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // If an id is provided, return a single order
    if (idParam) {
      const id = parseInt(idParam);
      if (Number.isNaN(id)) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
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
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
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
          items: items.map(item => ({
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

    const orderIds = orderRows.map(o => o.id);
    const itemsByOrderId: Record<number, Array<{ id: number; productId: number; quantity: number; priceAtTime: number; productName: string | null }>> = {};
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
        const bucket = itemsByOrderId[item.orderId] || (itemsByOrderId[item.orderId] = []);
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
      orders: orderRows.map(order => ({
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
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to get orders' },
      { status: 500 }
    );
  }
}

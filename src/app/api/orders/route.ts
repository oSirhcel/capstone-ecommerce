import { NextRequest, NextResponse } from 'next/server';
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
    
    console.log("Received order request body:", JSON.stringify(body, null, 2));
    
    const {
      items,
      totalAmount,
      contactData,
      shippingAddress: shippingData,
      billingAddress: billingData,
    } = body;

    console.log("Extracted shipping data:", shippingData);
    console.log("Extracted billing data:", billingData);

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
    const normalizeAddress = (addr: any) => ({
      firstName: addr.firstName,
      lastName: addr.lastName,
      addressLine1: addr.addressLine1 || addr.address, // Support both formats
      addressLine2: addr.addressLine2 || null,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode || addr.postcode, // Support both formats
      country: addr.country || 'AU',
    });

    // Create or reference shipping address
    let shippingAddressId: number;
    
    // If the shipping address already has an ID, it's a saved address - just use it
    if (shippingData.id) {
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
      // If the billing address already has an ID, it's a saved address
      if (billingData.id) {
        billingAddressId = billingData.id;
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

    // Create the order
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
    let itemsByOrderId: Record<number, Array<{ id: number; productId: number; quantity: number; priceAtTime: number; productName: string | null }>> = {};
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

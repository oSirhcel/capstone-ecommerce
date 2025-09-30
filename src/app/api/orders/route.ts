import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/server/db';
import { orders, orderItems, addresses } from '@/server/db/schema';

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
      shippingData,
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

    // Create shipping address first (match schema fields)
    const [shippingAddress] = await db
      .insert(addresses)
      .values({
        userId: user.id,
        type: 'shipping',
        firstName: shippingData.firstName,
        lastName: shippingData.lastName,
        addressLine1: shippingData.address,
        // addressLine2 not collected on UI; store as null/undefined
        city: shippingData.city,
        state: shippingData.state,
        postalCode: shippingData.postcode,
        country: shippingData.country || 'AU',
        isDefault: false,
      })
      .returning();

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
      shippingAddressId: shippingAddress.id,
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get user's orders with order items
    const userOrders = await db.query.orders.findMany({
      where: (orders, { eq }) => eq(orders.userId, user.id),
      with: {
        orderItems: {
          with: {
            product: true,
          },
        },
      },
      limit,
      offset,
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    return NextResponse.json({
      orders: userOrders.map(order => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.orderItems.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name,
          quantity: item.quantity,
          price: item.price,
        })),
      })),
      pagination: {
        page,
        limit,
        hasMore: userOrders.length === limit,
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

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/server/db';
import { paymentMethods } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  createOrRetrieveCustomer,
  savePaymentMethod,
  getCustomerPaymentMethods,
} from '@/lib/stripe';

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

// GET /api/payments/methods - Get user's saved payment methods
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;

    // Get payment methods from database
    const dbPaymentMethods = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.userId, user.id),
          eq(paymentMethods.isActive, true)
        )
      );

    // Also get from Stripe for real-time data
    try {
      // Handle credentials users who have fake @local emails
      const userEmail = user.email?.endsWith('@local') ? undefined : user.email;
      
      const customer = await createOrRetrieveCustomer({
        userId: user.id,
        email: userEmail || undefined,
        name: user.name || undefined,
      });

      const stripePaymentMethods = await getCustomerPaymentMethods(customer.id);

      // Combine and format the data
      const formattedMethods = dbPaymentMethods.map(method => {
        const stripeMethod = stripePaymentMethods.data.find(
          sm => sm.id === method.provider
        );

        return {
          id: method.id,
          type: method.type,
          provider: method.provider,
          lastFourDigits: method.lastFourDigits,
          expiryMonth: method.expiryMonth,
          expiryYear: method.expiryYear,
          isDefault: method.isDefault,
          brand: stripeMethod?.card?.brand,
          funding: stripeMethod?.card?.funding,
          createdAt: method.createdAt,
        };
      });

      return NextResponse.json({
        paymentMethods: formattedMethods,
      });

    } catch (stripeError) {
      console.warn('Stripe payment methods fetch failed:', stripeError);
      
      // Return just database methods if Stripe fails
      return NextResponse.json({
        paymentMethods: dbPaymentMethods.map(method => ({
          id: method.id,
          type: method.type,
          provider: method.provider,
          lastFourDigits: method.lastFourDigits,
          expiryMonth: method.expiryMonth,
          expiryYear: method.expiryYear,
          isDefault: method.isDefault,
          createdAt: method.createdAt,
        })),
      });
    }

  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment methods' },
      { status: 500 }
    );
  }
}

// POST /api/payments/methods - Save a new payment method
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const body = await request.json();
    
    const { paymentMethodId, setAsDefault = false } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID required' },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    // Handle credentials users who have fake @local emails
    const userEmail = user.email?.endsWith('@local') ? undefined : user.email;
    
    const customer = await createOrRetrieveCustomer({
      userId: user.id,
      email: userEmail || undefined,
      name: user.name || undefined,
    });

    // Attach payment method to customer in Stripe
    const stripePaymentMethod = await savePaymentMethod({
      customerId: customer.id,
      paymentMethodId,
    });

    // If setting as default, update existing methods
    if (setAsDefault) {
      await db
        .update(paymentMethods)
        .set({ isDefault: false })
        .where(eq(paymentMethods.userId, user.id));
    }

    // Save to database
    const [savedMethod] = await db
      .insert(paymentMethods)
      .values({
        userId: user.id,
        type: stripePaymentMethod.type,
        provider: stripePaymentMethod.id,
        lastFourDigits: stripePaymentMethod.card?.last4 || null,
        expiryMonth: stripePaymentMethod.card?.exp_month || null,
        expiryYear: stripePaymentMethod.card?.exp_year || null,
        isDefault: setAsDefault,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      paymentMethod: {
        id: savedMethod.id,
        type: savedMethod.type,
        provider: savedMethod.provider,
        lastFourDigits: savedMethod.lastFourDigits,
        expiryMonth: savedMethod.expiryMonth,
        expiryYear: savedMethod.expiryYear,
        isDefault: savedMethod.isDefault,
        brand: stripePaymentMethod.card?.brand,
        funding: stripePaymentMethod.card?.funding,
      },
    });

  } catch (error) {
    console.error('Save payment method error:', error);
    return NextResponse.json(
      { error: 'Failed to save payment method' },
      { status: 500 }
    );
  }
}

// PUT /api/payments/methods - Update payment method (e.g., set as default)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const body = await request.json();
    
    const { paymentMethodId, setAsDefault } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID required' },
        { status: 400 }
      );
    }

    // Check if payment method belongs to user
    const [existingMethod] = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, paymentMethodId),
          eq(paymentMethods.userId, user.id)
        )
      )
      .limit(1);

    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // If setting as default, remove default from other methods
    if (setAsDefault) {
      await db
        .update(paymentMethods)
        .set({ isDefault: false })
        .where(eq(paymentMethods.userId, user.id));
    }

    // Update the payment method
    const [updatedMethod] = await db
      .update(paymentMethods)
      .set({
        isDefault: setAsDefault,
      })
      .where(eq(paymentMethods.id, paymentMethodId))
      .returning();

    return NextResponse.json({
      success: true,
      paymentMethod: updatedMethod,
    });

  } catch (error) {
    console.error('Update payment method error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/methods - Delete a payment method
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID required' },
        { status: 400 }
      );
    }

    // Check if payment method belongs to user
    const [existingMethod] = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, parseInt(paymentMethodId)),
          eq(paymentMethods.userId, user.id)
        )
      )
      .limit(1);

    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive
    await db
      .update(paymentMethods)
      .set({
        isActive: false,
        isDefault: false,
      })
      .where(eq(paymentMethods.id, parseInt(paymentMethodId)));

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully',
    });

  } catch (error) {
    console.error('Delete payment method error:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}

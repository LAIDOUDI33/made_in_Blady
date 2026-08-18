// GET /api/payments/stripe/customers/[id] - Get customer payment methods
// PUT /api/payments/stripe/customers/[id] - Update customer default payment method
// DELETE /api/payments/stripe/customers/[id] - Delete customer's saved payment method

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getCustomerPaymentMethods,
  setDefaultPaymentMethod,
  detachPaymentMethod,
} from '@/lib/payments/stripe/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/payments/stripe/customers/[id] - Get customer's saved payment methods
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: customerId } = await context.params;

    // Find Stripe customer record
    const stripeCustomer = await db.stripeCustomer.findFirst({
      where: {
        OR: [
          { id: customerId },
          { userId: customerId }, // Allow lookup by user ID
          { stripeCustomerId: customerId }, // Allow lookup by Stripe customer ID
        ],
        userId: session.user.id, // Ensure user owns this customer
      },
      include: {
        paymentMethods: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!stripeCustomer) {
      return NextResponse.json(
        { success: false, error: 'Stripe customer not found' },
        { status: 404 }
      );
    }

    // Get fresh payment methods from Stripe (optional, can use cached data)
    const searchParams = request.nextUrl.searchParams;
    const refreshFromStripe = searchParams.get('refresh') === 'true';

    let paymentMethods;

    if (refreshFromStripe) {
      // Fetch latest from Stripe API
      const stripePaymentMethods = await getCustomerPaymentMethods(
        stripeCustomer.stripeCustomerId
      );
      
      // Sync with database
      for (const pm of stripePaymentMethods) {
        await db.stripePaymentMethod.upsert({
          where: { stripePaymentMethodId: pm.id },
          update: {
            type: pm.type,
            brand: pm.brand,
            last4: pm.last4,
            expMonth: pm.expMonth,
            expYear: pm.expYear,
            isDefault: pm.isDefault,
          },
          create: {
            stripeCustomerId: stripeCustomer.stripeCustomerId,
            stripePaymentMethodId: pm.id,
            userId: session.user.id,
            type: pm.type,
            brand: pm.brand,
            last4: pm.last4,
            expMonth: pm.expMonth || 0,
            expYear: pm.expYear || 0,
            isDefault: pm.isDefault,
          },
        });
      }

      paymentMethods = stripePaymentMethods;
    } else {
      // Use cached data from database
      paymentMethods = stripeCustomer.paymentMethods.map((pm) => ({
        id: pm.stripePaymentMethodId,
        type: pm.type,
        brand: pm.brand,
        last4: pm.last4,
        expMonth: pm.expMonth,
        expYear: pm.expYear,
        isDefault: pm.isDefault,
        createdAt: pm.createdAt.toISOString(),
      }));
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: stripeCustomer.id,
        stripeCustomerId: stripeCustomer.stripeCustomerId,
        email: stripeCustomer.email,
        name: stripeCustomer.name,
        currency: stripeCustomer.currency,
        defaultPaymentMethodId: stripeCustomer.defaultPaymentMethodId,
      },
      paymentMethods,
    });

  } catch (error) {
    console.error('[Stripe Customers GET] Error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve customer information' },
      { status: 500 }
    );
  }
}

// PUT /api/payments/stripe/customers/[id] - Update customer settings
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: customerId } = await context.params;
    const body = await request.json();
    const { defaultPaymentMethodId, currency, name } = body;

    // Find Stripe customer record
    const stripeCustomer = await db.stripeCustomer.findFirst({
      where: {
        OR: [
          { id: customerId },
          { userId: customerId },
          { stripeCustomerId: customerId },
        ],
        userId: session.user.id,
      },
    });

    if (!stripeCustomer) {
      return NextResponse.json(
        { success: false, error: 'Stripe customer not found' },
        { status: 404 }
      );
    }

    // Update fields
    const updateData: Record<string, unknown> = {};

    if (currency) {
      updateData.currency = currency;
    }

    if (name !== undefined) {
      updateData.name = name;
    }

    if (defaultPaymentMethodId) {
      // Set as default in Stripe
      const result = await setDefaultPaymentMethod(
        stripeCustomer.stripeCustomerId,
        defaultPaymentMethodId
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to update default payment method' },
          { status: 400 }
        );
      }

      updateData.defaultPaymentMethodId = defaultPaymentMethodId;

      // Update in database
      await db.stripePaymentMethod.updateMany({
        where: {
          stripeCustomerId: stripeCustomer.stripeCustomerId,
        },
        data: { isDefault: false },
      });

      await db.stripePaymentMethod.updateMany({
        where: {
          stripePaymentMethodId: defaultPaymentMethodId,
        },
        data: { isDefault: true },
      });
    }

    // Apply updates
    if (Object.keys(updateData).length > 0) {
      await db.stripeCustomer.update({
        where: { id: stripeCustomer.id },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
    });

  } catch (error) {
    console.error('[Stripe Customers PUT] Error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/stripe/customers/[id]?paymentMethodId=xxx - Remove a payment method
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: customerId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const paymentMethodId = searchParams.get('paymentMethodId');

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'paymentMethodId query parameter is required' },
        { status: 400 }
      );
    }

    // Find Stripe customer record
    const stripeCustomer = await db.stripeCustomer.findFirst({
      where: {
        OR: [
          { id: customerId },
          { userId: customerId },
          { stripeCustomerId: customerId },
        ],
        userId: session.user.id,
      },
    });

    if (!stripeCustomer) {
      return NextResponse.json(
        { success: false, error: 'Stripe customer not found' },
        { status: 404 }
      );
    }

    // Detach from Stripe
    const result = await detachPaymentMethod(paymentMethodId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to remove payment method' },
        { status: 400 }
      );
    }

    // Remove from database or mark as inactive
    await db.stripePaymentMethod.updateMany({
      where: {
        stripePaymentMethodId: paymentMethodId,
        stripeCustomerId: stripeCustomer.stripeCustomerId,
      },
      data: { isActive: false },
    });

    // If it was the default, clear that
    if (stripeCustomer.defaultPaymentMethodId === paymentMethodId) {
      await db.stripeCustomer.update({
        where: { id: stripeCustomer.id },
        data: { defaultPaymentMethodId: null },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully',
    });

  } catch (error) {
    console.error('[Stripe Customers DELETE] Error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}

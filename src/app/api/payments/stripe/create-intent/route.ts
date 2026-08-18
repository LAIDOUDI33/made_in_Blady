// POST /api/payments/stripe/create-intent
// Create a new Stripe Payment Intent for international card payments

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  createPaymentIntent,
  stripeConfig,
} from '@/lib/payments/stripe/client';
import type { StripePaymentRequest } from '@/lib/payments/stripe/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: StripePaymentRequest = await request.json();
    
    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount: must be greater than 0', errorCode: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    if (!body.currency || !stripeConfig.supportedCurrencies.includes(body.currency as any)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Unsupported currency. Supported: ${stripeConfig.supportedCurrencies.join(', ')}`,
          errorCode: 'INVALID_CURRENCY' 
        },
        { status: 400 }
      );
    }

    if (!body.customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Customer email is required', errorCode: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!body.orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required', errorCode: 'MISSING_ORDER_ID' },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to user
    const order = await db.order.findUnique({
      where: { id: body.orderId },
      include: { 
        payment: true,
        stripeTransaction: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found', errorCode: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify user is the buyer
    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only pay for your own orders', errorCode: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Check for existing Stripe transaction (prevent duplicate payments)
    if (order.stripeTransaction && !['CANCELED', 'FAILED'].includes(order.stripeTransaction.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A Stripe transaction already exists for this order',
          errorCode: 'DUPLICATE_TRANSACTION',
          existingStatus: order.stripeTransaction.status,
        },
        { status: 409 }
      );
    }

    // Prepare payment request with user ID
    const paymentRequest: StripePaymentRequest = {
      ...body,
      customerId: session.user.id,
      description: `AlgeriaTrade.dz Export Order #${order.orderNumber}`,
      metadata: {
        userId: session.user.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        buyerEmail: session.user.email || '',
      },
    };

    // Create Stripe Payment Intent
    const result = await createPaymentIntent(paymentRequest);

    // Create or update Stripe Transaction record in database
    let stripeTransaction;
    
    if (order.stripeTransaction && ['CANCELED', 'FAILED'].includes(order.stripeTransaction.status)) {
      // Update existing failed/canceled transaction
      stripeTransaction = await db.stripeTransaction.update({
        where: { id: order.stripeTransaction.id },
        data: {
          paymentIntentId: result.paymentIntentId,
          amount: result.amount,
          targetCurrency: result.currency,
          convertedAmount: result.convertedAmount,
          exchangeRate: result.exchangeRate,
          stripeFee: result.estimatedFees,
          netAmount: result.convertedAmount - result.estimatedFees,
          status: result.status,
          rawEvent: JSON.stringify(result),
        },
      });
    } else {
      // Create new transaction record
      stripeTransaction = await db.stripeTransaction.create({
        data: {
          paymentIntentId: result.paymentIntentId,
          orderId: order.id,
          userId: session.user.id,
          amount: result.amount,
          originalCurrency: 'DZD',
          targetCurrency: result.currency,
          convertedAmount: result.convertedAmount,
          exchangeRate: result.exchangeRate,
          stripeFee: result.estimatedFees,
          netAmount: result.convertedAmount - result.estimatedFees,
          status: result.status,
          rawEvent: JSON.stringify(result),
        },
      });
    }

    // Log transaction creation
    await db.transactionLog.create({
      data: {
        action: 'stripe_intent_created',
        details: JSON.stringify({
          stripeTransactionId: stripeTransaction.id,
          paymentIntentId: result.paymentIntentId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          amountDZD: result.amount,
          convertedAmount: result.convertedAmount,
          currency: result.currency,
          exchangeRate: result.exchangeRate,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId: session.user.id,
      },
    });

    // Return success response with client secret
    return NextResponse.json({
      success: true,
      transaction: {
        id: stripeTransaction.id,
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        publishableKey: result.publishableKey,
        amount: result.amount,
        currency: result.currency,
        convertedAmount: result.convertedAmount,
        exchangeRate: result.exchangeRate,
        estimatedFees: result.estimatedFees,
        status: result.status,
      },
      message: 'Payment intent created successfully',
    });

  } catch (error) {
    console.error('[Stripe Create Intent] Error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes('Invalid amount')) {
        return NextResponse.json(
          { success: false, error: errorMessage, errorCode: 'INVALID_AMOUNT' },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes('Unsupported currency')) {
        return NextResponse.json(
          { success: false, error: errorMessage, errorCode: 'INVALID_CURRENCY' },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes('Minimum amount')) {
        return NextResponse.json(
          { success: false, error: errorMessage, errorCode: 'BELOW_MINIMUM' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create payment intent', errorCode: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// GET /api/payments/stripe/create-intent - Get configuration info
export async function GET() {
  return NextResponse.json({
    success: true,
    config: {
      publishableKey: stripeConfig.publishableKey,
      supportedCurrencies: stripeConfig.supportedCurrencies,
      features: stripeConfig.features,
    },
  });
}

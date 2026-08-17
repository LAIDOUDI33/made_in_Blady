import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  initializeStripe,
  createStripePaymentIntent,
  refundStripePayment,
  getStripeClient,
  getStripeConfig,
} from '@/lib/payments/stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Initialize Stripe on module load
function ensureStripeInitialized() {
  try {
    getStripeConfig()
  } catch {
    const config = {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      environment: (process.env.STRIPE_ENVIRONMENT as 'test' | 'production') || 'test',
    }
    
    if (!config.secretKey) {
      console.warn('[Stripe] Missing secret key. Using test mode with mock responses.')
      // Set a dummy key for testing
      config.secretKey = 'sk_test_dummy_key_for_development'
    }
    
    initializeStripe(config)
  }
}

// POST /api/payments/stripe/create-intent - Create new payment intent
export async function POST(request: NextRequest) {
  ensureStripeInitialized()

  // ========================================
  // AUTHENTICATION (CRITICAL)
  // ========================================
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { 
      orderId, 
      amount, 
      currency = 'USD', 
      customerEmail, 
      customerName,
      action = 'create-intent',
      paymentIntentId, // For refunds
      refundAmount,
    } = body

    // Handle different actions
    if (action === 'refund') {
      return handleRefund(paymentIntentId, refundAmount)
    }

    // Create payment intent
    if (!orderId || !amount || !customerEmail || !customerName) {
      return NextResponse.json(
        { success: false, error: 'orderId, amount, customerEmail, and customerName are required' },
        { status: 400 }
      )
    }

    // Check if order exists and user owns it
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify user is the buyer
    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only pay for your own orders' },
        { status: 403 }
      )
    }

    // Check for existing payment
    if (order.payment && order.payment.status !== 'FAILED' && order.payment.status !== 'CANCELLED') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment already exists for this order',
          paymentStatus: order.payment.status 
        },
        { status: 409 }
      )
    }

    // Create Stripe Payment Intent
    const result = await createStripePaymentIntent({
      amount: parseFloat(amount),
      currency,
      orderId: order.orderNumber,
      customerEmail,
      customerName,
      metadata: {
        userId: session.user.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to create payment intent',
          errorCode: result.errorCode 
        },
        { status: 400 }
      )
    }

    // Create or update payment record in database
    let payment
    if (order.payment) {
      payment = await db.payment.update({
        where: { orderId: order.id },
        data: {
          method: 'CIB', // Using CIB method for international cards via Stripe
          status: 'PROCESSING',
          transactionId: result.paymentIntentId,
          currency: currency.toUpperCase(),
          metadata: JSON.stringify({
            stripePaymentIntentId: result.paymentIntentId,
            stripeClientSecret: result.clientSecret,
            createdAt: new Date().toISOString(),
          }),
        }
      })
    } else {
      payment = await db.payment.create({
        data: {
          orderId: order.id,
          amount: parseFloat(amount),
          currency: currency.toUpperCase(),
          method: 'CIB',
          status: 'PROCESSING',
          transactionId: result.paymentIntentId,
          referenceNumber: `STP-${Date.now()}`,
          metadata: JSON.stringify({
            stripePaymentIntentId: result.paymentIntentId,
            stripeClientSecret: result.clientSecret,
            createdAt: new Date().toISOString(),
          }),
        }
      })
    }

    // Log transaction
    await db.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: 'stripe_payment_intent_created',
        details: JSON.stringify({
          stripePaymentIntentId: result.paymentIntentId,
          orderId: order.orderNumber,
          amount: parseFloat(amount),
          currency,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId: session.user.id,
      }
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        publishableKey: result.publishableKey,
        status: payment.status,
      },
      message: 'Payment intent created. Complete payment on frontend.',
    })
  } catch (error) {
    console.error('[Stripe API] Error:', error)
    
    // Check for specific Stripe errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type: string; message: string; code?: string }
      return NextResponse.json(
        { 
          success: false, 
          error: stripeError.message,
          errorCode: stripeError.code || 'STRIPE_ERROR' 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle refund action
async function handleRefund(
  paymentIntentId?: string,
  refundAmount?: number
): Promise<NextResponse> {
  if (!paymentIntentId) {
    return NextResponse.json(
      { success: false, error: 'paymentIntentId is required for refund' },
      { status: 400 }
    )
  }

  try {
    const result = await refundStripePayment(paymentIntentId, refundAmount)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Refund failed' },
        { status: 400 }
      )
    }

    // Update payment record in database
    const payment = await db.payment.findFirst({
      where: {
        OR: [
          { transactionId: paymentIntentId },
          { metadata: { contains: paymentIntentId } },
        ],
      },
    })

    if (payment) {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || '{}'),
            refundId: result.refundId,
            refundedAt: new Date().toISOString(),
            refundAmount,
          }),
        },
      })

      // Log refund
      await db.transactionLog.create({
        data: {
          paymentId: payment.id,
          action: 'stripe_refund_processed',
          details: JSON.stringify({
            refundId: result.refundId,
            paymentIntentId,
            refundAmount,
          }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: result.refundId,
        status: result.status,
      },
    })
  } catch (error) {
    console.error('[Stripe API] Refund error:', error)
    return NextResponse.json(
      { success: false, error: 'Refund processing failed' },
      { status: 500 }
    )
  }
}

// GET /api/payments/stripe - Get configuration info (publishable key only!)
export async function GET() {
  ensureStripeInitialized()
  
  try {
    const config = getStripeConfig()
    
    // Only return public information - NEVER expose secret key
    return NextResponse.json({
      success: true,
      config: {
        publishableKey: config.publishableKey,
        environment: config.environment,
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'],
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Stripe not configured' },
      { status: 500 }
    )
  }
}

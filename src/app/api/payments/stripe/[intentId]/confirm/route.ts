import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  initializeStripe,
  confirmStripePayment,
  retrieveStripePaymentIntent,
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
      config.secretKey = 'sk_test_dummy_key_for_development'
    }
    initializeStripe(config)
  }
}

// POST /api/payments/stripe/[intentId]/confirm - Confirm payment intent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ intentId: string }> }
) {
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
    const { intentId } = await params

    if (!intentId) {
      return NextResponse.json(
        { success: false, error: 'Payment Intent ID is required' },
        { status: 400 }
      )
    }

    // Find payment in our database
    const payment = await db.payment.findFirst({
      where: {
        OR: [
          { transactionId: intentId },
          { metadata: { contains: intentId } },
        ],
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            buyerId: true,
          },
        },
      },
    })

    // Verify user owns this payment
    if (payment && payment.order.buyerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get optional payment method ID from request body
    let paymentMethodId: string | undefined
    try {
      const body = await request.json()
      paymentMethodId = body.paymentMethodId
    } catch {
      // No body or invalid JSON - that's okay, we'll just retrieve status
    }

    // Confirm/retrieve payment intent status
    const result = await confirmStripePayment(intentId, paymentMethodId)

    // Retrieve full payment intent for details
    const paymentIntent = await retrieveStripePaymentIntent(intentId)

    if (payment && paymentIntent) {
      // Map Stripe statuses to our internal statuses
      const statusMap: Record<string, string> = {
        succeeded: 'COMPLETED',
        processing: 'PROCESSING',
        requires_payment_method: 'FAILED',
        requires_confirmation: 'PENDING',
        requires_action: 'PROCESSING',
        canceled: 'CANCELLED',
      }

      const newStatus = statusMap[paymentIntent.status] || payment.status

      // Update payment record
      const updateData: Record<string, unknown> = {
        status: newStatus,
      }

      if (paymentIntent.status === 'succeeded') {
        updateData.paidAt = new Date()
        
        // Extract card details if available
        if (paymentIntent.charges?.data?.[0]?.payment_method_details?.card) {
          const card = paymentIntent.charges.data[0].payment_method_details.card as {
            last4?: string
            brand?: string
          }
          updateData.cardLast4 = card.last4
          updateData.cardType = card.brand?.toLowerCase()
        }
      }

      if (newStatus === 'FAILED') {
        updateData.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed'
      }

      await db.payment.update({
        where: { id: payment.id },
        data: updateData,
      })

      // Update order if payment completed
      if (newStatus === 'COMPLETED' && payment.status !== 'COMPLETED') {
        await db.order.update({
          where: { id: payment.orderId },
          data: { status: 'CONFIRMED' },
        })

        // Create notification for buyer
        await db.notification.create({
          data: {
            userId: payment.order.buyerId,
            type: 'PAYMENT_RECEIVED',
            category: 'ORDER',
            title: 'Paiement reçu',
            message: `Votre paiement de ${payment.amount} ${payment.currency} a été confirmé avec succès.`,
            data: JSON.stringify({
              orderId: payment.orderId,
              orderNumber: payment.order.orderNumber,
              stripePaymentIntentId: intentId,
            }),
            actionUrl: `/orders/${payment.orderId}`,
            actionText: 'Voir la commande',
          },
        })
      }

      // Log confirmation
      await db.transactionLog.create({
        data: {
          paymentId: payment.id,
          action: 'stripe_payment_confirmed',
          details: JSON.stringify({
            stripePaymentIntentId: intentId,
            stripeStatus: paymentIntent.status,
            internalStatus: newStatus,
            confirmedAt: new Date().toISOString(),
          }),
          userId: session.user.id,
        },
      })
    }

    return NextResponse.json({
      success: result.success,
      payment: {
        id: payment?.id,
        status: payment?.status,
        orderId: payment?.orderId,
        orderNumber: payment?.order?.orderNumber,
      },
      stripeStatus: paymentIntent?.status,
      clientSecret: result.clientSecret,
    })
  } catch (error) {
    console.error('[Stripe Confirm] Error:', error)
    
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type: string; message: string; code?: string }
      return NextResponse.json(
        { 
          success: false, 
          error: stripeError.message,
          errorCode: stripeError.code 
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

// GET /api/payments/stripe/[intentId]/status - Get payment intent status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ intentId: string }> }
) {
  ensureStripeInitialized()

  // Authentication required
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const { intentId } = await params

    if (!intentId) {
      return NextResponse.json(
        { success: false, error: 'Payment Intent ID is required' },
        { status: 400 }
      )
    }

    // Retrieve from Stripe
    const paymentIntent = await retrieveStripePaymentIntent(intentId)

    if (!paymentIntent) {
      return NextResponse.json(
        { success: false, error: 'Payment Intent not found' },
        { status: 404 }
      )
    }

    // Find our local payment record
    const payment = await db.payment.findFirst({
      where: {
        OR: [
          { transactionId: intentId },
          { metadata: { contains: intentId } },
        ],
      },
      select: {
        id: true,
        status: true,
        orderId: true,
        amount: true,
        currency: true,
        paidAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      stripe: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        created: paymentIntent.created,
        description: paymentIntent.description,
      },
      payment,
    })
  } catch (error) {
    console.error('[Stripe Status] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve payment status' },
      { status: 500 }
    )
  }
}

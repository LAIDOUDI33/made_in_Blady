import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  initializeSATIM,
  createSATIMPayment,
  handleSATIMWebhook,
  getSATIMConfig,
} from '@/lib/payments/satim'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Initialize SATIM on module load
function ensureSATIMInitialized() {
  try {
    getSATIMConfig()
  } catch {
    // Initialize with environment variables
    const config = {
      merchantId: process.env.SATIM_MERCHANT_ID || '',
      merchantKey: process.env.SATIM_MERCHANT_KEY || '',
      environment: (process.env.SATIM_ENVIRONMENT as 'test' | 'production') || 'test',
      endpoint: process.env.SATIM_ENDPOINT || 'https://test-payment.cib.dz',
    }
    
    if (!config.merchantId || !config.merchantKey) {
      console.warn('[SATIM] Missing configuration. Using test mode with mock responses.')
    }
    
    initializeSATIM(config)
  }
}

// POST /api/payments/satim/create - Create new SATIM payment
export async function POST(request: NextRequest) {
  // Ensure SATIM is initialized
  ensureSATIMInitialized()

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
    const { orderId, customerEmail, customerName, customerPhone } = body

    // Validate required fields
    if (!orderId || !customerEmail || !customerName) {
      return NextResponse.json(
        { success: false, error: 'orderId, customerEmail, and customerName are required' },
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

    // Build return/cancel/notification URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const returnUrl = `${baseUrl}/payment/satim/return?orderId=${orderId}`
    const cancelUrl = `${baseUrl}/payment/satim/cancel?orderId=${orderId}`
    const notificationUrl = `${baseUrl}/api/payments/satim/webhook`

    // Create SATIM payment
    const result = await createSATIMPayment({
      amount: order.totalAmount,
      currency: order.currency || 'DZD',
      orderId: order.orderNumber,
      customerEmail,
      customerName,
      customerPhone,
      returnUrl,
      cancelUrl,
      notificationUrl,
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to create SATIM payment',
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
          method: 'CIB', // CIB is handled via SATIM
          status: 'PROCESSING',
          transactionId: result.transactionId,
          metadata: JSON.stringify({
            satimTransactionId: result.transactionId,
            satimRedirectUrl: result.redirectUrl,
            createdAt: new Date().toISOString(),
          }),
        }
      })
    } else {
      payment = await db.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          currency: order.currency || 'DZD',
          method: 'CIB',
          status: 'PROCESSING',
          transactionId: result.transactionId,
          referenceNumber: `SATIM-${Date.now()}`,
          metadata: JSON.stringify({
            satimTransactionId: result.transactionId,
            satimRedirectUrl: result.redirectUrl,
            createdAt: new Date().toISOString(),
          }),
        }
      })
    }

    // Log transaction
    await db.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: 'satim_payment_created',
        details: JSON.stringify({
          satimTransactionId: result.transactionId,
          orderId: order.orderNumber,
          amount: order.totalAmount,
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
        transactionId: result.transactionId,
        redirectUrl: result.redirectUrl,
        status: payment.status,
      },
      message: 'Payment session created. Redirect to complete payment.',
    })
  } catch (error) {
    console.error('[SATIM API] Error creating payment:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle webhook notifications
export async function PUT(request: NextRequest) {
  ensureSATIMInitialized()

  try {
    const payload = await request.json()
    
    // Handle webhook
    const result = await handleSATIMWebhook(payload)

    if (!result.valid) {
      console.error('[SATIM Webhook] Invalid signature:', result.error)
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid signature' },
        { status: 401 }
      )
    }

    console.log('[SATIM Webhook] Processing event:', result.event)

    // Find payment by SATIM transaction ID
    if (result.data) {
      const payment = await db.payment.findFirst({
        where: {
          metadata: {
            contains: result.data.transactionId,
          }
        },
        include: { order: true }
      })

      if (payment) {
        // Update payment status based on webhook event
        const statusMap: Record<string, string> = {
          COMPLETED: 'COMPLETED',
          FAILED: 'FAILED',
          CANCELLED: 'CANCELLED',
          REFUNDED: 'REFUNDED',
        }

        const newStatus = statusMap[result.data.status] || payment.status

        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            paidAt: result.data.paidAt,
            ...(newStatus === 'COMPLETED' && {
              cardLast4: result.data.cardLast4,
              cardType: result.data.cardType,
            }),
          }
        })

        // Update order status if payment completed
        if (newStatus === 'COMPLETED') {
          await db.order.update({
            where: { id: payment.orderId },
            data: { status: 'CONFIRMED' }
          })
        }

        // Log webhook event
        await db.transactionLog.create({
          data: {
            paymentId: payment.id,
            action: `satim_webhook_${result.event}`,
            details: JSON.stringify(result.data),
          }
        })
      }
    }

    return NextResponse.json({ success: true, received: true })
  } catch (error) {
    console.error('[SATIM Webhook] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

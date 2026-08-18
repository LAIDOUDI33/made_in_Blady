import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  initializeSATIM,
  handleSATIMWebhook,
  getSATIMConfig,
} from '@/lib/payments/satim'

// Initialize SATIM on module load
function ensureSATIMInitialized() {
  try {
    getSATIMConfig()
  } catch {
    const config = {
      merchantId: process.env.SATIM_MERCHANT_ID || '',
      merchantKey: process.env.SATIM_MERCHANT_KEY || '',
      environment: (process.env.SATIM_ENVIRONMENT as 'test' | 'production') || 'test',
      endpoint: process.env.SATIM_ENDPOINT || 'https://test-payment.cib.dz',
    }
    initializeSATIM(config)
  }
}

// POST /api/payments/satim/webhook - SATIM webhook handler
// This endpoint receives async notifications from SATIM about payment status changes
export async function POST(request: NextRequest) {
  ensureSATIMInitialized()

  // Get raw body for signature verification (important for security)
  let rawBody = ''
  try {
    rawBody = await request.text()
  } catch {
    // If we can't get text, try JSON
  }

  try {
    let payload: unknown
    
    if (rawBody) {
      payload = JSON.parse(rawBody)
    } else {
      payload = await request.json()
    }

    console.log('[SATIM Webhook] Received payload:', JSON.stringify(payload).substring(0, 500))

    // Handle and verify webhook
    const result = await handleSATIMWebhook(payload, rawBody)

    if (!result.valid) {
      console.error('[SATIM Webhook] Verification failed:', result.error)
      
      // Return 401 for invalid signatures but don't throw (to prevent replay attacks)
      return new NextResponse(
        JSON.stringify({ error: result.error || 'Invalid signature' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('[SATIM Webhook] Valid signature. Event:', result.event)

    // Process the webhook event
    if (!result.data) {
      return NextResponse.json({ success: true, received: true })
    }

    const { transactionId, orderId, status, amount, currency, paidAt } = result.data

    // Find payment by SATIM transaction ID
    const payment = await db.payment.findFirst({
      where: {
        OR: [
          { transactionId: transactionId },
          { metadata: { contains: transactionId } },
        ],
      },
      include: {
        order: {
          include: {
            buyer: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        }
      }
    })

    if (!payment) {
      console.warn('[SATIM Webhook] Payment not found for transaction:', transactionId)
      
      // Still return success to prevent SATIM from retrying
      return NextResponse.json({ 
        success: true, 
        received: true,
        warning: 'Payment not found in database'
      })
    }

    // Status mapping
    const statusMap: Record<string, string> = {
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED',
      CANCELLED: 'CANCELLED',
      REFUNDED: 'REFUNDED',
      PENDING: 'PENDING_VERIFICATION',
    }

    const newStatus = statusMap[status] || payment.status
    const previousStatus = payment.status

    // Update payment record
    const updateData: Record<string, unknown> = {
      status: newStatus,
    }

    if (newStatus === 'COMPLETED') {
      updateData.paidAt = paidAt || new Date()
    }

    if (newStatus === 'FAILED') {
      updateData.failureReason = `SATIM notification: ${status}`
    }

    await db.payment.update({
      where: { id: payment.id },
      data: updateData,
    })

    // Update order status based on payment
    if (newStatus === 'COMPLETED' && previousStatus !== 'COMPLETED') {
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
          message: `Votre paiement de ${amount} ${currency} a été confirmé avec succès.`,
          data: JSON.stringify({
            orderId: payment.orderId,
            orderNumber: payment.order.orderNumber,
            transactionId,
            amount,
          }),
          actionUrl: `/orders/${payment.orderId}`,
          actionText: 'Voir la commande',
        },
      })
    }

    if (newStatus === 'FAILED' && previousStatus !== 'FAILED') {
      await db.order.update({
        where: { id: payment.orderId },
        data: { status: 'CANCELLED' },
      })

      // Create notification for buyer about failed payment
      await db.notification.create({
        data: {
          userId: payment.order.buyerId,
          type: 'ORDER_CANCELLED',
          category: 'ORDER',
          title: 'Paiement échoué',
          message: `Le paiement pour votre commande ${payment.order.orderNumber} a échoué. Veuillez réessayer.`,
          data: JSON.stringify({
            orderId: payment.orderId,
            orderNumber: payment.order.orderNumber,
            transactionId,
          }),
          actionUrl: `/checkout?orderId=${payment.orderId}`,
          actionText: 'Réessayer le paiement',
        },
      })
    }

    // Log this webhook event
    await db.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: `satim_webhook_${result.event}`,
        details: JSON.stringify({
          event: result.event,
          transactionId,
          orderId,
          status,
          amount,
          currency,
          timestamp: new Date().toISOString(),
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'satim-webhook',
        userAgent: 'SATIM-Webhook/1.0',
      },
    })

    console.log(`[SATIM Webhook] Payment ${payment.id} updated to status: ${newStatus}`)

    return NextResponse.json({ 
      success: true, 
      received: true,
      processed: true,
      paymentId: payment.id,
      newStatus,
    })
  } catch (error) {
    console.error('[SATIM Webhook] Processing error:', error)
    
    // Return 500 to trigger retry from SATIM
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// GET /api/payments/satim/webhook - Health check endpoint
export async function GET() {
  ensureSATIMInitialized()
  
  return NextResponse.json({
    status: 'ok',
    service: 'SATIM Webhook',
    timestamp: new Date().toISOString(),
    configured: !!(process.env.SATIM_MERCHANT_ID && process.env.SATIM_MERCHANT_KEY),
  })
}

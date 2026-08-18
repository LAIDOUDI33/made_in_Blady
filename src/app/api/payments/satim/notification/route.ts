/**
 * SATIM Notification Webhook Handler
 * POST /api/payments/satim/notification
 * 
 * Server-to-server webhook for async payment status notifications from SATIM
 * This is the primary method for receiving payment confirmations
 * @module api/payments/satim/notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateCallback, checkPaymentStatus } from '@/lib/payments/satim/client'
import type { SatimWebhookPayload } from '@/lib/payments/satim/types'

/**
 * POST handler - Receive notification webhook from SATIM
 */
export async function POST(request: NextRequest) {
  // Get raw body for signature verification (critical for security)
  let rawBody = ''
  try {
    rawBody = await request.text()
  } catch {
    // If we can't get text, continue with JSON parsing
  }

  try {
    // Parse payload
    let payload: SatimWebhookPayload
    
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody)
      } catch {
        return new NextResponse(
          JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else {
      payload = await request.json() as SatimWebhookPayload
    }

    console.log('[SATIM Webhook] Received notification:', {
      transactionId: payload.transactionId,
      orderId: payload.orderId,
      status: payload.status,
      amount: payload.amount,
    })

    // ========================================
    // SIGNATURE VERIFICATION (CRITICAL)
    // ========================================
    
    const apiSecret = process.env.SATIM_API_SECRET || ''
    
    if (!apiSecret) {
      console.warn('[SATIM Webhook] No API secret configured - skipping signature verification')
    } else if (payload.signature) {
      const isValid = validateCallback(payload, apiSecret)
      
      if (!isValid) {
        console.error('[SATIM Webhook] Invalid signature - rejecting webhook')
        
        return new NextResponse(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid signature',
            code: 'SIGNATURE_MISMATCH',
          }),
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      console.log('[SATIM Webhook] Signature verified successfully')
    }

    // ========================================
    // VALIDATE REQUIRED FIELDS
    // ========================================
    
    if (!payload.transactionId) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Missing transactionId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ========================================
    // FIND TRANSACTION IN DATABASE
    // ========================================
    
    const satimTransaction = await db.satimTransaction.findUnique({
      where: { transactionId: payload.transactionId },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, email: true, name: true } }
          }
        },
        user: { select: { id: true, email: true, name: true } },
      }
    })

    if (!satimTransaction) {
      console.warn('[SATIM Webhook] Transaction not found:', payload.transactionId)
      
      // Return success to prevent SATIM from retrying
      // But indicate transaction was not processed
      return NextResponse.json({
        success: true,
        received: true,
        processed: false,
        warning: 'Transaction not found in database',
      })
    }

    // ========================================
    // MAP WEBHOOK STATUS TO INTERNAL STATUS
    // ========================================
    
    const statusMap: Record<string, string> = {
      'APPROVED': 'COMPLETED',
      'AUTHORIZED': 'COMPLETED',
      'CAPTURED': 'COMPLETED',
      'DECLINED': 'FAILED',
      'FAILED': 'FAILED',
      'CANCELLED': 'CANCELLED',
      'ERROR': 'FAILED',
      'REFUNDED': 'REFUNDED',
      'PENDING': 'PROCESSING',
    }

    const newStatus = statusMap[payload.status] || satimTransaction.status
    const previousStatus = satimTransaction.status

    // ========================================
    // UPDATE SATIM TRANSACTION RECORD
    // ========================================
    
    const updateData: Record<string, unknown> = {
      status: newStatus,
      authCode: payload.authCode || satimTransaction.authCode,
      rrn: payload.rrn || satimTransaction.rrn,
      errorMessage: newStatus === 'FAILED' ? (payload as unknown as Record<string, string>)?.errorMessage : null,
      rawResponse: JSON.stringify({
        webhookType: 'notification',
        receivedAt: new Date().toISOString(),
        webhookPayload: payload,
        previousStatus,
        newStatus,
      }),
      updatedAt: new Date(),
    }

    await db.satimTransaction.update({
      where: { id: satimTransaction.id },
      data: updateData,
    })

    // ========================================
    // UPDATE MAIN PAYMENT RECORD
    // ========================================
    
    if (satimTransaction.orderId) {
      const payment = await db.payment.findFirst({
        where: {
          OR: [
            { transactionId: payload.transactionId },
            { metadata: { contains: payload.transactionId } },
          ],
        },
        include: { order: true }
      })

      if (payment) {
        const paymentUpdateData: Record<string, unknown> = {
          status: newStatus,
        }

        // Add completion-specific data
        if (newStatus === 'COMPLETED') {
          paymentUpdateData.paidAt = new Date()
          paymentUpdateData.cardLast4 = satimTransaction.cardLast4
          paymentUpdateData.cardType = satimTransaction.cardType
          paymentUpdateData.failureReason = null
        }

        // Add failure-specific data
        if (newStatus === 'FAILED') {
          paymentUpdateData.failureReason = `SATIM notification: ${payload.status}`
        }

        await db.payment.update({
          where: { id: payment.id },
          data: paymentUpdateData,
        })

        // ========================================
        // UPDATE ORDER STATUS BASED ON PAYMENT
        // ========================================
        
        if (newStatus === 'COMPLETED' && previousStatus !== 'COMPLETED') {
          // Mark order as confirmed
          await db.order.update({
            where: { id: payment.orderId! },
            data: { status: 'CONFIRMED' }
          })

          // Create notification for buyer
          try {
            await db.notification.create({
              data: {
                userId: satimTransaction.order?.buyerId || satimTransaction.userId,
                type: 'PAYMENT_RECEIVED',
                category: 'ORDER',
                title: 'Paiement reçu',
                message: `Votre paiement de ${payload.amount} ${payload.currency} a été confirmé avec succès.`,
                data: JSON.stringify({
                  orderId: satimTransaction.orderId,
                  orderNumber: satimTransaction.order?.orderNumber,
                  transactionId: payload.transactionId,
                  amount: payload.amount,
                  currency: payload.currency,
                }),
                actionUrl: `/orders/${satimTransaction.orderId}`,
                actionText: 'Voir la commande',
              }
            })
          } catch (notificationError) {
            console.error('[SATIM Webhook] Failed to create notification:', notificationError)
          }
        }

        if (newStatus === 'FAILED' && !['FAILED', 'CANCELLED'].includes(previousStatus)) {
          // Reset order to pending so user can retry
          await db.order.update({
            where: { id: payment.orderId! },
            data: { status: 'PENDING' }
          })

          // Create notification about failed payment
          try {
            await db.notification.create({
              data: {
                userId: satimTransaction.order?.buyerId || satimTransaction.userId,
                type: 'ORDER_CANCELLED',
                category: 'ORDER',
                title: 'Paiement échoué',
                message: `Le paiement pour votre commande a échoué. Veuillez réessayer.`,
                data: JSON.stringify({
                  orderId: satimTransaction.orderId,
                  orderNumber: satimTransaction.order?.orderNumber,
                  transactionId: payload.transactionId,
                }),
                actionUrl: `/checkout?orderId=${satimTransaction.orderId}`,
                actionText: 'Réessayer le paiement',
              }
            })
          } catch (notificationError) {
            console.error('[SATIM Webhook] Failed to create failure notification:', notificationError)
          }
        }
      }
    }

    // ========================================
    // LOG WEBHOOK EVENT
    // ========================================
    
    try {
      await db.transactionLog.create({
        data: {
          paymentId: undefined, // Will be linked by metadata search if needed
          action: `satim_webhook_${payload.status}`,
          details: JSON.stringify({
            event: payload.status,
            transactionId: payload.transactionId,
            orderId: payload.orderId || satimTransaction.orderId,
            amount: payload.amount,
            currency: payload.currency,
            authCode: payload.authCode,
            rrn: payload.rrn,
            timestamp: payload.timestamp,
            receivedAt: new Date().toISOString(),
            previousStatus,
            newStatus,
          }),
          ipAddress: request.headers.get('x-forwarded-for') || 'satim-webhook',
          userAgent: request.headers.get('user-agent') || 'SATIM-Webhook/1.0',
          userId: satimTransaction.userId,
        }
      })
    } catch (logError) {
      console.error('[SATIM Webhook] Failed to create log entry:', logError)
    }

    console.log(`[SATIM Webhook] Transaction ${payload.transactionId} updated: ${previousStatus} -> ${newStatus}`)

    // ========================================
    // RETURN SUCCESS RESPONSE
    // ========================================
    
    return NextResponse.json({
      success: true,
      received: true,
      processed: true,
      transactionId: payload.transactionId,
      previousStatus,
      newStatus,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[SATIM Webhook] Processing error:', error)
    
    // Return 500 to trigger retry from SATIM
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error processing webhook',
        code: 'INTERNAL_ERROR',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * GET handler - Health check endpoint for webhooks
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'SATIM Notification Webhook',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    configured: !!(
      process.env.SATIM_MERCHANT_ID && 
      process.env.SATIM_API_SECRET
    ),
    environment: process.env.NODE_ENV || 'development',
  })
}

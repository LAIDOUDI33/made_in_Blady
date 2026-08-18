/**
 * SATIM Error Callback Handler
 * GET /api/payments/satim/callback/error
 * 
 * Called when payment fails during 3D Secure flow
 * @module api/payments/satim/callback/error
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateCallback } from '@/lib/payments/satim/client'

/**
 * GET handler - Error callback from SATIM
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    const orderId = searchParams.get('orderId')
    const errorCode = searchParams.get('errorCode') || searchParams.get('code')
    const errorMessage = searchParams.get('errorMessage') || searchParams.get('message')
    const signature = searchParams.get('signature')
    
    console.log('[SATIM Callback] Error callback received:', { 
      transactionId, 
      orderId, 
      errorCode,
      errorMessage 
    })

    // Validate required parameters
    if (!transactionId) {
      return NextResponse.redirect(
        new URL(`/payments?status=error&message=Payment+error+occurred`, request.url)
      )
    }

    // Verify signature if present
    if (signature) {
      const payload = Object.fromEntries(searchParams.entries())
      const isValid = validateCallback(payload as Record<string, unknown>, process.env.SATIM_API_SECRET || '')
      
      if (!isValid) {
        console.error('[SATIM Callback] Invalid signature on error callback')
      }
    }

    // Find and update SATIM transaction
    const satimTransaction = await db.satimTransaction.findUnique({
      where: { transactionId },
    })

    if (satimTransaction) {
      // Update transaction status to FAILED
      await db.satimTransaction.update({
        where: { id: satimTransaction.id },
        data: {
          status: 'FAILED',
          errorMessage: errorMessage || `Payment failed with code: ${errorCode || 'UNKNOWN'}`,
          rawResponse: JSON.stringify({
            callbackType: 'error',
            receivedAt: new Date().toISOString(),
            errorCode,
            errorMessage,
            queryParams: Object.fromEntries(searchParams.entries()),
          }),
          updatedAt: new Date(),
        }
      })

      // Update main payment record if exists
      if (satimTransaction.orderId) {
        const payment = await db.payment.findFirst({
          where: {
            OR: [
              { transactionId: transactionId },
              { metadata: { contains: transactionId } },
            ],
          }
        })

        if (payment && ['PENDING', 'PROCESSING'].includes(payment.status)) {
          await db.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              failureReason: errorMessage || `Error: ${errorCode || 'Payment failed'}`,
            }
          })
        }

        // Update order status back to PENDING_PAYMENT or similar
        try {
          await db.order.update({
            where: { id: satimTransaction.orderId! },
            data: { status: 'PENDING' }
          })
        } catch (orderUpdateError) {
          console.error('[SATIM Error Callback] Failed to update order:', orderUpdateError)
        }
      }

      // Log error event
      try {
        await db.transactionLog.create({
          data: {
            action: 'satim_callback_error',
            details: JSON.stringify({
              transactionId,
              orderId: satimTransaction.orderId,
              errorCode,
              errorMessage,
              timestamp: new Date().toISOString(),
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'satim-callback',
            userAgent: 'SATIM-Callback/1.0',
            userId: satimTransaction.userId,
          }
        })
      } catch (logError) {
        console.error('[SATIM Error Callback] Failed to log:', logError)
      }
    }

    // Redirect to error page with details
    const redirectUrl = new URL('/payments', request.url)
    redirectUrl.searchParams.set('status', 'error')
    redirectUrl.searchParams.set('transactionId', transactionId)
    if (orderId) redirectUrl.searchParams.set('orderId', orderId)
    if (errorCode) redirectUrl.searchParams.set('code', errorCode)
    if (errorMessage) redirectUrl.searchParams.set('message', encodeURIComponent(errorMessage))

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('[SATIM Error Callback] Error:', error)
    
    return NextResponse.redirect(
      new URL('/payments?status=error&message=Internal+error+processing+callback', request.url)
    )
  }
}

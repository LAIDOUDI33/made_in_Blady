/**
 * SATIM Cancel Callback Handler
 * GET /api/payments/satim/callback/cancel
 * 
 * Called when user cancels payment during 3D Secure flow
 * @module api/payments/satim/callback/cancel
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateCallback } from '@/lib/payments/satim/client'

/**
 * GET handler - Cancel callback from SATIM
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    const orderId = searchParams.get('orderId')
    const signature = searchParams.get('signature')
    
    console.log('[SATIM Callback] Cancel callback received:', { transactionId, orderId })

    // Validate required parameters
    if (!transactionId) {
      return NextResponse.redirect(
        new URL(`/payments?status=cancelled&message=No+transaction`, request.url)
      )
    }

    // Verify signature if present
    if (signature) {
      const payload = Object.fromEntries(searchParams.entries())
      const isValid = validateCallback(payload as Record<string, unknown>, process.env.SATIM_API_SECRET || '')
      
      if (!isValid) {
        console.error('[SATIM Callback] Invalid signature on cancel callback')
      }
    }

    // Find and update SATIM transaction
    const satimTransaction = await db.satimTransaction.findUnique({
      where: { transactionId },
    })

    if (satimTransaction) {
      // Update transaction status to CANCELLED
      await db.satimTransaction.update({
        where: { id: satimTransaction.id },
        data: {
          status: 'CANCELLED',
          errorMessage: 'User cancelled payment during 3D Secure authentication',
          rawResponse: JSON.stringify({
            callbackType: 'cancel',
            receivedAt: new Date().toISOString(),
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
              status: 'CANCELLED',
              failureReason: 'User cancelled during 3D Secure',
            }
          })
        }
      }

      // Log cancellation event
      try {
        await db.transactionLog.create({
          data: {
            action: 'satim_callback_cancel',
            details: JSON.stringify({
              transactionId,
              orderId: satimTransaction.orderId,
              timestamp: new Date().toISOString(),
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'satim-callback',
            userAgent: 'SATIM-Callback/1.0',
            userId: satimTransaction.userId,
          }
        })
      } catch (logError) {
        console.error('[SATIM Cancel Callback] Failed to log:', logError)
      }
    }

    // Redirect to cancel page
    const redirectUrl = new URL('/payments', request.url)
    redirectUrl.searchParams.set('status', 'cancelled')
    redirectUrl.searchParams.set('transactionId', transactionId || '')
    if (orderId) redirectUrl.searchParams.set('orderId', orderId)

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('[SATIM Cancel Callback] Error:', error)
    
    return NextResponse.redirect(
      new URL('/payments?status=cancelled&message=Error+processing+cancellation', request.url)
    )
  }
}

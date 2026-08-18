/**
 * SATIM Success Callback Handler
 * GET /api/payments/satim/callback/success
 * 
 * Called when user successfully completes 3D Secure authentication
 * @module api/payments/satim/callback/success
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateCallback, checkPaymentStatus } from '@/lib/payments/satim/client'

/**
 * GET handler - Success callback from SATIM after 3D Secure
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    const orderId = searchParams.get('orderId')
    const signature = searchParams.get('signature')
    
    console.log('[SATIM Callback] Success callback received:', { transactionId, orderId })

    // Validate required parameters
    if (!transactionId) {
      return NextResponse.redirect(
        new URL(`/payments?status=error&message=Missing+transaction+ID`, request.url)
      )
    }

    // Verify signature if present
    if (signature) {
      const payload = Object.fromEntries(searchParams.entries())
      const isValid = validateCallback(payload as Record<string, unknown>, process.env.SATIM_API_SECRET || '')
      
      if (!isValid) {
        console.error('[SATIM Callback] Invalid signature on success callback')
        return NextResponse.redirect(
          new URL(`/payments?status=error&message=Invalid+signature`, request.url)
        )
      }
    }

    // Find SATIM transaction in database
    const satimTransaction = await db.satimTransaction.findUnique({
      where: { transactionId },
      include: {
        order: true,
        user: { select: { id: true, email: true, name: true } },
      }
    })

    if (!satimTransaction) {
      console.warn('[SATIM Callback] Transaction not found:', transactionId)
      return NextResponse.redirect(
        new URL(`/payments?status=error&message=Transaction+not+found`, request.url)
      )
    }

    // Check actual status with SATIM API
    let satimStatus
    try {
      satimStatus = await checkPaymentStatus(transactionId)
    } catch (error) {
      console.error('[SATIM Callback] Failed to check payment status:', error)
      // Continue with what we have - will verify via webhook later
    }

    // Determine final status
    const isCompleted = satimStatus?.status === 'COMPLETED' || 
                       searchParams.get('status') === 'APPROVED'

    // Update SATIM transaction record
    await db.satimTransaction.update({
      where: { id: satimTransaction.id },
      data: {
        status: isCompleted ? 'COMPLETED' : 'PROCESSING',
        authCode: satimStatus?.authCode,
        rrn: satimStatus?.rrn,
        rawResponse: JSON.stringify({
          callbackType: 'success',
          receivedAt: new Date().toISOString(),
          satimStatus,
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

      if (payment && isCompleted) {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
            cardLast4: satimStatus?.cardLast4 || satimTransaction.cardLast4,
            cardType: satimStatus?.cardType || satimTransaction.cardType,
          }
        })

        // Update order status to CONFIRMED
        await db.order.update({
          where: { id: payment.orderId },
          data: { status: 'CONFIRMED' }
        })
      }
    }

    // Log this callback event
    try {
      await db.transactionLog.create({
        data: {
          paymentId: satimTransaction.orderId ? undefined : undefined,
          action: 'satim_callback_success',
          details: JSON.stringify({
            transactionId,
            orderId: satimTransaction.orderId,
            status: isCompleted ? 'COMPLETED' : 'PROCESSING',
            timestamp: new Date().toISOString(),
          }),
          ipAddress: request.headers.get('x-forwarded-for') || 'satim-callback',
          userAgent: 'SATIM-Callback/1.0',
          userId: satimTransaction.userId,
        }
      })
    } catch (logError) {
      console.error('[SATIM Callback] Failed to log:', logError)
    }

    // Redirect to success page with details
    const redirectUrl = new URL('/payments', request.url)
    redirectUrl.searchParams.set('status', isCompleted ? 'success' : 'processing')
    redirectUrl.searchParams.set('transactionId', transactionId)
    if (orderId) redirectUrl.searchParams.set('orderId', orderId)

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('[SATIM Success Callback] Error:', error)
    
    // Redirect to error page
    return NextResponse.redirect(
      new URL('/payments?status=error&message=Callback+processing+failed', request.url)
    )
  }
}

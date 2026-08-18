/**
 * SATIM Transaction Status Check API Route
 * GET /api/payments/satim/status/[transactionId]
 * 
 * Check the current status of a SATIM payment transaction
 * @module api/payments/satim/status
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPaymentStatus, SatimError } from '@/lib/payments/satim/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Interface for route params (Next.js 15+ async params)
 */
interface RouteParams {
  params: Promise<{ transactionId: string }>
}

/**
 * GET handler - Check transaction status by ID
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    // ========================================
    // AUTHENTICATION
    // ========================================
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // Get transaction ID from params
    const { transactionId } = await context.params

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required', code: 'MISSING_TRANSACTION_ID' },
        { status: 400 }
      )
    }

    console.log('[SATIM Status] Checking status for:', transactionId)

    // ========================================
    // FIND TRANSACTION IN DATABASE
    // ========================================
    
    const satimTransaction = await db.satimTransaction.findUnique({
      where: { transactionId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            buyerId: true,
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    })

    if (!satimTransaction) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction not found',
          code: 'TRANSACTION_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Verify user owns this transaction (or is admin)
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    
    if (satimTransaction.userId !== session.user.id && !isAdmin && satimTransaction.order?.buyerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view this transaction', code: 'UNAUTHORIZED' },
        { status: 403 }
      )
    }

    // ========================================
    // CHECK STATUS WITH SATIM API
    // ========================================
    
    let satimStatus
    
    try {
      satimStatus = await checkPaymentStatus(transactionId)
    } catch (error) {
      console.error('[SATIM Status] Failed to check with SATIM API:', error)
      
      // If SATIM is unreachable, return cached status from database
      return NextResponse.json({
        success: true,
        source: 'cache',
        message: 'Using cached status - SATIM API unreachable',
        transaction: {
          id: satimTransaction.id,
          transactionId: satimTransaction.transactionId,
          orderId: satimTransaction.orderId,
          orderNumber: satimTransaction.order?.orderNumber,
          status: satimTransaction.status,
          amount: Number(satimTransaction.amount),
          currency: satimTransaction.currency,
          cardType: satimTransaction.cardType,
          cardLast4: satimTransaction.cardLast4,
          authCode: satimTransaction.authCode,
          rrn: satimTransaction.rrn,
          threeDSecure: satimTransaction.threeDSecure,
          errorMessage: satimTransaction.errorMessage,
          createdAt: satimTransaction.createdAt,
          updatedAt: satimTransaction.updatedAt,
        },
        warning: 'Could not reach SATIM server, showing cached status',
      })
    }

    // ========================================
    // UPDATE DATABASE IF STATUS CHANGED
    // ========================================
    
    const statusMap: Record<string, string> = {
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED',
      CANCELLED: 'CANCELLED',
      REFUNDED: 'REFUNDED',
      PENDING: 'PENDING',
      PROCESSING: 'PROCESSING',
    }

    const newDbStatus = statusMap[satimStatus.status] || satimTransaction.status

    // Only update if status changed
    if (newDbStatus !== satimTransaction.status) {
      console.log(`[SATIM Status] Status changed: ${satimTransaction.status} -> ${newDbStatus}`)
      
      await db.satimTransaction.update({
        where: { id: satimTransaction.id },
        data: {
          status: newDbStatus,
          authCode: satimStatus.authCode || satimTransaction.authCode,
          rrn: satimStatus.rrn || satimTransaction.rrn,
          cardLast4: satimStatus.cardLast4 || satimTransaction.cardLast4,
          cardType: satimStatus.cardType || satimTransaction.cardType,
          errorMessage: satimStatus.errorMessage,
          rawResponse: JSON.stringify({
            type: 'status_check',
            checkedAt: new Date().toISOString(),
            satimStatus,
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

        if (payment) {
          const paymentUpdateData: Record<string, unknown> = {
            status: newDbStatus,
          }

          if (newDbStatus === 'COMPLETED') {
            paymentUpdateData.paidAt = satimStatus.paidAt || new Date()
            paymentUpdateData.cardLast4 = satimStatus.cardLast4
            paymentUpdateData.cardType = satimStatus.cardType
            paymentUpdateData.failureReason = null
          }

          if (newDbStatus === 'FAILED') {
            paymentUpdateData.failureReason = `SATIM status check: ${satimStatus.status}`
          }

          await db.payment.update({
            where: { id: payment.id },
            data: paymentUpdateData,
          })

          // Update order if payment completed
          if (newDbStatus === 'COMPLETED' && satimTransaction.status !== 'COMPLETED') {
            await db.order.update({
              where: { id: payment.orderId! },
              data: { status: 'CONFIRMED' }
            })
          }
        }
      }

      // Log status change
      try {
        await db.transactionLog.create({
          data: {
            action: 'satim_status_updated',
            details: JSON.stringify({
              transactionId,
              previousStatus: satimTransaction.status,
              newStatus: newDbStatus,
              satimApiStatus: satimStatus.status,
              checkedAt: new Date().toISOString(),
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'status-check',
            userAgent: request.headers.get('user-agent') || 'API-Client',
            userId: session.user.id,
          }
        })
      } catch (logError) {
        console.error('[SATIM Status] Failed to log status change:', logError)
      }
    }

    // ========================================
    // RETURN SUCCESS RESPONSE
    // ========================================
    
    return NextResponse.json({
      success: true,
      source: 'live',
      message: 'Transaction status retrieved successfully',
      transaction: {
        id: satimTransaction.id,
        transactionId: satimStatus.transactionId,
        orderId: satimTransaction.orderId,
        orderNumber: satimTransaction.order?.orderNumber,
        status: satimStatus.status,
        amount: satimStatus.amount,
        currency: satimStatus.currency,
        cardType: satimStatus.cardType,
        cardLast4: satimStatus.cardLast4,
        authCode: satimStatus.authCode,
        rrn: satimStatus.rrn,
        paidAt: satimStatus.paidAt,
        errorMessage: satimStatus.errorMessage,
        createdAt: satimTransaction.createdAt,
        updatedAt: new Date(),
      },
      rawSatimResponse: process.env.NODE_ENV === 'development' ? satimStatus : undefined,
    })

  } catch (error) {
    console.error('[SATIM Status] Error:', error)

    // Handle known SATIM errors
    if (error instanceof SatimError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.httpStatus }
      )
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while checking transaction status',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

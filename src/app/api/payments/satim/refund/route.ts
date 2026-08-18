/**
 * SATIM Refund API Route
 * POST /api/payments/satim/refund
 * 
 * Process refunds for SATIM transactions (full or partial)
 * @module api/payments/satim/refund
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { refundPayment, checkPaymentStatus, SatimError } from '@/lib/payments/satim/client'
import type { SatimRefundResponse } from '@/lib/payments/satim/types'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * POST handler - Process a refund request
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================
    // AUTHENTICATION & AUTHORIZATION
    // ========================================
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // Check user role - only admins and sellers can process refunds
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can process refunds', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // ========================================
    // PARSE REQUEST BODY
    // ========================================
    
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body', code: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    const {
      transactionId,
      amount,
      reason,
      orderId,
    } = body as {
      transactionId?: string
      amount?: number
      reason?: string
      orderId?: string
    }

    // ========================================
    // VALIDATION
    // ========================================
    
    if (!transactionId && !orderId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID or Order ID is required', code: 'MISSING_IDENTIFIER' },
        { status: 400 }
      )
    }

    // If only orderId provided, find the transaction ID
    let resolvedTransactionId = transactionId
    
    if (!resolvedTransactionId && orderId) {
      const orderPayments = await db.payment.findMany({
        where: { orderId },
        include: { order: true }
      })

      const satimPayment = orderPayments.find(p => p.method === 'SATIM' && p.status === 'COMPLETED')
      
      if (!satimPayment) {
        return NextResponse.json(
          { success: false, error: 'No completed SATIM payment found for this order', code: 'NO_PAYMENT_FOUND' },
          { status: 404 }
        )
      }

      resolvedTransactionId = satimPayment.transactionId || undefined
      
      if (!resolvedTransactionId) {
        // Try to find in SatimTransaction table
        const satimTxn = await db.satimTransaction.findFirst({
          where: { orderId, status: 'COMPLETED' }
        })
        
        if (!satimTxn) {
          return NextResponse.json(
            { success: false, error: 'No SATIM transaction found for this order', code: 'NO_TRANSACTION_FOUND' },
            { status: 404 }
          )
        }
        
        resolvedTransactionId = satimTxn.transactionId
      }
    }

    // ========================================
    // FIND AND VALIDATE TRANSACTION
    // ========================================
    
    const satimTransaction = await db.satimTransaction.findUnique({
      where: { transactionId: resolvedTransactionId! },
      include: {
        order: true,
        user: { select: { id: true, email: true, name: true } },
      }
    })

    if (!satimTransaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Validate transaction is eligible for refund
    if (!['COMPLETED'].includes(satimTransaction.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot refund transaction with status: ${satimTransaction.status}`,
          code: 'INVALID_STATUS',
          currentStatus: satimTransaction.status,
        },
        { status: 400 }
      )
    }

    // Validate refund amount if specified
    if (amount !== undefined) {
      const transactionAmount = Number(satimTransaction.amount)
      
      if (amount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Refund amount must be greater than zero', code: 'INVALID_AMOUNT' },
          { status: 400 }
        )
      }

      if (amount > transactionAmount) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Refund amount (${amount}) exceeds transaction amount (${transactionAmount})`,
            code: 'AMOUNT_EXCEEDS_TRANSACTION',
            maxRefundable: transactionAmount,
          },
          { status: 400 }
        )
      }

      // Check for previous partial refunds
      const existingRefunds = await db.transactionLog.count({
        where: {
          action: { startsWith: 'satim_refund_' },
          details: { contains: resolvedTransactionId },
        }
      })
      
      // This is a simplified check - in production you'd track exact refunded amounts
    }

    // ========================================
    // PROCESS REFUND WITH SATIM
    // ========================================
    
    console.log('[SATIM Refund] Processing refund:', {
      transactionId: resolvedTransactionId,
      amount: amount || 'FULL',
      reason: reason || 'No reason provided',
      initiatedBy: session.user.id,
    })

    let refundResult: SatimRefundResponse

    try {
      refundResult = await refundPayment({
        transactionId: resolvedTransactionId!,
        amount,
        reason,
        initiatedBy: session.user.id,
      })
    } catch (error) {
      if (error instanceof SatimError) {
        throw error
      }
      throw new Error('Failed to process refund with SATIM')
    }

    if (!refundResult.success) {
      throw new SatimError(
        'REFUND_FAILED',
        refundResult.error || 'Refund processing failed',
        500
      )
    }

    // ========================================
    // UPDATE DATABASE RECORDS
    // ========================================
    
    // Determine new transaction status
    const isFullRefund = !amount || amount >= Number(satimTransaction.amount)
    const newStatus = isFullRefund ? 'REFUNDED' : satimTransaction.status

    // Update SATIM transaction record
    await db.satimTransaction.update({
      where: { id: satimTransaction.id },
      data: {
        status: newStatus,
        rawResponse: JSON.stringify({
          type: 'refund',
          processedAt: new Date().toISOString(),
          refundResult,
          refundAmount: refundResult.refundedAmount,
          remainingAmount: refundResult.remainingAmount,
          isFullRefund,
          reason,
          initiatedBy: session.user.id,
          initiatorName: session.user.name || session.user.email,
        }),
        updatedAt: new Date(),
      }
    })

    // Update main payment record if exists
    if (satimTransaction.orderId) {
      const payment = await db.payment.findFirst({
        where: {
          OR: [
            { transactionId: resolvedTransactionId },
            { metadata: { contains: resolvedTransactionId } },
          ],
        }
      })

      if (payment) {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: isFullRefund ? 'REFUNDED' : payment.status,
            ...(isFullRefund && { failureReason: `Refunded: ${reason || 'No reason'}` }),
          }
        })

        // Update order status if fully refunded
        if (isFullRefund) {
          await db.order.update({
            where: { id: payment.orderId! },
            data: { status: 'REFUNDED' }
          })
        }
      }
    }

    // Log refund event
    try {
      await db.transactionLog.create({
        data: {
          action: isFullRefund ? 'satim_refund_full' : 'satim_refund_partial',
          details: JSON.stringify({
            originalTransactionId: resolvedTransactionId,
            refundId: refundResult.refundId,
            refundAmount: refundResult.refundedAmount,
            originalAmount: satimTransaction.amount,
            remainingAmount: refundResult.remainingAmount,
            isFullRefund,
            reason,
            initiatedBy: session.user.id,
            initiatorName: session.user.name || session.user.email,
            timestamp: new Date().toISOString(),
          }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'admin-panel',
          userAgent: request.headers.get('user-agent') || 'Admin-Panel/1.0',
          userId: session.user.id,
        }
      })
    } catch (logError) {
      console.error('[SATIM Refund] Failed to log refund:', logError)
    }

    // Create notification about refund
    try {
      await db.notification.create({
        data: {
          userId: satimTransaction.userId,
          type: isFullRefund ? 'ORDER_REFUNDED' : 'ORDER_PARTIALLY_REFUNDED',
          category: 'ORDER',
          title: isFullRefund ? 'Remboursement effectué' : 'Remboursement partiel',
          message: isFullRefund
            ? `Votre paiement de ${satimTransaction.amount} DZD a été remboursé intégralement.`
            : `Un remboursement partiel de ${refundResult.refundedAmount} DZD a été effectué.`,
          data: JSON.stringify({
            transactionId: resolvedTransactionId,
            orderId: satimTransaction.orderId,
            refundAmount: refundResult.refundedAmount,
            reason,
          }),
          actionUrl: `/orders/${satimTransaction.orderId}`,
          actionText: 'Voir la commande',
        }
      })
    } catch (notificationError) {
      console.error('[SATIM Refund] Failed to create notification:', notificationError)
    }

    // ========================================
    // RETURN SUCCESS RESPONSE
    // ========================================
    
    return NextResponse.json({
      success: true,
      message: isFullRefund ? 'Full refund processed successfully' : 'Partial refund processed successfully',
      refund: {
        id: refundResult.refundId,
        originalTransactionId: resolvedTransactionId,
        refundedAmount: refundResult.refundedAmount,
        originalAmount: Number(satimTransaction.amount),
        remainingAmount: refundResult.remainingAmount,
        isFullRefund,
        status: newStatus,
        processedAt: new Date().toISOString(),
        processedBy: {
          id: session.user.id,
          name: session.user.name || session.user.email,
        },
      },
    })

  } catch (error) {
    console.error('[SATIM Refund] Error:', error)

    // Handle known SATIM errors
    if (error instanceof SatimError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.httpStatus }
      )
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during refund processing',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler - Get refund eligibility info for a transaction
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    const orderId = searchParams.get('orderId')

    if (!transactionId && !orderId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID or Order ID is required' },
        { status: 400 }
      )
    }

    // Find transaction
    let satimTransaction
    
    if (transactionId) {
      satimTransaction = await db.satimTransaction.findUnique({
        where: { transactionId },
      })
    } else if (orderId) {
      satimTransaction = await db.satimTransaction.findFirst({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (!satimTransaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const amount = Number(satimTransaction.amount)

    return NextResponse.json({
      success: true,
      eligibility: {
        transactionId: satimTransaction.transactionId,
        orderId: satimTransaction.orderId,
        status: satimTransaction.status,
        canRefund: satimTransaction.status === 'COMPLETED',
        originalAmount: amount,
        currency: satimTransaction.currency,
        refundableAmount: satimTransaction.status === 'COMPLETED' ? amount : 0,
        alreadyRefunded: ['REFUNDED', 'PARTIALLY_REFUNDED'].includes(satimTransaction.status),
        paidAt: satimTransaction.rawResponse 
          ? JSON.parse(satimTransaction.rawResponse as string)?.paidAt 
          : null,
        createdAt: satimTransaction.createdAt,
      }
    })

  } catch (error) {
    console.error('[SATIM Refund GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  initializeSATIM,
  verifySATIMTransaction,
  getSATIMConfig,
} from '@/lib/payments/satim'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

// GET /api/payments/satim/[transactionId]/status - Check transaction status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
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
    const { transactionId } = await params

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Find payment in our database first
    const payment = await db.payment.findFirst({
      where: {
        OR: [
          { transactionId: transactionId },
          { metadata: { contains: transactionId } },
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

    // Verify with SATIM API
    let satimStatus
    try {
      satimStatus = await verifySATIMTransaction(transactionId)
    } catch (error) {
      console.error('[SATIM Status] Verification error:', error)
      
      // If SATIM is unreachable, return cached status
      if (payment) {
        return NextResponse.json({
          success: true,
          source: 'cache',
          payment: {
            id: payment.id,
            orderId: payment.orderId,
            orderNumber: payment.order.orderNumber,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            paidAt: payment.paidAt,
            cardLast4: payment.cardLast4,
            cardType: payment.cardType,
          },
          warning: 'Could not reach SATIM server, showing cached status',
        })
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Unable to verify transaction status',
          code: 'VERIFICATION_ERROR',
        },
        { status: 503 }
      )
    }

    // Update our database with latest status from SATIM
    if (payment) {
      const statusMap: Record<string, string> = {
        COMPLETED: 'COMPLETED',
        FAILED: 'FAILED',
        CANCELLED: 'CANCELLED',
        REFUNDED: 'REFUNDED',
        PENDING: 'PROCESSING',
      }

      const newStatus = statusMap[satimStatus.status] || payment.status

      // Only update if status changed
      if (newStatus !== payment.status) {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            paidAt: satimStatus.paidAt || payment.paidAt,
            cardLast4: satimStatus.cardLast4 || payment.cardLast4,
            cardType: satimStatus.cardType || payment.cardType,
          },
        })

        // Update order if payment completed
        if (newStatus === 'COMPLETED' && payment.status !== 'COMPLETED') {
          await db.order.update({
            where: { id: payment.orderId },
            data: { status: 'CONFIRMED' },
          })
        }

        // Log status change
        await db.transactionLog.create({
          data: {
            paymentId: payment.id,
            action: 'satim_status_updated',
            details: JSON.stringify({
              previousStatus: payment.status,
              newStatus,
              satimStatus: satimStatus.status,
              verifiedAt: new Date().toISOString(),
            }),
            userId: session.user.id,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      source: 'live',
      transaction: satimStatus,
      payment: payment ? {
        id: payment.id,
        orderId: payment.orderId,
        orderNumber: payment.order.orderNumber,
        status: payment.status,
      } : null,
    })
  } catch (error) {
    console.error('[SATIM Status] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

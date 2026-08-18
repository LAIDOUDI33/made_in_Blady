// GET /api/payments/crypto/history
// Get user's crypto payment history

import { NextRequest, NextResponse } from 'next/server'
import { getUserCryptoPaymentHistory } from '@/lib/payments/crypto/client'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') || undefined
    const cryptocurrency = searchParams.get('crypto') || undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate userId (required)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    // Validate limit and offset
    if (limit > 100 || limit < 1) {
      return NextResponse.json(
        { success: false, error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (offset < 0) {
      return NextResponse.json(
        { success: false, error: 'Offset must be non-negative' },
        { status: 400 }
      )
    }

    // Parse dates if provided
    let startDateObj: Date | undefined
    let endDateObj: Date | undefined
    
    if (startDate) {
      startDateObj = new Date(startDate)
      if (isNaN(startDateObj.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid startDate format' },
          { status: 400 }
        )
      }
    }
    
    if (endDate) {
      endDateObj = new Date(endDate)
      if (isNaN(endDateObj.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid endDate format' },
          { status: 400 }
        )
      }
    }

    // Fetch payment history
    const result = await getUserCryptoPaymentHistory(userId, {
      limit,
      offset,
      status,
      cryptocurrency,
      startDate: startDateObj,
      endDate: endDateObj,
    })

    // Calculate summary statistics
    const summary = await calculateUserSummary(userId)

    return NextResponse.json({
      success: true,
      data: {
        payments: result.payments.map(payment => ({
          paymentId: payment.paymentId,
          orderId: payment.orderId,
          cryptocurrency: payment.cryptocurrency,
          network: payment.network,
          amount: payment.amount,
          amountInDZD: payment.amountInDZD,
          exchangeRate: payment.exchangeRate,
          status: payment.status,
          confirmations: payment.confirmations,
          requiredConfirmations: payment.requiredConfirmations,
          txHash: payment.txHash,
          receivingAddress: payment.receivingAddress ? 
            `${payment.receivingAddress.substring(0, 8)}...${payment.receivingAddress.slice(-6)}` : null,
          createdAt: payment.createdAt,
          confirmedAt: payment.confirmedAt,
          expiresAt: payment.expiresAt,
        })),
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total,
        },
        summary,
      },
    })
  } catch (error) {
    console.error('Error fetching crypto payment history:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch payment history' 
      },
      { status: 500 }
    )
  }
}

// Calculate user's crypto payment summary statistics
async function calculateUserSummary(userId: string): Promise<{
  totalPayments: number
  completedPayments: number
  pendingPayments: number
  expiredPayments: number
  failedPayments: number
  totalVolumeDZD: number
  successRate: number
}> {
  try {
    const [total, completed, pending, expired, failed] = await Promise.all([
      db.cryptoPayment.count({ where: { userId } }),
      db.cryptoPayment.count({ where: { userId, status: 'COMPLETED' } }),
      db.cryptoPayment.count({ where: { userId, status: { in: ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMING'] } } }),
      db.cryptoPayment.count({ where: { userId, status: 'EXPIRED' } }),
      db.cryptoPayment.count({ where: { userId, status: 'FAILED' } }),
    ])

    // Calculate total volume from completed payments
    const volumeResult = await db.cryptoPayment.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { amountInDZD: true },
    })

    const totalVolumeDZD = parseFloat(volumeResult._sum.amountInDZD || '0')
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      totalPayments: total,
      completedPayments: completed,
      pendingPayments: pending,
      expiredPayments: expired,
      failedPayments: failed,
      totalVolumeDZD,
      successRate,
    }
  } catch (error) {
    console.error('Error calculating user summary:', error)
    return {
      totalPayments: 0,
      completedPayments: 0,
      pendingPayments: 0,
      expiredPayments: 0,
      failedPayments: 0,
      totalVolumeDZD: 0,
      successRate: 0,
    }
  }
}

// GET /api/payments/crypto/[paymentId]/status - Check payment status
// POST /api/payments/crypto/[paymentId]/confirm - Manual confirm (admin)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  monitorCryptoTransaction,
  confirmCryptoPayment,
  checkCryptoPaymentExpiry,
  processCryptoRefund,
} from '@/lib/payments/crypto'
import { stopMonitoring } from '@/lib/payments/blockchain-monitor'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get transaction details
    const transaction = await monitorCryptoTransaction(paymentId)

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check expiry
    const expiryInfo = await checkCryptoPaymentExpiry(paymentId)

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        expiryInfo,
      },
    })
  } catch (error) {
    console.error('Error checking crypto payment status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check payment status' 
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params
    const body = await request.json()
    const { action, txHash, actualAmount, refundAddress, refundAmount } = body

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'confirm':
        // Manual confirmation (admin only)
        if (!txHash) {
          return NextResponse.json(
            { success: false, error: 'Transaction hash is required for confirmation' },
            { status: 400 }
          )
        }

        const confirmed = await confirmCryptoPayment(txHash, paymentId, actualAmount)
        
        if (confirmed) {
          stopMonitoring(paymentId)
          return NextResponse.json({
            success: true,
            message: 'Payment confirmed successfully',
          })
        }
        
        return NextResponse.json(
          { success: false, error: 'Failed to confirm payment' },
          { status: 400 }
        )

      case 'refund':
        // Process refund
        if (!refundAddress || !refundAmount) {
          return NextResponse.json(
            { success: false, error: 'Refund address and amount are required' },
            { status: 400 }
          )
        }

        const refundResult = await processCryptoRefund(paymentId, refundAmount, refundAddress)
        
        if (refundResult.success) {
          return NextResponse.json({
            success: true,
            data: { txHash: refundResult.txHash },
            message: 'Refund processed successfully',
          })
        }
        
        return NextResponse.json(
          { success: false, error: refundResult.error },
          { status: 400 }
        )

      case 'expire':
        // Manually expire a payment (admin)
        await db.cryptoPayment.update({
          where: { id: paymentId },
          data: { status: 'EXPIRED' },
        })
        stopMonitoring(paymentId)
        
        return NextResponse.json({
          success: true,
          message: 'Payment expired successfully',
        })

      case 'cancel':
        // Cancel a pending payment
        const payment = await db.cryptoPayment.findUnique({
          where: { id: paymentId },
        })

        if (!payment) {
          return NextResponse.json(
            { success: false, error: 'Payment not found' },
            { status: 404 }
          )
        }

        if (payment.status !== 'PENDING') {
          return NextResponse.json(
            { success: false, error: `Cannot cancel payment with status: ${payment.status}` },
            { status: 400 }
          )
        }

        await db.cryptoPayment.update({
          where: { id: paymentId },
          data: { status: 'EXPIRED' }, // Use EXPIRED as cancelled state
        })
        stopMonitoring(paymentId)
        
        return NextResponse.json({
          success: true,
          message: 'Payment cancelled successfully',
        })

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}. Supported: confirm, refund, expire, cancel` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing crypto payment action:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process action' 
      },
      { status: 500 }
    )
  }
}

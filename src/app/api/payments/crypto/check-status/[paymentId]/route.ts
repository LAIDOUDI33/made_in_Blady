// GET /api/payments/crypto/check-status/[paymentId]
// Check status of a crypto payment

import { NextRequest, NextResponse } from 'next/server'
import { checkTransactionStatus } from '@/lib/payments/crypto/client'

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

    // Sanitize paymentId to prevent injection
    const sanitizedPaymentId = paymentId.replace(/[^a-zA-Z0-9-]/g, '')
    
    if (sanitizedPaymentId !== paymentId) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment ID format' },
        { status: 400 }
      )
    }

    const status = await checkTransactionStatus(sanitizedPaymentId)

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Calculate human-readable remaining time
    const remainingMinutes = Math.floor(status.remainingTimeMs / 60000)
    const remainingSeconds = Math.floor((status.remainingTimeMs % 60000) / 1000)

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        remainingTimeFormatted: status.remainingTimeMs > 0
          ? `${remainingMinutes}m ${remainingSeconds}s remaining`
          : 'Expired',
        isExpired: status.remainingTimeMs === 0 && status.status === 'EXPIRED',
        isCompleted: status.status === 'COMPLETED',
        confirmationProgress: status.requiredConfirmations > 0
          ? Math.min(100, Math.round((status.confirmations / status.requiredConfirmations) * 100))
          : 0,
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

import { NextRequest, NextResponse } from 'next/server'
import {
  processInstallmentPayment,
  getInstallmentPlanById,
} from '@/lib/payments/installments'

// POST /api/installments/[planId]/pay - Pay an installment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const body = await request.json()
    const {
      installmentNumber,
      paymentMethod,
      transactionId,
    } = body

    // Validate required fields
    if (!installmentNumber || !paymentMethod) {
      return NextResponse.json(
        { error: 'installmentNumber and paymentMethod are required' },
        { status: 400 }
      )
    }

    // Validate installment number is positive
    if (installmentNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid installment number' },
        { status: 400 }
      )
    }

    // Get plan to verify it exists and check status
    const plan = await getInstallmentPlanById(planId)
    
    // Check if plan can accept payments
    if (plan.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot pay on a cancelled plan' },
        { status: 400 }
      )
    }

    if (plan.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'All installments have already been paid' },
        { status: 400 }
      )
    }

    if (plan.status === 'DEFAULTED') {
      return NextResponse.json(
        { error: 'Plan has been defaulted. Contact support.' },
        { status: 400 }
      )
    }

    // Check if this specific installment exists and is payable
    const targetInstallment = plan.installments.find(
      (i) => i.installmentNumber === installmentNumber
    )

    if (!targetInstallment) {
      return NextResponse.json(
        { error: `Installment #${installmentNumber} not found` },
        { status: 404 }
      )
    }

    if (targetInstallment.status === 'PAID') {
      return NextResponse.json(
        { error: `Installment #${installmentNumber} has already been paid` },
        { status: 400 }
      )
    }

    // Process the payment
    const result = await processInstallmentPayment(
      planId,
      installmentNumber,
      paymentMethod,
      transactionId
    )

    return NextResponse.json({
      success: true,
      data: result,
      message: `Installment #${installmentNumber} paid successfully`,
    })
  } catch (error) {
    console.error('Error processing installment payment:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Plan not found') {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      }
      if (error.message === 'Installment not found') {
        return NextResponse.json({ error: 'Installment not found' }, { status: 404 })
      }
      if (error.message === 'Installment already paid') {
        return NextResponse.json({ error: 'Installment already paid' }, { status: 400 })
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

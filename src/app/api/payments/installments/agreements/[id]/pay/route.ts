import { NextRequest, NextResponse } from 'next/server'
import { processInstallmentPayment } from '@/lib/payments/installments/manager'

// POST /api/payments/installments/agreements/[id]/pay
// Process an installment payment for a DPA agreement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { 
      installmentNumber, 
      amount, 
      paymentMethod, 
      paymentReference, 
      notes 
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Agreement ID is required' },
        { status: 400 }
      )
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'amount is required and must be a positive number' },
        { status: 400 }
      )
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'paymentMethod is required (e.g., SATIM, BANK_TRANSFER, etc.)' },
        { status: 400 }
      )
    }

    // Valid payment methods
    const validMethods = [
      'SATIM',
      'BARIDIMOB',
      'BANK_TRANSFER',
      'CHECK',
      'CASH',
      'CCP',
      'CIB'
    ]

    if (!validMethods.includes(paymentMethod.toUpperCase())) {
      return NextResponse.json(
        { 
          error: `Invalid payment method. Must be one of: ${validMethods.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Process the payment
    const result = await processInstallmentPayment({
      agreementId: id,
      installmentNumber,
      amount,
      paymentMethod: paymentMethod.toUpperCase(),
      paymentReference,
      notes,
    })

    return NextResponse.json({
      success: true,
      data: {
        payment: result.payment,
        installment: result.installment,
        agreement: result.agreement,
        message: 'Payment processed successfully'
      }
    })
  } catch (error) {
    console.error('Error processing DPA payment:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    
    // Handle specific errors
    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Agreement or installment not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (message.includes('Cannot process') || message.includes('status')) {
      return NextResponse.json(
        { error: message, code: 'INVALID_STATUS' },
        { status: 400 }
      )
    }

    if (message.includes('already paid')) {
      return NextResponse.json(
        { error: message, code: 'ALREADY_PAID' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

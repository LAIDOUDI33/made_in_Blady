import { NextRequest, NextResponse } from 'next/server'
import { getInvoiceById, recordInvoicePayment } from '@/lib/invoices'

// POST /api/invoices/[invoiceId]/pay - Record a payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const body = await request.json()
    const {
      amount,
      paymentMethod,
      transactionId,
      referenceNumber,
      notes,
    } = body

    // Validate required fields
    if (!amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'amount and paymentMethod are required' },
        { status: 400 }
      )
    }

    if (Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate payment method
    const validMethods = ['CIB', 'CCP', 'BARIDIMOB', 'BANK_TRANSFER', 'CASH', 'CHECK', 'OTHER']
    if (!validMethods.includes(paymentMethod.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid payment method. Valid methods: ${validMethods.join(', ')}` },
        { status: 400 }
      )
    }

    // Get invoice to verify it exists and can accept payments
    const invoice = await getInvoiceById(invoiceId)

    // Check invoice status
    if (invoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot pay on a cancelled invoice' },
        { status: 400 }
      )
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice is already fully paid' },
        { status: 400 }
      )
    }

    if (invoice.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'Cannot pay on a refunded invoice' },
        { status: 400 }
      )
    }

    // Check payment amount doesn't exceed balance due
    if (Number(amount) > Number(invoice.balanceDue)) {
      return NextResponse.json(
        { 
          error: `Payment amount (${Number(amount).toLocaleString('fr-DZ')} DZD) exceeds balance due (${Number(invoice.balanceDue).toLocaleString('fr-DZ')} DZD)` 
        },
        { status: 400 }
      )
    }

    // Record the payment
    const updatedInvoice = await recordInvoicePayment(invoiceId, Number(amount), paymentMethod.toUpperCase(), {
      transactionId,
      referenceNumber,
      notes,
    })

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: `Payment of ${Number(amount).toLocaleString('fr-DZ')} DZD recorded successfully`,
      paymentDetails: {
        amount: Number(amount),
        method: paymentMethod.toUpperCase(),
        previousBalance: Number(invoice.balanceDue),
        newBalance: Number(updatedInvoice.balanceDue),
        newStatus: updatedInvoice.status,
      },
    })
  } catch (error) {
    console.error('Error recording payment:', error)
    
    if (error instanceof Error && error.message === 'Invoice not found') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}

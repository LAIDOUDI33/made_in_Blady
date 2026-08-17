import { NextRequest, NextResponse } from 'next/server'
import {
  getInvoiceById,
  issueInvoice,
  recordInvoicePayment,
  issueCreditNote,
} from '@/lib/invoices'

// GET /api/invoices/[invoiceId] - Get invoice details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    
    const invoice = await getInvoiceById(invoiceId)
    
    return NextResponse.json({
      success: true,
      data: invoice,
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    if (error instanceof Error && error.message === 'Invoice not found') {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PATCH /api/invoices/[invoiceId] - Update invoice (e.g., issue it)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'issue':
        // Change status to ISSUED
        const issuedInvoice = await issueInvoice(invoiceId)
        return NextResponse.json({
          success: true,
          data: issuedInvoice,
          message: 'Invoice issued successfully',
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// POST /api/invoices/[invoiceId]/credit-note - Issue credit note
export async function POST(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const { invoiceId } = await params
    const body = await request.json()
    const { reason, itemsToCredit } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required for credit note' },
        { status: 400 }
      )
    }

    const creditNote = await issueCreditNote(invoiceId, reason, itemsToCredit)

    return NextResponse.json({
      success: true,
      data: creditNote,
      message: `Credit note ${creditNote.invoiceNumber} created`,
    })
  } catch (error) {
    console.error('Error issuing credit note:', error)
    if (error instanceof Error && error.message === 'Original invoice not found') {
      return NextResponse.json({ error: 'Original invoice not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to create credit note' },
      { status: 500 }
    )
  }
}

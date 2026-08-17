import { NextRequest, NextResponse } from 'next/server'
import { getInvoiceById, issueCreditNote } from '@/lib/invoices'

// POST /api/invoices/[invoiceId]/credit-note - Issue a credit note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const body = await request.json()
    const {
      reason,
      itemsToCredit,
    } = body

    // Validate required fields
    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required for issuing a credit note' },
        { status: 400 }
      )
    }

    // Get original invoice to verify it exists and can have credit notes
    const originalInvoice = await getInvoiceById(invoiceId)

    // Check if original invoice can have credit notes issued
    if (originalInvoice.status === 'DRAFT') {
      return NextResponse.json(
        { error: 'Cannot issue credit note for a draft invoice' },
        { status: 400 }
      )
    }

    if (originalInvoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot issue credit note for a cancelled invoice' },
        { status: 400 }
      )
    }

    // If specific items are provided, validate them
    if (itemsToCredit && Array.isArray(itemsToCredit)) {
      for (const itemCredit of itemsToCredit) {
        if (!itemCredit.itemId) {
          return NextResponse.json(
            { error: 'Each item in itemsToCredit must have an itemId' },
            { status: 400 }
          )
        }

        // Check that item exists on the original invoice
        const itemExists = originalInvoice.lineItems.some(item => item.id === itemCredit.itemId)
        if (!itemExists) {
          return NextResponse.json(
            { error: `Item ${itemCredit.itemId} not found on this invoice` },
            { status: 404 }
          )
        }
      }
    }

    // Issue the credit note
    const creditNote = await issueCreditNote(invoiceId, reason, itemsToCredit)

    return NextResponse.json({
      success: true,
      data: creditNote,
      message: `Credit note ${creditNote.invoiceNumber} created successfully`,
      details: {
        originalInvoiceNumber: originalInvoice.invoiceNumber,
        creditNoteNumber: creditNote.invoiceNumber,
        creditAmount: Math.abs(creditNote.totalAmount),
        reason,
      },
    })
  } catch (error) {
    console.error('Error issuing credit note:', error)
    
    if (error instanceof Error && error.message === 'Original invoice not found') {
      return NextResponse.json({ error: 'Original invoice not found' }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Failed to issue credit note' },
      { status: 500 }
    )
  }
}

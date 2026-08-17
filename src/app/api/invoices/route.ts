import { NextRequest, NextResponse } from 'next/server'
import {
  createInvoice,
  listInvoices,
  getInvoiceByNumber,
} from '@/lib/invoices'

// POST /api/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      orderId,
      sellerId,
      buyerId,
      invoiceType,
      items,
      issueDate,
      paymentTerms,
      notes,
      termsConditions,
      quotationId,
      relatedInvoiceId,
      currency,
    } = body

    // Validate required fields
    if (!orderId || !sellerId || !buyerId || !invoiceType || !items) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, sellerId, buyerId, invoiceType, items' },
        { status: 400 }
      )
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.description || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { error: `Item ${i + 1} is missing required fields (description, quantity, unitPrice)` },
          { status: 400 }
        )
      }
    }

    // Create the invoice
    const invoice = await createInvoice({
      orderId,
      sellerId,
      buyerId,
      invoiceType,
      items: items.map((item: any) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount ?? 0),
        taxRate: item.taxRate ?? 19,
        sortOrder: item.sortOrder,
      })),
      issueDate: issueDate ? new Date(issueDate) : undefined,
      paymentTerms,
      notes,
      termsConditions,
      quotationId,
      relatedInvoiceId,
      currency,
    })

    return NextResponse.json({
      success: true,
      data: invoice,
      message: `Invoice ${invoice.invoiceNumber} created successfully`,
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

// GET /api/invoices - List invoices with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      sellerId: searchParams.get('sellerId') ?? undefined,
      buyerId: searchParams.get('buyerId') ?? undefined,
      status: searchParams.get('status') as any,
      type: searchParams.get('type') as any,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateDate')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      limit: parseInt(searchParams.get('limit') ?? '20'),
      offset: parseInt(searchParams.get('offset') ?? '0'),
    }

    // Support lookup by invoice number
    const invoiceNumber = searchParams.get('invoiceNumber')
    if (invoiceNumber) {
      const invoice = await getInvoiceByNumber(invoiceNumber)
      return NextResponse.json({
        success: true,
        data: [invoice],
        count: 1,
      })
    }

    const result = await listInvoices(filters)

    return NextResponse.json({
      success: true,
      data: result.invoices,
      total: result.total,
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getInvoiceById } from '@/lib/invoices'
import { generateInvoicePDF, getInvoicePDFFilename } from '@/lib/pdf-generator'

// GET /api/invoices/[invoiceId]/pdf - Generate and download PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const searchParams = request.nextUrl.searchParams
    
    // Get options from query params
    const isDuplicate = searchParams.get('duplicate') === 'true'
    const includeStamp = searchParams.get('stamp') !== 'false'
    
    // Fetch invoice data
    const invoice = await getInvoiceById(invoiceId)
    
    // Generate HTML (in production, this would be converted to PDF)
    const html = generateInvoicePDF(invoice, undefined, undefined, {
      isDuplicate,
      includeStamp,
      language: 'both',
    })
    
    // For now, return HTML that can be printed/saved as PDF
    // In production, you would use a library like puppeteer or @react-pdf/renderer
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${getInvoicePDFFilename(invoice)}"`,
        'X-Invoice-Number': invoice.invoiceNumber,
        'X-Invoice-Status': invoice.status,
      },
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    if (error instanceof Error && error.message === 'Invoice not found') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

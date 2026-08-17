import { NextRequest, NextResponse } from 'next/server'
import { getInvoiceById } from '@/lib/invoices'
import { generateInvoicePDF } from '@/lib/pdf-generator'

// POST /api/invoices/[invoiceId]/email - Send invoice via email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const body = await request.json()
    const {
      recipientEmail,
      recipientName,
      message,
      ccEmails,
      includePDF = true,
    } = body

    // Validate required fields
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'recipientEmail is required' },
        { status: 400 }
      )
    }

    // Fetch invoice data
    const invoice = await getInvoiceById(invoiceId)

    // Generate PDF content (HTML for now)
    let pdfBase64: string | undefined
    if (includePDF) {
      const html = generateInvoicePDF(invoice)
      // In production, convert HTML to PDF buffer and encode as base64
      pdfBase64 = Buffer.from(html).toString('base64')
    }

    // Prepare email content
    const subject = `Facture ${invoice.invoiceNumber} - ${invoice.totalAmount.toLocaleString('fr-DZ')} DZD`
    
    const emailBody = `
Bonjour ${recipientName ?? 'client'},

Veuillez trouver ci-joint la facture ${invoice.invoiceNumber} d'un montant de 
${invoice.totalAmount.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}.

Détails de la facture:
- Numéro: ${invoice.invoiceNumber}
- Type: ${getInvoiceTypeLabel(invoice.invoiceType)}
- Date d'émission: ${new Date(invoice.issueDate).toLocaleDateString('fr-DZ')}
- Date d'échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-DZ')}
- Montant total: ${invoice.totalAmount.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}
- Solde dû: ${Number(invoice.balanceDue).toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}

${message ? `\nMessage additionnel:\n${message}` : ''}

Cordialement,
L'équipe AlgeriaTrade.dz

---
Ce message a été envoyé automatiquement depuis AlgeriaTrade.dz
    `.trim()

    // In production, this would actually send the email using your email service
    // For now, we return success with the email details
    
    console.log('=== EMAIL WOULD BE SENT ===')
    console.log('To:', recipientEmail)
    console.log('CC:', ccEmails)
    console.log('Subject:', subject)
    console.log('Body length:', emailBody.length)
    console.log('PDF attached:', includePDF ? 'Yes' : 'No')
    console.log('==========================')

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
      data: {
        to: recipientEmail,
        cc: ccEmails,
        subject,
        pdfIncluded: includePDF,
        sentAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error sending invoice email:', error)
    if (error instanceof Error && error.message === 'Invoice not found') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

function getInvoiceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    COMMERCIAL: 'Facture Commerciale',
    PROFORMA: 'Facture Proforma',
    CREDIT_NOTE: "Note de Crédit (Avoir)",
    DEBIT_NOTE: 'Note de Débit',
    DOWN_PAYMENT: "Facture d'Acompte",
    INSTALLMENT: "Facture d'Échéance",
  }
  return labels[type] || type
}

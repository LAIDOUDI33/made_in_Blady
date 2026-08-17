// PDF Generation Service for Invoices
// Supports Arabic/French bilingual content with RTL support
// Professional Algerian invoice layout

import { Invoice, CompanyInfo } from './invoices'
import { formatDZD } from './payments/utils'

// ============================================
// Types
// ============================================

export interface PDFGenerationOptions {
  isDuplicate?: boolean
  watermark?: string
  includeStamp?: boolean
  language?: 'fr' | 'ar' | 'both'
}

export interface PDFResult {
  buffer: Buffer
  filename: string
  mimeType: string
}

// ============================================
// Color Scheme (AlgeriaTrade branding)
// ============================================

const COLORS = {
  primary: '#006233',      // Algeria green
  secondary: '#D52B1E',    // Algeria red
  text: '#1a1a1a',
  lightGray: '#f5f5f5',
  mediumGray: '#666666',
  border: '#dddddd',
  white: '#ffffff',
  success: '#28a745',
  warning: '#ffc107',
}

// ============================================
// Main PDF Generation Function
// ============================================

/**
 * Generate PDF for an invoice
 * Returns HTML string that can be converted to PDF
 */
export function generateInvoicePDF(
  invoice: Invoice,
  sellerInfo?: CompanyInfo,
  buyerInfo?: CompanyInfo,
  options?: PDFGenerationOptions
): string {
  const opts = {
    isDuplicate: false,
    watermark: undefined,
    includeStamp: true,
    language: 'both' as const,
    ...options,
  }

  return buildInvoiceHTML(invoice, sellerInfo, buyerInfo, opts)
}

/**
 * Build complete invoice HTML
 */
function buildInvoiceHTML(
  invoice: Invoice,
  sellerInfo?: CompanyInfo,
  buyerInfo?: CompanyInfo,
  options?: PDFGenerationOptions
): string {
  const statusBadge = getStatusBadgeHTML(invoice.status)
  const itemsTable = buildItemsTableHTML(invoice)
  const totalsSection = buildTotalsSectionHTML(invoice)
  const tvaBreakdown = buildTVABreakdownHTML(invoice)
  
  return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${invoice.invoiceNumber}</title>
  <style>
    ${getInvoiceStyles()}
  </style>
</head>
<body>
  ${options?.isDuplicate ? '<div class="watermark">DUPLICATA</div>' : ''}
  ${options?.watermark ? `<div class="watermark">${options.watermark}</div>` : ''}
  
  <div class="invoice-container">
    <!-- Header -->
    <header class="invoice-header">
      <div class="header-left">
        <div class="company-logo">
          ${sellerInfo?.logoUrl 
            ? `<img src="${sellerInfo.logoUrl}" alt="${sellerInfo.companyName}" />` 
            : `<div class="logo-placeholder">${(sellerInfo?.companyName ?? 'ALGERIATRADE').charAt(0)}</div>`
          }
        </div>
        <div class="company-info">
          <h1 class="company-name">${sellerInfo?.companyName ?? 'AlgeriaTrade.dz'}</h1>
          ${sellerInfo?.address ? `<p class="company-address">${sellerInfo.address}</p>` : ''}
          ${sellerInfo?.city ? `<p>${sellerInfo.city}, Algérie</p>` : ''}
          <p>Tél: ${sellerInfo?.phone ?? '+213 XX XXX XXXX'}</p>
          <p>Email: ${sellerInfo?.email ?? 'contact@algeriatrade.dz'}</p>
        </div>
      </div>
      <div class="header-right">
        <h2 class="document-title">${getDocumentTitle(invoice.invoiceType)}</h2>
        <div class="invoice-number-box">
          <span class="label">N° Facture</span>
          <span class="value">${invoice.invoiceNumber}</span>
        </div>
        ${statusBadge}
      </div>
    </header>

    <!-- Bilingual Title -->
    <div class="bilingual-title">
      <span class="fr">FACTURE</span>
      <span class="separator">|</span>
      <span class="ar" dir="rtl">فاتورة</span>
    </div>

    <!-- Parties Section -->
    <section class="parties-section">
      <div class="party seller">
        <h3>Émetteur / البائع</h3>
        <div class="party-details">
          <p><strong>${sellerInfo?.companyName ?? 'AlgeriaTrade.dz SARL'}</strong></p>
          ${sellerInfo?.commercialRegister ? `<p>NRC: ${sellerInfo.commercialRegister}</p>` : ''}
          ${sellerInfo?.taxIdentifier ? `<p>NIF: ${sellerInfo.taxIdentifier}</p>` : ''}
          ${sellerInfo?.articleOfAssociation ? `<p>AI: ${sellerInfo.articleOfAssociation}</p>` : ''}
        </div>
      </div>
      <div class="party buyer">
        <h3>Client / المشتري</h3>
        <div class="party-details">
          <p><strong>${buyerInfo?.companyName ?? 'Client'}</strong></p>
          ${buyerInfo?.address ? `<p>${buyerInfo.address}</p>` : ''}
          ${buyerInfo?.city ? `<p>${buyerInfo.city}</p>` : ''}
          ${buyerInfo?.taxIdentifier ? `<p>NIF: ${buyerInfo.taxIdentifier}</p>` : ''}
        </div>
      </div>
    </section>

    <!-- Invoice Details -->
    <section class="invoice-details">
      <div class="detail-row">
        <div class="detail-item">
          <span class="label">Date d'émission</span>
          <span class="value">${formatDate(invoice.issueDate)}</span>
        </div>
        <div class="detail-item">
          <span class="label">Date d'échéance</span>
          <span class="value">${formatDate(invoice.dueDate)}</span>
        </div>
        <div class="detail-item">
          <span class="label">Conditions de paiement</span>
          <span class="value">${invoice.paymentTerms}</span>
        </div>
        ${invoice.paidDate ? `
        <div class="detail-item">
          <span class="label">Date de paiement</span>
          <span class="value">${formatDate(invoice.paidDate)}</span>
        </div>
        ` : ''}
      </div>
    </section>

    <!-- Items Table -->
    <section class="items-section">
      ${itemsTable}
    </section>

    <!-- TVA Breakdown -->
    ${tvaBreakdown}

    <!-- Totals -->
    <section class="totals-section">
      ${totalsSection}
    </section>

    <!-- Notes & Terms -->
    ${(invoice.notes || invoice.termsConditions) ? `
    <section class="notes-section">
      ${invoice.notes ? `
      <div class="notes">
        <h4>Notes</h4>
        <p>${invoice.notes}</p>
      </div>
      ` : ''}
      ${invoice.termsConditions ? `
      <div class="terms">
        <h4>Conditions générales</h4>
        <p>${invoice.termsConditions}</p>
      </div>
      ` : ''}
    </section>
    ` : ''}

    <!-- Legal Footer -->
    <footer class="invoice-footer">
      <div class="legal-text">
        <p>Document généré électroniquement par AlgeriaTrade.dz - Valeur juridique conformément à la réglementation algérienne</p>
        <p dir="rtl">تم إنشاء هذا المستند إلكترونيا بواسطة AlgeriaTrade.dz</p>
      </div>
      <div class="footer-info">
        <p>Page 1/1 | ${new Date().toLocaleDateString('fr-DZ')}</p>
      </div>
    </footer>

    ${options?.includeStamp !== false ? `
    <div class="stamp-area">
      <div class="stamp">
        <div class="stamp-circle">
          <span class="stamp-text">ALGERIATRADE.DZ</span>
          <span class="stamp-date">${new Date().toLocaleDateString('fr-DZ')}</span>
        </div>
      </div>
    </div>
    ` : ''}
  </div>
</body>
</html>`
}

// ============================================
// HTML Building Helpers
// ============================================

function getDocumentTitle(type: string): string {
  switch (type) {
    case 'PROFORMA': return 'Facture Proforma'
    case 'CREDIT_NOTE': return "Note de Crédit (Avoir)"
    case 'DEBIT_NOTE': return 'Note de Débit'
    case 'DOWN_PAYMENT': return "Facture d'Acompte"
    case 'INSTALLMENT': return 'Facture d\'Échéance'
    default: return 'Facture'
  }
}

function getStatusBadgeHTML(status: string): string {
  const config: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Brouillon', color: '#6c757d' },
    ISSUED: { label: 'Émise', color: '#007bff' },
    PAID: { label: 'Payée', color: '#28a745' },
    PARTIAL: { label: 'Partielle', color: '#ffc107' },
    OVERDUE: { label: 'En retard', color: '#dc3545' },
    CANCELLED: { label: 'Annulée', color: '#6c757d' },
    REFUNDED: { label: 'Remboursée', color: '#17a2b8' },
  }
  
  const { label, color } = config[status] || { label: status, color: '#6c757d' }
  
  return `<span class="status-badge" style="background-color: ${color}">${label}</span>`
}

function buildItemsTableHTML(invoice: Invoice): string {
  const headerRow = `
    <tr>
      <th class="col-desc">Description</th>
      <th class="col-qty">Qté</th>
      <th class="col-price">Prix unitaire</th>
      <th class="col-discount">Remise</th>
      <th class="col-tax">TVA</th>
      <th class="col-total">Total</th>
    </tr>
  `
  
  const itemRows = invoice.lineItems.map(item => `
    <tr>
      <td class="col-desc">${item.description}</td>
      <td class="col-qty">${item.quantity.toLocaleString('fr-DZ')}</td>
      <td class="col-price">${formatDZD(item.unitPrice)}</td>
      <td class="col-discount">${item.discount > 0 ? `-${item.discount}%` : '-'}</td>
      <td class="col-tax">${item.taxRate > 0 ? `${item.taxRate}%` : 'Exon.'}</td>
      <td class="col-total">${formatDZD(item.lineTotal)}</td>
    </tr>
  `).join('')
  
  return `
    <table class="items-table">
      <thead>${headerRow}</thead>
      <tbody>${itemRows}</tbody>
    </table>
  `
}

function buildTVABreakdownHTML(invoice: Invoice): string {
  // Calculate TVA by rate
  const breakdown: Record<number, { base: number; amount: number }> = {}
  
  for (const item of invoice.lineItems) {
    if (!breakdown[item.taxRate]) {
      breakdown[item.taxRate] = { base: 0, amount: 0 }
    }
    const taxableAmount = item.lineTotal / (1 + item.taxRate / 100) * (item.taxRate / 100)
    breakdown[item.taxRate].base += item.lineTotal - taxableAmount
    breakdown[item.taxRate].amount += taxableAmount
  }
  
  const hasMultipleRates = Object.keys(breakdown).length > 1
  
  if (!hasMultipleRates && Object.keys(breakdown)[0] === '0') {
    return '' // No TVA to show
  }
  
  const rows = Object.entries(breakdown)
    .filter(([rate]) => rate !== '0')
    .map(([rate, data]) => `
      <tr>
        <td>TVA ${rate}%</td>
        <td class="amount">${formatDZD(data.base)}</td>
        <td class="amount">${formatDZD(data.amount)}</td>
      </tr>
    `).join('')
  
  if (!rows) return ''
  
  return `
    <section class="tva-breakdown">
      <h4>Détail TVA</h4>
      <table class="tva-table">
        <thead>
          <tr>
            <th>Taux</th>
            <th>Base imposable</th>
            <th>Montant TVA</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `
}

function buildTotalsSectionHTML(invoice: Invoice): string {
  return `
    <div class="totals-container">
      <table class="totals-table">
        <tbody>
          <tr>
            <td>Sous-total HT</td>
            <td class="amount">${formatDZD(invoice.subtotal)}</td>
          </tr>
          ${invoice.discountTotal > 0 ? `
          <tr class="discount-row">
            <td>Remise totale</td>
            <td class="amount discount">-${formatDZD(invoice.discountTotal)}</td>
          </tr>
          ` : ''}
          <tr>
            <td>Total TVA</td>
            <td class="amount">${formatDZD(invoice.tvaAmount)}</td>
          </tr>
          ${Number(invoice.tssAmount) > 0 ? `
          <tr>
            <td>TSS</td>
            <td class="amount">${formatDZD(Number(invoice.tssAmount))}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td><strong>Total TTC (${invoice.currency})</strong></td>
            <td class="amount total"><strong>${formatDZD(invoice.totalAmount)}</strong></td>
          </tr>
          ${Number(invoice.amountPaid) > 0 ? `
          <tr>
            <td>Montant payé</td>
            <td class="amount paid">${formatDZD(Number(invoice.amountPaid))}</td>
          </tr>
          <tr class="balance-row">
            <td>Solde dû</td>
            <td class="amount balance"><strong>${formatDZD(Number(invoice.balanceDue))}</strong></td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    </div>
  `
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ============================================
// CSS Styles
// ============================================

function getInvoiceStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: ${COLORS.text};
      background: #fff;
      padding: 20px;
    }

    .invoice-container {
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 30px;
      background: white;
      position: relative;
    }

    /* Watermark for duplicates */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      font-weight: bold;
      color: rgba(220, 53, 69, 0.15);
      text-transform: uppercase;
      letter-spacing: 10px;
      z-index: 1;
      pointer-events: none;
    }

    /* Header */
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 3px solid ${COLORS.primary};
      margin-bottom: 15px;
    }

    .header-left {
      display: flex;
      gap: 20px;
    }

    .company-logo img {
      width: 80px;
      height: 80px;
      object-fit: contain;
      border-radius: 8px;
    }

    .logo-placeholder {
      width: 80px;
      height: 80px;
      background: ${COLORS.primary};
      color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: bold;
    }

    .company-info h1 {
      font-size: 22px;
      color: ${COLORS.primary};
      margin-bottom: 5px;
    }

    .company-info p {
      color: ${COLORS.mediumGray};
      font-size: 11px;
      margin: 2px 0;
    }

    .header-right {
      text-align: right;
    }

    .document-title {
      font-size: 24px;
      color: ${COLORS.primary};
      margin-bottom: 10px;
    }

    .invoice-number-box {
      background: ${COLORS.primary};
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      display: inline-block;
    }

    .invoice-number-box .label {
      display: block;
      font-size: 10px;
      opacity: 0.9;
    }

    .invoice-number-box .value {
      display: block;
      font-size: 18px;
      font-weight: bold;
    }

    .status-badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 20px;
      color: white;
      font-size: 11px;
      font-weight: 600;
      margin-top: 10px;
    }

    /* Bilingual title */
    .bilingual-title {
      text-align: center;
      font-size: 28px;
      font-weight: bold;
      color: ${COLORS.primary};
      margin: 25px 0;
      letter-spacing: 3px;
    }

    .bilingual-title .separator {
      margin: 0 15px;
      color: ${COLORS.secondary};
    }

    .bilingual-title .ar {
      font-family: 'Traditional Arabic', 'Arial', sans-serif;
    }

    /* Parties section */
    .parties-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 25px;
    }

    .party h3 {
      font-size: 13px;
      color: ${COLORS.primary};
      border-bottom: 2px solid ${COLORS.primary};
      padding-bottom: 5px;
      margin-bottom: 10px;
    }

    .party-details p {
      font-size: 11px;
      margin: 4px 0;
    }

    /* Invoice details */
    .invoice-details {
      background: ${COLORS.lightGray};
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 25px;
    }

    .detail-row {
      display: flex;
      flex-wrap: wrap;
      gap: 30px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-item .label {
      font-size: 10px;
      color: ${COLORS.mediumGray};
      text-transform: uppercase;
    }

    .detail-item .value {
      font-weight: 600;
      font-size: 13px;
    }

    /* Items table */
    .items-section {
      margin-bottom: 25px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
    }

    .items-table th {
      background: ${COLORS.primary};
      color: white;
      padding: 12px 10px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
    }

    .items-table td {
      padding: 12px 10px;
      border-bottom: 1px solid ${COLORS.border};
      font-size: 11px;
    }

    .items-table tbody tr:hover {
      background: ${COLORS.lightGray};
    }

    .col-desc { width: 40%; }
    .col-qty { width: 10%; text-align: center; }
    .col-price { width: 15%; text-align: right; }
    .col-discount { width: 10%; text-align: center; }
    .col-tax { width: 10%; text-align: center; }
    .col-total { width: 15%; text-align: right; font-weight: 600; }

    /* TVA Breakdown */
    .tva-breakdown {
      margin-bottom: 20px;
    }

    .tva-breakdown h4 {
      font-size: 13px;
      color: ${COLORS.primary};
      margin-bottom: 10px;
    }

    .tva-table {
      width: 50%;
      border-collapse: collapse;
      float: right;
    }

    .tva-table th,
    .tva-table td {
      padding: 8px 12px;
      border: 1px solid ${COLORS.border};
      font-size: 11px;
    }

    .tva-table th {
      background: ${COLORS.lightGray};
    }

    .tva-table .amount {
      text-align: right;
    }

    /* Totals section */
    .totals-section {
      clear: both;
      margin-top: 20px;
    }

    .totals-container {
      width: 50%;
      margin-left: auto;
    }

    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }

    .totals-table td {
      padding: 8px 15px;
      font-size: 13px;
    }

    .totals-table .amount {
      text-align: right;
      font-family: 'Consolas', monospace;
    }

    .totals-table .discount-row .amount {
      color: ${COLORS.success};
    }

    .total-row {
      border-top: 2px solid ${COLORS.primary};
      border-bottom: 2px solid ${COLORS.primary};
      font-size: 16px !important;
    }

    .total-row .total {
      color: ${COLORS.primary};
      font-size: 18px !important;
    }

    .paid .amount {
      color: ${COLORS.success};
    }

    .balance-row td {
      padding-top: 10px;
    }

    .balance {
      color: Number(invoice.balanceDue) > 0 ? ${COLORS.secondary} : ${COLORS.success};
    }

    /* Notes section */
    .notes-section {
      margin-top: 25px;
      padding-top: 20px;
      border-top: 1px dashed ${COLORS.border};
    }

    .notes h4,
    .terms h4 {
      font-size: 12px;
      color: ${COLORS.primary};
      margin-bottom: 8px;
    }

    .notes p,
    .terms p {
      font-size: 11px;
      color: ${COLORS.mediumGray};
      line-height: 1.6;
    }

    /* Footer */
    .invoice-footer {
      position: absolute;
      bottom: 30px;
      left: 30px;
      right: 30px;
      padding-top: 20px;
      border-top: 1px solid ${COLORS.border};
      display: flex;
      justify-content: space-between;
    }

    .legal-text p {
      font-size: 9px;
      color: ${COLORS.mediumGray};
      margin: 2px 0;
    }

    .footer-info p {
      font-size: 9px;
      color: ${COLORS.mediumGray};
    }

    /* Stamp area */
    .stamp-area {
      position: absolute;
      bottom: 80px;
      right: 40px;
    }

    .stamp-circle {
      width: 120px;
      height: 120px;
      border: 3px solid ${COLORS.primary};
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transform: rotate(-15deg);
      opacity: 0.7;
    }

    .stamp-text {
      font-size: 10px;
      font-weight: bold;
      color: ${COLORS.primary};
      text-align: center;
    }

    .stamp-date {
      font-size: 9px;
      color: ${COLORS.primary};
      margin-top: 5px;
    }

    @media print {
      body { padding: 0; }
      .invoice-container { box-shadow: none; }
    }
  `
}

// ============================================
// Export Utilities
// ============================================

/**
 * Get filename for invoice PDF download
 */
export function getInvoicePDFFilename(invoice: Invoice): string {
  return `${invoice.invoiceNumber.replace('/', '-')}.pdf`
}

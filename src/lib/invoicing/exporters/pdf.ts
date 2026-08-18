// PDF Export for Invoices
// Generates professional PDF invoices compliant with Algerian regulations

import { type InvoiceData, type TVARate, formatCurrency } from '../config';
import { roundTVA } from '../calculator';

// PDF generation options
export interface PDFExportOptions {
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  includeQRCode?: boolean;
  includeWatermark?: boolean;
  language?: 'fr' | 'ar' | 'en';
  colorScheme?: 'standard' | 'professional' | 'minimal';
}

// PDF colors (AlgeriaTrade branding)
const colors = {
  primary: '#006233', // Algerian green
  secondary: '#D52B1E', // Red accent
  text: '#1a1a1a',
  textLight: '#666666',
  border: '#e0e0e0',
  background: '#f8f9fa',
  white: '#ffffff',
  headerBg: '#006233',
  headerText: '#ffffff',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
};

/**
 * Generate HTML content for invoice PDF
 */
export function generateInvoicePDFContent(
  invoice: InvoiceData,
  options: PDFExportOptions = {}
): string {
  const {
    includeQRCode = true,
    language = 'fr',
    colorScheme = 'standard',
  } = options;

  // Get localized labels
  const labels = getLabels(language);

  return `
<!DOCTYPE html>
<html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${labels.invoice} - ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: ${colors.text};
      background: ${colors.white};
    }
    
    .page {
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${colors.primary};
    }
    
    .company-logo {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .logo-placeholder {
      width: 60px;
      height: 60px;
      background: ${colors.primary};
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 18px;
    }
    
    .company-info h1 {
      font-size: 22px;
      color: ${colors.primary};
      margin-bottom: 3px;
    }
    
    .company-info p {
      font-size: 11px;
      color: ${colors.textLight};
    }
    
    .invoice-title-box {
      text-align: right;
      background: ${colors.primary};
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
    }
    
    .invoice-title-box h2 {
      font-size: 24px;
      margin-bottom: 3px;
    }
    
    .invoice-number {
      font-size: 14px;
      opacity: 0.9;
    }
    
    /* Parties Section */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 25px;
    }
    
    .party-card {
      padding: 15px;
      border: 1px solid ${colors.border};
      border-radius: 6px;
      background: ${colors.background};
    }
    
    .party-label {
      font-weight: bold;
      color: ${colors.primary};
      margin-bottom: 10px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .party-name {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .party-details p {
      font-size: 11px;
      color: ${colors.textLight};
      margin-bottom: 3px;
    }
    
    .tax-ids {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed ${colors.border};
    }
    
    .tax-id-item {
      display: inline-block;
      background: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      margin-right: 8px;
      margin-top: 4px;
      border: 1px solid ${colors.border};
    }
    
    /* Invoice Details */
    .invoice-details {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 25px;
      padding: 15px;
      background: ${colors.background};
      border-radius: 6px;
    }
    
    .detail-item label {
      display: block;
      font-size: 10px;
      color: ${colors.textLight};
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    
    .detail-item value {
      font-weight: 600;
      font-size: 13px;
    }
    
    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .items-table th {
      background: ${colors.primary};
      color: white;
      padding: 12px 10px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .items-table th:last-child,
    .items-table td:last-child {
      text-align: right;
    }
    
    .items-table td {
      padding: 12px 10px;
      border-bottom: 1px solid ${colors.border};
      font-size: 11px;
    }
    
    .items-table tbody tr:hover {
      background: ${colors.background};
    }
    
    .items-table .description {
      font-weight: 500;
    }
    
    .items-table .amount {
      font-family: 'Consolas', monospace;
      text-align: right;
    }
    
    /* Totals Section */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 25px;
    }
    
    .totals-box {
      width: 280px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 15px;
      border-bottom: 1px solid ${colors.border};
    }
    
    .total-row.grand-total {
      background: ${colors.primary};
      color: white;
      font-weight: bold;
      font-size: 16px;
      border: none;
      border-radius: 0 6px 6px 0;
    }
    
    .total-row.discount {
      color: ${colors.success};
    }
    
    .total-row.tax {
      color: #0066cc;
    }
    
    /* TVA Breakdown */
    .tva-breakdown {
      margin-bottom: 25px;
      padding: 15px;
      background: #f0f7ff;
      border: 1px solid #cce5ff;
      border-radius: 6px;
    }
    
    .tva-breakdown h4 {
      color: #0066cc;
      margin-bottom: 10px;
      font-size: 13px;
    }
    
    .tva-items {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    
    .tva-item {
      background: white;
      padding: 12px;
      border-radius: 4px;
      text-align: center;
    }
    
    .tva-rate {
      font-size: 18px;
      font-weight: bold;
      color: #0066cc;
    }
    
    .tva-base, .tva-amount {
      font-size: 11px;
      color: ${colors.textLight};
    }
    
    /* Notes Section */
    .notes-section {
      margin-bottom: 25px;
      padding: 15px;
      background: ${colors.background};
      border-left: 4px solid ${colors.primary};
      border-radius: 0 6px 6px 0;
    }
    
    .notes-section h4 {
      font-size: 12px;
      color: ${colors.textLight};
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    
    .notes-section p {
      font-size: 11px;
    }
    
    /* Payment Terms */
    .payment-terms {
      margin-bottom: 25px;
      padding: 15px;
      background: #fff8e1;
      border: 1px solid #ffe082;
      border-radius: 6px;
    }
    
    .payment-terms h4 {
      color: #f57c00;
      margin-bottom: 8px;
      font-size: 13px;
    }
    
    /* QR Code Section */
    .qr-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid ${colors.border};
    }
    
    .qr-code {
      text-align: center;
    }
    
    .qr-code img {
      width: 80px;
      height: 80px;
      border: 1px solid ${colors.border};
      border-radius: 4px;
    }
    
    .qr-code p {
      font-size: 9px;
      color: ${colors.textLight};
      margin-top: 5px;
    }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 2px solid ${colors.primary};
      text-align: center;
      font-size: 10px;
      color: ${colors.textLight};
    }
    
    .footer-legal {
      margin-top: 10px;
      font-size: 9px;
    }
    
    /* Status Badge */
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-draft { background: #e0e0e0; color: #666; }
    .status-issued { background: #cce5ff; color: #0066cc; }
    .status-paid { background: #d4edda; color: #155724; }
    .status-partial { background: #fff3cd; color: #856404; }
    .status-overdue { background: #f8d7da; color: #721c24; }
    .status-cancelled { background: #e0e0e0; color: #999; }
    
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { padding: 15mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="company-logo">
        <div class="logo-placeholder">AT</div>
        <div class="company-info">
          <h1>${invoice.sellerInfo?.name || 'AlgeriaTrade.dz'}</h1>
          <p>${invoice.sellerInfo?.legalName || invoice.sellerInfo?.name}</p>
          <p>${invoice.sellerInfo?.address}</p>
          <p>Tél: ${invoice.sellerInfo?.phone || ''} | Email: ${invoice.sellerInfo?.email || ''}</p>
        </div>
      </div>
      
      <div class="invoice-title-box">
        <h2>${getInvoiceTypeLabel(invoice.invoiceType, language)}</h2>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
        <div style="margin-top: 8px;">
          <span class="status-badge status-${invoice.status.toLowerCase()}">
            ${getStatusLabel(invoice.status, language)}
          </span>
        </div>
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div class="party-card">
        <div class="party-label">${labels.seller}</div>
        <div class="party-name">${invoice.sellerInfo?.name || ''}</div>
        <div class="party-details">
          <p>${invoice.sellerInfo?.address || ''}</p>
          <p>Tél: ${invoice.sellerInfo?.phone || ''}</p>
          <p>Email: ${invoice.sellerInfo?.email || ''}</p>
        </div>
        <div class="tax-ids">
          <span class="tax-id-item"><strong>NIF:</strong> ${invoice.sellerInfo?.nif || '-'}</span>
          <span class="tax-id-item"><strong>RC:</strong> ${invoice.sellerInfo?.rc || '-'}</span>
          ${invoice.sellerInfo?.ai ? `<span class="tax-id-item"><strong>AI:</strong> ${invoice.sellerInfo.ai}</span>` : ''}
        </div>
      </div>
      
      <div class="party-card">
        <div class="party-label">${labels.buyer}</div>
        <div class="party-name">${invoice.buyerInfo?.name || ''}</div>
        <div class="party-details">
          <p>${invoice.buyerInfo?.address || ''}</p>
          <p>Tél: ${invoice.buyerInfo?.phone || ''}</p>
          <p>Email: ${invoice.buyerInfo?.email || ''}</p>
        </div>
        <div class="tax-ids">
          <span class="tax-id-item"><strong>NIF:</strong> ${invoice.buyerInfo?.nif || '-'}</span>
          ${invoice.buyerInfo?.rc ? `<span class="tax-id-item"><strong>RC:</strong> ${invoice.buyerInfo.rc}</span>` : ''}
        </div>
      </div>
    </div>

    <!-- Invoice Details -->
    <div class="invoice-details">
      <div class="detail-item">
        <label>${labels.issueDate}</label>
        <value>${new Date(invoice.issueDate).toLocaleDateString(language === 'fr' ? 'fr-DZ' : language === 'ar' ? 'ar-DZ' : 'en-US')}</value>
      </div>
      <div class="detail-item">
        <label>${labels.dueDate}</label>
        <value>${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString(language === 'fr' ? 'fr-DZ' : language === 'ar' ? 'ar-DZ' : 'en-US') : '-'}</value>
      </div>
      <div class="detail-item">
        <label>${labels.paymentTerms}</label>
        <value>${getPaymentTermLabel(invoice.paymentTerms as any, language)}</value>
      </div>
      <div class="detail-item">
        <label>${labels.currency}</label>
        <value>${invoice.currency}</value>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%">#</th>
          <th style="width: 35%">${labels.description}</th>
          <th style="width: 10%; text-align: center;">${labels.quantity}</th>
          <th style="width: 12%; text-align: right;">${labels.unitPrice}</th>
          <th style="width: 8%; text-align: center;">${labels.discount}</th>
          <th style="width: 10%; text-align: center;">TVA</th>
          <th style="width: 20%; text-align: right;">${labels.total}</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="description">${escapeHtml(item.description)}</td>
            <td style="text-align: center;">${formatNumber(item.quantity)}</td>
            <td class="amount">${formatCurrency(item.unitPrice, invoice.currency as any)}</td>
            <td style="text-align: center;">${item.discount > 0 ? `${item.discount}%` : '-'}</td>
            <td style="text-align: center;">
              <span style="
                background: ${item.tvaRate === 19 ? '#e3f2fd' : item.tvaRate === 9 ? '#e8f5e9' : item.tvaRate === 0 ? '#fff3e0' : '#fce4ec'};
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 600;
              ">
                ${item.tvaRate === -1 ? 'Exon.' : `${item.tvaRate}%`}
              </span>
            </td>
            <td class="amount"><strong>${formatCurrency(item.lineTotalWithTax, invoice.currency as any)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="total-row">
          <span>${labels.subtotal}</span>
          <span>${formatCurrency(invoice.totals.subtotal, invoice.currency as any)}</span>
        </div>
        ${invoice.totals.discountAmount > 0 ? `
        <div class="total-row discount">
          <span>${labels.discount}</span>
          <span>-${formatCurrency(invoice.totals.discountAmount, invoice.currency as any)}</span>
        </div>
        ` : ''}
        <div class="total-row tax">
          <span>${labels.totalTVA}</span>
          <span>${formatCurrency(invoice.totals.totalTVA, invoice.currency as any)}</span>
        </div>
        <div class="total-row grand-total">
          <span>${labels.totalTTC}</span>
          <span>${formatCurrency(invoice.totals.totalWithTax, invoice.currency as any)}</span>
        </div>
        
        ${invoice.totals.amountPaid > 0 ? `
        <div class="total-row" style="background: #d4edda;">
          <span>${labels.amountPaid}</span>
          <span style="color: #155724;">${formatCurrency(invoice.totals.amountPaid, invoice.currency as any)}</span>
        </div>
        <div class="total-row" style="${invoice.totals.amountDue > 0 ? 'background: #fff3cd;' : 'background: #d4edda;'}">
          <span>${labels.amountDue}</span>
          <span style="color: ${invoice.totals.amountDue > 0 ? '#856404' : '#155724'}; font-weight: bold;">
            ${formatCurrency(Math.max(0, invoice.totals.amountDue), invoice.currency as any)}
          </span>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- TVA Breakdown -->
    ${invoice.totals.tvaBreakdown.length > 0 ? `
    <div class="tva-breakdown">
      <h4>${labels.tvaDetails}</h4>
      <div class="tva-items">
        ${invoice.totals.tvaBreakdown.map(entry => `
          <div class="tva-item">
            <div class="tva-rate">${entry.rate === -1 ? 'Exon.' : `${entry.rate}%`}</div>
            <div class="tva-base">${labels.base}: ${formatCurrency(entry.taxableBase, invoice.currency as any)}</div>
            <div class="tva-amount">${labels.tva}: ${formatCurrency(entry.tvaAmount, invoice.currency as any)}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Notes -->
    ${invoice.notes ? `
    <div class="notes-section">
      <h4>${labels.notes}</h4>
      <p>${escapeHtml(invoice.notes)}</p>
    </div>
    ` : ''}

    <!-- Payment Terms Info -->
    <div class="payment-terms">
      <h4>${labels.paymentConditions}</h4>
      <p>${getPaymentTermsDescription(invoice.paymentTerms as any, language)}</p>
    </div>

    <!-- QR Code & Footer -->
    <div class="qr-section">
      <div>
        <p><strong>Document généré par AlgeriaTrade.dz</strong></p>
        <p>Date de génération: ${new Date().toLocaleString(language === 'fr' ? 'fr-DZ' : 'en-US')}</p>
        <p>Référence: ${invoice.id || invoice.invoiceNumber}</p>
      </div>
      ${includeQRCode ? `
      <div class="qr-code">
        <div style="
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, ${colors.primary}, #008040);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          text-align: center;
          padding: 5px;
        ">
          QR<br/>CODE
        </div>
        <p>Vérification numérique</p>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>AlgeriaTrade.dz SARL</strong> | ${invoiceConfig.company.address}</p>
      <p>NIF: ${invoiceConfig.company.nif} | RC: ${invoiceConfig.company.rc} | AI: ${invoiceConfig.company.ai}</p>
      <div class="footer-legal">
        <p>Document fiscal conforme à la réglementation algérienne (Code des Impôts Directs et Taxes)</p>
        <p>Période de conservation légale: ${invoiceConfig.legalRequirements.retentionPeriodYears} ans</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Helper functions
function getLabels(lang: 'fr' | 'ar' | 'en'): Record<string, string> {
  const labels = {
    fr: {
      invoice: 'FACTURE',
      seller: 'Émetteur / البائع',
      buyer: 'Client / المشتري',
      issueDate: "Date d'émission",
      dueDate: "Date d'échéance",
      paymentTerms: 'Conditions de paiement',
      currency: 'Devise',
      description: 'Description',
      quantity: 'Quantité',
      unitPrice: 'Prix Unit.',
      discount: 'Remise',
      total: 'Total',
      subtotal: 'Sous-total HT',
      totalTVA: 'Total TVA',
      totalTTC: 'Total TTC',
      amountPaid: 'Montant payé',
      amountDue: 'Solde dû',
      tvaDetails: 'Détail TVA (Taxe sur la Valeur Ajoutée)',
      base: 'Base imposable',
      tva: 'Montant TVA',
      notes: 'Notes',
      paymentConditions: 'Conditions de paiement',
    },
    ar: {
      invoice: 'فاتورة',
      seller: 'البائع',
      buyer: 'المشتري',
      issueDate: 'تاريخ الإصدار',
      dueDate: 'تاريخ الاستحقاق',
      paymentTerms: 'شروط الدفع',
      currency: 'العملة',
      description: 'الوصف',
      quantity: 'الكمية',
      unitPrice: 'سعر الوحدة',
      discount: 'خصم',
      total: 'المجموع',
      subtotal: 'المجموع الفرعي',
      totalTVA: 'إجمالي الضريبة',
      totalTTC: 'المجموع شامل الضريبة',
      amountPaid: 'المبلغ المدفوع',
      amountDue: 'الرصيد المستحق',
      tvaDetails: 'تفاصيل ضريبة القيمة المضافة',
      base: 'القاعدة الخاضعة للضريبة',
      tva: 'مبلغ الضريبة',
      notes: 'ملاحظات',
      paymentConditions: 'شروط الدفع',
    },
    en: {
      invoice: 'INVOICE',
      seller: 'Seller',
      buyer: 'Buyer',
      issueDate: 'Issue Date',
      dueDate: 'Due Date',
      paymentTerms: 'Payment Terms',
      currency: 'Currency',
      description: 'Description',
      quantity: 'Qty',
      unitPrice: 'Unit Price',
      discount: 'Discount',
      total: 'Total',
      subtotal: 'Subtotal',
      totalTVA: 'Total VAT',
      totalTTC: 'Total incl. VAT',
      amountPaid: 'Amount Paid',
      amountDue: 'Amount Due',
      tvaDetails: 'VAT Details',
      base: 'Taxable Base',
      tva: 'VAT Amount',
      notes: 'Notes',
      paymentConditions: 'Payment Conditions',
    },
  };
  
  return labels[lang];
}

function getInvoiceTypeLabel(type: string, lang: 'fr' | 'ar' | 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    STANDARD: { fr: 'FACTURE', ar: 'فاتورة', en: 'INVOICE' },
    PROFORMA: { fr: 'FACTURE PROFORMA', ar: 'فاتورة أولية', en: 'PROFORMA INVOICE' },
    CREDIT_NOTE: { fr: "NOTE DE CRÉDIT (AVOIR)", ar: 'إشعار دائن', en: 'CREDIT NOTE' },
    DEBIT_NOTE: { fr: 'NOTE DE DÉBIT', ar: 'إشعار مدين', en: 'DEBIT NOTE' },
  };
  
  return labels[type]?.[lang] || type;
}

function getStatusLabel(status: string, lang: 'fr' | 'ar' | 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    DRAFT: { fr: 'Brouillon', ar: 'مسودة', en: 'Draft' },
    ISSUED: { fr: 'Émise', ar: 'صادرة', en: 'Issued' },
    PAID: { fr: 'Payée', ar: 'مدفوعة', en: 'Paid' },
    PARTIAL: { fr: 'Partielle', ar: 'جزئية', en: 'Partial' },
    OVERDUE: { fr: 'En retard', ar: 'متأخرة', en: 'Overdue' },
    CANCELLED: { fr: 'Annulée', ar: 'ملغاة', en: 'Cancelled' },
  };
  
  return labels[status]?.[lang] || status;
}

function getPaymentTermLabel(term: string, lang: 'fr' | 'ar' | 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    immediate: { fr: 'Paiement immédiat', ar: 'دفعة فورية', en: 'Immediate' },
    net30: { fr: 'Net 30 jours', ar: '30 يوم', en: 'Net 30 days' },
    net60: { fr: 'Net 60 jours', ar: '60 يوم', en: 'Net 60 days' },
    net90: { fr: 'Net 90 jours', ar: '90 يوم', en: 'Net 90 days' },
    endOfMonth: { fr: 'Fin de mois', ar: 'نهاية الشهر', en: 'End of month' },
  };
  
  return labels[term]?.[lang] || term;
}

function getPaymentTermsDescription(term: string, lang: 'fr' | 'ar' | 'en'): string {
  const descriptions: Record<string, Record<string, string>> = {
    immediate: { 
      fr: 'Le paiement est dû dès réception de la facture.', 
      ar: 'يستحق الدفع فور استلام الفاتورة.', 
      en: 'Payment is due upon receipt of invoice.' 
    },
    net30: { 
      fr: 'Le paiement est dû dans les 30 jours suivant la date de facturation.', 
      ar: 'يستحق الدفع خلال 30 يوماً من تاريخ الفاتورة.', 
      en: 'Payment is due within 30 days from invoice date.' 
    },
    net60: { 
      fr: 'Le paiement est dû dans les 60 jours suivant la date de facturation.', 
      ar: 'يستحق الدفع خلال 60 يوماً من تاريخ الفاتورة.', 
      en: 'Payment is due within 60 days from invoice date.' 
    },
    net90: { 
      fr: 'Le paiement est dû dans les 90 jours suivant la date de facturation.', 
      ar: 'يستحق الدفع خلال 90 يوماً من تاريخ الفاتورة.', 
      en: 'Payment is due within 90 days from invoice date.' 
    },
    endOfMonth: { 
      fr: 'Le paiement est dû à la fin du mois de facturation.', 
      ar: 'يستحق الدفع في نهاية شهر الفوترة.', 
      en: 'Payment is due at the end of the billing month.' 
    },
  };
  
  return descriptions[term]?.[lang] || '';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-DZ').format(num);
}

/**
 * Generate PDF as buffer (for server-side use)
 * This would typically use a library like puppeteer or @react-pdf/renderer
 */
export async function generatePDFBuffer(
  invoice: InvoiceData,
  options: PDFExportOptions = {}
): Promise<Buffer> {
  // In a real implementation, this would use puppeteer or similar to render HTML to PDF
  // For now, we return the HTML content which can be converted to PDF
  
  const htmlContent = generateInvoicePDFContent(invoice, options);
  
  // This is a placeholder - in production you'd use:
  // - puppeteer with html-to-pdf
  // - @react-pdf/renderer
  // - pdfkit
  // - jsPDF
  
  return Buffer.from(htmlContent, 'utf-8');
}

/**
 * Generate PDF and return as base64 for download
 */
export async function generatePDFBase64(
  invoice: InvoiceData,
  options: PDFExportOptions = {}
): Promise<string> {
  const buffer = await generatePDFBuffer(invoice, options);
  return buffer.toString('base64');
}

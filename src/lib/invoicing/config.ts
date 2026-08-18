// Professional Invoice Configuration for AlgeriaTrade.dz
// Compliant with Algerian Tax Regulations (TVA - Taxe sur la Valeur Ajoutée)

export const invoiceConfig = {
  // Company information (platform operator)
  company: {
    name: 'AlgeriaTrade.dz',
    legalName: 'Algeria Trade SARL',
    address: '123 Rue Didouche Mourad, Alger, 16000',
    phone: '+213 555 000 000',
    email: 'facturation@algeriatrade.dz',
    nif: '000000000000000', // Numéro d'Identification Fiscale
    nis: '000000000000000', // Numéro d'Identification Statistique
    rc: '16A/AAAA/BBBB', // Registre de Commerce
    ai: '0000000', // Article d'Imposition
  },

  // TVA (VAT) rates for Algeria
  tvaRates: {
    standard: 19, // Standard rate
    reduced: 9,   // Reduced rate (basic goods)
    zero: 0,      // Zero-rated exports
    exempt: -1,   // Exempt (no TVA charged but tracked)
  },

  // Product category to TVA rate mapping
  categoryTVAMap: {
    electronics: 19,
    machinery: 19,
    textiles: 19,
    food: 9,
    pharmaceuticals: 9,
    education: 9,
    exports: 0, // International sales are zero-rated
    services: 19,
  } as Record<string, number>,

  // Invoice numbering
  numbering: {
    prefix: 'FAC-',
    format: '{PREFIX}{YYYY}-{MM}-{SEQ}', // FAC-2024-01-00001
    sequenceReset: 'monthly' as 'monthly' | 'yearly' | 'never', // Reset sequence each month
  },

  // Payment terms
  paymentTerms: {
    immediate: { days: 0, label: 'Paiement immédiat', code: 'IMMEDIATE' },
    net30: { days: 30, label: 'Net 30 jours', code: 'NET30' },
    net60: { days: 60, label: 'Net 60 jours', code: 'NET60' },
    net90: { days: 90, label: 'Net 90 jours', code: 'NET90' },
    endOfMonth: { days: 0, label: 'Fin de mois', code: 'EOM', endOfMonth: true },
  },

  // Currency settings
  currencies: {
    DZD: { symbol: 'د.ج', decimals: 2, locale: 'dz-DZ', name: 'Dinar Algérien' },
    EUR: { symbol: '€', decimals: 2, locale: 'fr-FR', name: 'Euro' },
    USD: { symbol: '$', decimals: 2, locale: 'en-US', name: 'US Dollar' },
  },

  // Legal requirements
  legalRequirements: {
    mandatoryFields: [
      'invoiceNumber',
      'date',
      'supplierInfo',
      'clientInfo',
      'items',
      'totals',
      'tvaDetails',
      'paymentTerms',
    ],
    retentionPeriodYears: 10, // Keep invoices for 10 years
    archivingFormat: 'pdf', // Must archive as PDF/A
  },

  // Invoice types
  invoiceTypes: {
    STANDARD: { label: 'Facture Standard', code: 'STANDARD', prefix: 'FAC' },
    PROFORMA: { label: 'Facture Proforma', code: 'PROFORMA', prefix: 'PRO' },
    CREDIT_NOTE: { label: "Note de Crédit (Avoir)", code: 'CREDIT_NOTE', prefix: 'AVO' },
    DEBIT_NOTE: { label: 'Note de Débit', code: 'DEBIT_NOTE', prefix: 'DEB' },
  },

  // Status labels (bilingual)
  statusLabels: {
    DRAFT: { fr: 'Brouillon', ar: 'مسودة', en: 'Draft' },
    ISSUED: { fr: 'Émise', ar: 'صادرة', en: 'Issued' },
    PAID: { fr: 'Payée', ar: 'مدفوعة', en: 'Paid' },
    PARTIAL: { fr: 'Partielle', ar: 'جزئية', en: 'Partial' },
    OVERDUE: { fr: 'En retard', ar: 'متأخرة', en: 'Overdue' },
    CANCELLED: { fr: 'Annulée', ar: 'ملغاة', en: 'Cancelled' },
  },
} as const;

// Type exports
export type TVARate = 19 | 9 | 0 | -1;
export type InvoiceStatus = keyof typeof invoiceConfig.statusLabels;
export type InvoiceTypeCode = keyof typeof invoiceConfig.invoiceTypes;
export type CurrencyCode = keyof typeof invoiceConfig.currencies;
export type PaymentTermCode = keyof typeof invoiceConfig.paymentTerms;

// Interfaces
export interface CompanyInfo {
  name: string;
  legalName?: string;
  address: string;
  city?: string;
  wilayaCode?: string;
  phone: string;
  email: string;
  nif: string; // Numéro d'Identification Fiscale
  nis?: string; // Numéro d'Identification Statistique
  rc: string; // Registre de Commerce
  ai?: string; // Article d'Imposition
  logoUrl?: string;
}

export interface ClientInfo {
  name: string;
  address: string;
  city?: string;
  wilayaCode?: string;
  phone?: string;
  email?: string;
  nif?: string;
  rc?: string;
  ai?: string;
}

export interface InvoiceLineItemInput {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number; // Percentage
  tvaRate?: TVARate;
  productSku?: string;
  unitOfMeasure?: string;
}

export interface InvoiceLineItem extends InvoiceLineItemInput {
  lineTotal: number;
  taxableAmount: number;
  tvaAmount: number;
  lineTotalWithTax: number;
}

export interface TVABreakdownEntry {
  rate: TVARate;
  taxableBase: number;
  tvaAmount: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxableBase: number;
  tvaBreakdown: TVABreakdownEntry[];
  totalTVA: number;
  totalWithTax: number;
  amountPaid: number;
  amountDue: number;
}

export interface InvoiceData {
  id?: string;
  invoiceNumber: string;
  invoiceType: InvoiceTypeCode;
  
  // Entities
  sellerId: string;
  buyerId: string;
  orderId?: string;
  
  // Status
  status: InvoiceStatus;
  
  // Dates
  issueDate: Date;
  dueDate?: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  
  // Financials
  totals: InvoiceTotals;
  currency: CurrencyCode;
  
  // Payment terms
  paymentTerms: PaymentTermCode;
  notes?: string;
  internalNotes?: string;
  
  // References
  parentInvoiceId?: string;
  quotedInvoiceId?: string;
  
  // Items
  items: InvoiceLineItem[];
  
  // Parties
  sellerInfo: CompanyInfo;
  buyerInfo: ClientInfo;
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateInvoiceInput {
  orderId?: string;
  sellerId: string;
  buyerId: string;
  invoiceType: InvoiceTypeCode;
  items: InvoiceLineItemInput[];
  issueDate?: Date;
  paymentTerms?: PaymentTermCode;
  currency?: CurrencyCode;
  discountPercent?: number;
  notes?: string;
  internalNotes?: string;
  parentInvoiceId?: string;
  quotedInvoiceId?: string;
  sellerInfo?: Partial<CompanyInfo>;
  buyerInfo?: Partial<ClientInfo>;
}

export interface ProformaInvoiceInput extends Omit<CreateInvoiceInput, 'invoiceType'> {
  validUntil?: Date;
  convertToInvoiceOnOrder?: boolean;
}

export interface CreditNoteInput {
  originalInvoiceId: string;
  reason: string;
  itemsToCredit?: Array<{
    itemId: string;
    quantity?: number;
    reason?: string;
  }>;
  partialCredit?: boolean;
}

export interface DebitNoteInput {
  originalInvoiceId: string;
  reason: string;
  additionalItems: InvoiceLineItemInput[];
  priceAdjustments?: Array<{
    itemId: string;
    newUnitPrice: number;
    reason: string;
  }>;
}

// Helper functions
export function getTVARateForCategory(category: string): TVARate {
  return (invoiceConfig.categoryTVAMap[category] ?? 19) as TVARate;
}

export function getPaymentTermDays(termCode: PaymentTermCode): number {
  return invoiceConfig.paymentTerms[termCode].days;
}

export function getPaymentTermLabel(termCode: PaymentTermCode): string {
  return invoiceConfig.paymentTerms[termCode].label;
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return invoiceConfig.currencies[currency].symbol;
}

export function getStatusLabel(status: InvoiceStatus, locale: 'fr' | 'ar' | 'en' = 'fr'): string {
  return invoiceConfig.statusLabels[status][locale];
}

export function getInvoiceTypePrefix(type: InvoiceTypeCode): string {
  return invoiceConfig.invoiceTypes[type].prefix;
}

export function isValidNIF(nif: string): boolean {
  // NIF should be 15 digits
  return /^\d{15}$/.test(nif);
}

export function isValidRC(rc: string): boolean {
  // RC format: XXA/XXXXXXX or similar
  /^[A-Z]\d{2}\/[A-Z]{0,4}\d{0,7}$/.test(rc);
  return rc.length >= 8;
}

export function generateInvoiceNumber(
  type: InvoiceTypeCode,
  date: Date = new Date(),
  sequence: number = 1
): string {
  const prefix = getInvoiceTypePrefix(type);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const seq = String(sequence).padStart(5, '0');
  
  return `${prefix}${year}-${month}-${seq}`;
}

export function calculateDueDate(
  issueDate: Date,
  paymentTerms: PaymentTermCode
): Date {
  const term = invoiceConfig.paymentTerms[paymentTerms];
  const dueDate = new Date(issueDate);
  
  if (term.endOfMonth) {
    // End of month - set to last day of current month
    dueDate.setMonth(dueDate.getMonth() + 1, 0);
  } else {
    dueDate.setDate(dueDate.getDate() + term.days);
  }
  
  return dueDate;
}

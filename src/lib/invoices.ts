// Professional Invoice Generation System
// Compliant with Algerian tax regulations (TVA)
// Supports bilingual French/Arabic invoices

import { db } from '@/lib/db'
import { formatDZD } from './payments/utils'

// ============================================
// Types
// ============================================

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
export type InvoiceType = 'COMMERCIAL' | 'PROFORMA' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'DOWN_PAYMENT' | 'INSTALLMENT'

export type TVARate = 0 | 9 | 19 // Standard Algerian TVA rates

export interface CompanyInfo {
  companyName: string
  commercialRegister: string // NRC - Numéro du Registre de Commerce
  taxIdentifier: string // NIF - Numéro d'Identification Fiscale
  articleOfAssociation: string // AI - Article d'Imposition
  address: string
  city: string
  wilayaCode: string
  phone: string
  email: string
  logoUrl?: string
}

export interface InvoiceLineItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  discount: number // Percentage (0-100)
  taxRate: TVARate
  sortOrder?: number
}

export interface InvoiceInput {
  orderId: string
  sellerId: string
  buyerId: string
  invoiceType: InvoiceType
  items: InvoiceLineItem[]
  issueDate?: Date
  paymentTerms?: string // e.g., "Net 30", "Net 60"
  notes?: string
  termsConditions?: string
  quotationId?: string
  relatedInvoiceId?: string // For credit/debit notes
  currency?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  invoiceType: InvoiceType
  status: InvoiceStatus
  
  sellerId: string
  sellerInfo?: CompanyInfo
  buyerId: string
  buyerInfo?: CompanyInfo
  
  issueDate: Date
  dueDate: Date
  paidDate?: Date
  
  lineItems: InvoiceLineItemDetail[]
  subtotal: number
  discountTotal: number
  tvaAmount: number // Total TVA
  tssAmount: number // Taxe sur Salaire (if applicable)
  totalAmount: number
  amountPaid: number
  balanceDue: number
  
  currency: string
  paymentTerms: string
  notes?: string
  termsConditions?: string
  pdfPath?: string
  
  quotationId?: string
  relatedInvoiceId?: string
  
  createdAt: Date
  updatedAt: Date
  payments: InvoicePaymentRecord[]
}

export interface InvoiceLineItemDetail {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: TVARate
  taxAmount: number
  lineTotal: number
}

export interface InvoicePaymentRecord {
  id: string
  amount: number
  paymentMethod: string
  transactionId?: string
  referenceNumber?: string
  notes?: string
  paidAt: Date
}

export interface TaxConfiguration {
  tvaRate: TVARate
  tssRate: number // Usually 0% for exports
  isExport: boolean // Exports may be TVA-exempt
  hasTaxExemption: boolean
  exemptionCertificate?: string
}

export interface InvoiceSummary {
  totalInvoices: number
  totalAmount: number
  totalTVA: number
  totalPaid: number
  totalOutstanding: number
  invoicesByStatus: Record<InvoiceStatus, number>
  invoicesByType: Record<InvoiceType, number>
}

// ============================================
// Algerian Tax Configuration
// ============================================

export const ALGERIAN_TAX_RATES = {
  STANDARD: 19,    // Standard rate for most goods/services
  REDUCED: 9,      // Reduced rate for basic necessities
  ZERO: 0,         // Exports and exempt goods/services
} as const

export const PAYMENT_TERMS = {
  IMMEDIATE: { label: 'Paiement immédiat', days: 0 },
  NET_15: { label: 'Net 15 jours', days: 15 },
  NET_30: { label: 'Net 30 jours', days: 30 },
  NET_60: { label: 'Net 60 jours', days: 60 },
  NET_90: { label: 'Net 90 jours', days: 90 },
  END_OF_MONTH: { label: 'Fin de mois', days: 30 }, // Simplified
} as const

// ============================================
// Invoice Number Generation
// ============================================

/**
 * Generate a unique invoice number
 * Format: INV-YYYYMMDD-XXXX or PRO-YYYYMMDD-XXXX for proforma
 */
export async function generateInvoiceNumber(type: InvoiceType): Promise<string> {
  const prefix = getInvoicePrefix(type)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  
  // Get count of invoices today for this type
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  
  const count = await db.invoice.count({
    where: {
      invoiceType: type as any,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  })
  
  const sequence = String(count + 1).padStart(4, '0')
  
  return `${prefix}-${dateStr}-${sequence}`
}

function getInvoicePrefix(type: InvoiceType): string {
  switch (type) {
    case 'PROFORMA':
      return 'PRO'
    case 'CREDIT_NOTE':
      return 'AVO' // Avoir
    case 'DEBIT_NOTE':
      return 'DEB'
    case 'DOWN_PAYMENT':
      return 'ACC' // Acompte
    case 'INSTALLMENT':
      return 'ECH' // Échéance
    default:
      return 'INV'
  }
}

// ============================================
// TVA/TSS Calculation Functions
// ============================================

/**
 * Calculate TVA (Taxe sur la Valeur Ajoutée) for Algerian regulations
 * @param amount - The taxable amount
 * @param rate - TVA rate (0%, 9%, or 19%)
 * @returns TVA amount
 */
export function calculateTVA(amount: number, rate: TVARate): number {
  if (rate === 0) return 0
  return Math.round((amount * rate) / 100 * 100) / 100 // Round to 2 decimals
}

/**
 * Calculate TSS (Taxe sur les Salaires) - rarely used in B2B
 * Only applicable to specific service companies
 */
export function calculateTSS(amount: number, rate: number = 0): number {
  if (rate === 0) return 0
  return Math.round((amount * rate) / 100 * 100) / 100
}

/**
 * Calculate line item totals including discounts and taxes
 */
export function calculateLineItem(item: InvoiceLineItem): {
  subtotal: number
  discountAmount: number
  taxableAmount: number
  taxAmount: number
  lineTotal: number
} {
  const subtotal = item.quantity * item.unitPrice
  const discountAmount = Math.round((subtotal * item.discount) / 100 * 100) / 100
  const taxableAmount = subtotal - discountAmount
  const taxAmount = calculateTVA(taxableAmount, item.taxRate)
  const lineTotal = taxableAmount + taxAmount
  
  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    lineTotal,
  }
}

/**
 * Calculate complete invoice totals
 */
export function calculateInvoiceTotals(items: InvoiceLineItem[]): {
  subtotal: number
  discountTotal: number
  tvaBreakdown: Record<TVARate, { base: number, amount: number }>
  totalTVA: number
  tssAmount: number
  totalAmount: number
} {
  let subtotal = 0
  let discountTotal = 0
  const tvaBreakdown: Record<TVARate, { base: number; amount: number }> = {
    0: { base: 0, amount: 0 },
    9: { base: 0, amount: 0 },
    19: { base: 0, amount: 0 },
  }
  
  for (const item of items) {
    const calc = calculateLineItem(item)
    subtotal += calc.subtotal
    discountTotal += calc.discountAmount
    
    // Accumulate by TVA rate
    tvaBreakdown[item.taxRate].base += calc.taxableAmount
    tvaBreakdown[item.taxRate].amount += calc.taxAmount
  }
  
  const totalTVA = Object.values(tvaBreakdown).reduce((sum, tv) => sum + tv.amount, 0)
  const tssAmount = 0 // TSS not typically applied to B2B invoices
  const totalAmount = subtotal - discountTotal + totalTVA + tssAmount
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    tvaBreakdown,
    totalTVA: Math.round(totalTVA * 100) / 100,
    tssAmount,
    totalAmount: Math.round(totalAmount * 100) / 100,
  }
}

// ============================================
// Invoice CRUD Operations
// ============================================

/**
 * Create a new invoice
 */
export async function createInvoice(input: InvoiceInput): Promise<Invoice> {
  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(input.invoiceType)
  
  // Calculate dates
  const issueDate = input.issueDate ?? new Date()
  const paymentTermDays = getPaymentTermDays(input.paymentTerms ?? 'Net 30')
  const dueDate = new Date(issueDate)
  dueDate.setDate(dueDate.getDate() + paymentTermDays)
  
  // Calculate totals
  const totals = calculateInvoiceTotals(input.items)
  
  // Create invoice with items
  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      invoiceType: input.invoiceType as any,
      status: 'DRAFT',
      sellerId: input.sellerId,
      buyerId: input.buyerId,
      orderId: input.orderId,
      issueDate,
      dueDate,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      tvaAmount: totals.totalTVA,
      tssAmount: totals.tssAmount,
      totalAmount: totals.totalAmount,
      amountPaid: 0,
      balanceDue: totals.totalAmount,
      currency: input.currency ?? 'DZD',
      paymentTerms: input.paymentTerms ?? 'Net 30',
      notes: input.notes,
      termsConditions: input.termsConditions,
      quotationId: input.quotationId,
      relatedInvoiceId: input.relatedInvoiceId,
      items: {
        create: input.items.map((item, index) => {
          const calc = calculateLineItem(item)
          return {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
            taxAmount: calc.taxAmount,
            lineTotal: calc.lineTotal,
            sortOrder: item.sortOrder ?? index,
          }
        }),
      },
    },
    include: {
      items: true,
      payments: true,
    },
  })
  
  return mapDbInvoiceToInterface(invoice)
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(invoiceId: string): Promise<Invoice> {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
      payments: { orderBy: { paidAt: 'desc' } },
    },
  })
  
  if (!invoice) {
    throw new Error('Invoice not found')
  }
  
  return mapDbInvoiceToInterface(invoice)
}

/**
 * Get invoice by invoice number
 */
export async function getInvoiceByNumber(invoiceNumber: string): Promise<Invoice> {
  const invoice = await db.invoice.findUnique({
    where: { invoiceNumber },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
      payments: { orderBy: { paidAt: 'desc' } },
    },
  })
  
  if (!invoice) {
    throw new Error('Invoice not found')
  }
  
  return mapDbInvoiceToInterface(invoice)
}

/**
 * Update invoice status to ISSUED
 */
export async function issueInvoice(invoiceId: string): Promise<Invoice> {
  const invoice = await db.invoice.update({
    where: { id: invoiceId },
    data: { status: 'ISSUED' },
    include: { items: true, payments: true },
  })
  
  return mapDbInvoiceToInterface(invoice)
}

/**
 * List invoices with filters
 */
export async function listInvoices(filters: {
  sellerId?: string
  buyerId?: string
  status?: InvoiceStatus
  type?: InvoiceType
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
}): Promise<{ invoices: Invoice[]; total: number }> {
  const whereClause: any = {}
  
  if (filters.sellerId) whereClause.sellerId = filters.sellerId
  if (filters.buyerId) whereClause.buyerId = filters.buyerId
  if (filters.status) whereClause.status = filters.status
  if (filters.type) whereClause.invoiceType = filters.type
  if (filters.dateFrom || filters.dateTo) {
    whereClause.issueDate = {}
    if (filters.dateFrom) whereClause.issueDate.gte = filters.dateFrom
    if (filters.dateTo) whereClause.issueDate.lte = filters.dateTo
  }
  
  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where: whereClause,
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 20,
      skip: filters.offset ?? 0,
    }),
    db.invoice.count({ where: whereClause }),
  ])
  
  return {
    invoices: invoices.map(mapDbInvoiceToInterface),
    total,
  }
}

// ============================================
// Payment Operations
// ============================================

/**
 * Record a payment against an invoice
 */
export async function recordInvoicePayment(
  invoiceId: string,
  amount: number,
  paymentMethod: string,
  options?: {
    transactionId?: string
    referenceNumber?: string
    notes?: string
  }
): Promise<Invoice> {
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } })
  
  if (!invoice) {
    throw new Error('Invoice not found')
  }
  
  const newAmountPaid = Number(invoice.amountPaid) + amount
  const newBalanceDue = Number(invoice.balanceDue) - amount
  
  // Determine new status
  let newStatus = invoice.status as InvoiceStatus
  let paidDate = invoice.paidDate
  
  if (newBalanceDue <= 0) {
    newStatus = 'PAID'
    paidDate = new Date()
  } else if (newAmountPaid > 0 && newAmountPaid < Number(invoice.totalAmount)) {
    newStatus = 'PARTIAL'
  }
  
  // Create payment record and update invoice in transaction
  await db.$transaction([
    db.invoicePayment.create({
      data: {
        invoiceId,
        amount,
        paymentMethod,
        transactionId: options?.transactionId,
        referenceNumber: options?.referenceNumber,
        notes: options?.notes,
      },
    }),
    db.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus as any,
        paidDate,
      },
    }),
  ])
  
  return getInvoiceById(invoiceId)
}

// ============================================
// Credit Note Operations
// ============================================

/**
 * Issue a credit note (avoir) for an invoice
 */
export async function issueCreditNote(
  originalInvoiceId: string,
  reason: string,
  itemsToCredit?: { itemId: string; quantity?: number }[]
): Promise<Invoice> {
  const originalInvoice = await db.invoice.findUnique({
    where: { id: originalInvoiceId },
    include: { items: true },
  })
  
  if (!originalInvoice) {
    throw new Error('Original invoice not found')
  }
  
  // Create credit note items
  const creditItems: InvoiceLineItem[] = []
  
  if (itemsToCredit && itemsToCredit.length > 0) {
    // Credit specific items
    for (const itemToCredit of itemsToCredit) {
      const originalItem = originalInvoice.items.find(i => i.id === itemToCredit.itemId)
      if (originalItem) {
        creditItems.push({
          description: `[AVOIR] ${originalItem.description}`,
          quantity: -(itemToCredit.quantity ?? Number(originalItem.quantity)),
          unitPrice: Number(originalItem.unitPrice),
          discount: Number(originalItem.discount),
          taxRate: originalItem.taxRate as TVARate,
        })
      }
    }
  } else {
    // Credit entire invoice
    for (const item of originalInvoice.items) {
      creditItems.push({
        description: `[AVOIR] ${item.description}`,
        quantity: -Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        taxRate: item.taxRate as TVARate,
      })
    }
  }
  
  // Create credit note
  const creditNote = await createInvoice({
    orderId: originalInvoice.orderId,
    sellerId: originalInvoice.buyerId, // Reversed: buyer becomes seller for credit
    buyerId: originalInvoice.sellerId, // Seller becomes buyer
    invoiceType: 'CREDIT_NOTE',
    items: creditItems,
    notes: `Avoir pour facture ${originalInvoice.invoiceNumber}. Motif: ${reason}`,
    relatedInvoiceId: originalInvoice.id,
  })
  
  return creditNote
}

// ============================================
// Summary & Reporting
// ============================================

/**
 * Get invoice summary for a period
 */
export async function getInvoiceSummary(
  sellerId: string,
  period: { start: Date; end: Date }
): Promise<InvoiceSummary> {
  const invoices = await db.invoice.findMany({
    where: {
      sellerId,
      issueDate: {
        gte: period.start,
        lte: period.end,
      },
    },
  })
  
  const summary: InvoiceSummary = {
    totalInvoices: invoices.length,
    totalAmount: 0,
    totalTVA: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    invoicesByStatus: {
      DRAFT: 0,
      ISSUED: 0,
      PAID: 0,
      PARTIAL: 0,
      OVERDUE: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    },
    invoicesByType: {
      COMMERCIAL: 0,
      PROFORMA: 0,
      CREDIT_NOTE: 0,
      DEBIT_NOTE: 0,
      DOWN_PAYMENT: 0,
      INSTALLMENT: 0,
    },
  }
  
  for (const inv of invoices) {
    summary.totalAmount += Number(inv.totalAmount)
    summary.totalTVA += Number(inv.tvaAmount)
    summary.totalPaid += Number(inv.amountPaid)
    summary.totalOutstanding += Number(inv.balanceDue)
    
    summary.invoicesByStatus[inv.status as InvoiceStatus]++
    summary.invoicesByType[inv.invoiceType as InvoiceType]++
  }
  
  return summary
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate Algerian tax identifiers format
 */
export function validateTaxIdentifiers(info: CompanyInfo): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // NIF validation (usually 15 digits)
  if (!info.taxIdentifier || !/^\d{15}$/.test(info.taxIdentifier)) {
    errors.push('NIF invalide (doit contenir 15 chiffres)')
  }
  
  // NRC validation (usually 10+ digits/letters)
  if (!info.commercialRegister || info.commercialRegister.length < 8) {
    errors.push('NRC invalide')
  }
  
  // AI validation
  if (!info.articleOfAssociation || info.articleOfAssociation.length < 3) {
    errors.push("Article d'imposition invalide")
  }
  
  // Wilaya code validation (01-58)
  if (!info.wilayaCode || !/^(0[1-9]|[1-5][0-9])$/.test(info.wilayaCode)) {
    errors.push('Code wilaya invalide (01-58)')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if company has valid tax registration
 */
export async function validateCompanyTaxInfo(companyId: string): Promise<boolean> {
  // In production, this would call the DGI (Direction Générale des Impôts) API
  // For now, we just check if the company exists and is verified
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      nif: true,
      rcNumber: true,
      verificationStatus: true,
    },
  })
  
  if (!company) return false
  
  // Check that required fields exist
  return !!(company.nif && company.rcNumber && company.verificationStatus === 'VERIFIED')
}

// ============================================
// Helper Functions
// ============================================

function getPaymentTermDays(term: string): number {
  switch (term.toLowerCase()) {
    case 'immédiat':
    case 'immediate':
      return 0
    case 'net 15':
    case 'net15':
      return 15
    case 'net 60':
    case 'net60':
      return 60
    case 'net 90':
    case 'net90':
      return 90
    case 'fin de mois':
    case 'end of month':
      return 30
    case 'net 30':
    case 'net30':
    default:
      return 30
  }
}

function mapDbInvoiceToInterface(dbInvoice: any): Invoice {
  return {
    id: dbInvoice.id,
    invoiceNumber: dbInvoice.invoiceNumber,
    invoiceType: dbInvoice.invoiceType as InvoiceType,
    status: dbInvoice.status as InvoiceStatus,
    sellerId: dbInvoice.sellerId,
    buyerId: dbInvoice.buyerId,
    issueDate: new Date(dbInvoice.issueDate),
    dueDate: new Date(dbInvoice.dueDate),
    paidDate: dbInvoice.paidDate ? new Date(dbInvoice.paidDate) : undefined,
    lineItems: (dbInvoice.items ?? []).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: item.discount,
      taxRate: item.taxRate as TVARate,
      taxAmount: Number(item.taxAmount),
      lineTotal: Number(item.lineTotal),
    })),
    subtotal: Number(dbInvoice.subtotal),
    discountTotal: Number(dbInvoice.discountTotal),
    tvaAmount: Number(dbInvoice.tvaAmount),
    tssAmount: Number(dbInvoice.tssAmount),
    totalAmount: Number(dbInvoice.totalAmount),
    amountPaid: Number(dbInvoice.amountPaid),
    balanceDue: Number(dbInvoice.balanceDue),
    currency: dbInvoice.currency,
    paymentTerms: dbInvoice.paymentTerms,
    notes: dbInvoice.notes ?? undefined,
    termsConditions: dbInvoice.termsConditions ?? undefined,
    pdfPath: dbInvoice.pdfPath ?? undefined,
    quotationId: dbInvoice.quotationId ?? undefined,
    relatedInvoiceId: dbInvoice.relatedInvoiceId ?? undefined,
    createdAt: new Date(dbInvoice.createdAt),
    updatedAt: new Date(dbInvoice.updatedAt),
    payments: (dbInvoice.payments ?? []).map((p: any) => ({
      id: p.id,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId ?? undefined,
      referenceNumber: p.referenceNumber ?? undefined,
      notes: p.notes ?? undefined,
      paidAt: new Date(p.paidAt),
    })),
  }
}

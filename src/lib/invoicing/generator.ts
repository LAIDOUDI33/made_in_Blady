// Invoice Generation Engine
// Handles creation of various invoice types

import {
  type InvoiceData,
  type CreateInvoiceInput,
  type ProformaInvoiceInput,
  type CreditNoteInput,
  type DebitNoteInput,
  type InvoiceTypeCode,
  type TVARate,
  type CompanyInfo,
  type ClientInfo,
  type InvoiceLineItem,
  invoiceConfig,
  generateInvoiceNumber,
  calculateDueDate,
} from './config';
import {
  calculateLineItemTax,
  calculateInvoiceTotals,
  validateTVA,
  roundTVA,
} from './calculator';

// Default company info (can be overridden)
const defaultCompanyInfo: CompanyInfo = {
  name: invoiceConfig.company.name,
  legalName: invoiceConfig.company.legalName,
  address: invoiceConfig.company.address,
  city: 'Alger',
  wilayaCode: '16',
  phone: invoiceConfig.company.phone,
  email: invoiceConfig.company.email,
  nif: invoiceConfig.company.nif,
  nis: invoiceConfig.company.nis,
  rc: invoiceConfig.company.rc,
  ai: invoiceConfig.company.ai,
};

/**
 * Generate a new invoice from input data
 */
export async function generateInvoice(input: CreateInvoiceInput): Promise<InvoiceData> {
  const issueDate = input.issueDate ?? new Date();
  const paymentTerms = input.paymentTerms ?? 'net30';
  const currency = input.currency ?? 'DZD';
  
  // Generate invoice number
  const invoiceNumber = generateInvoiceNumber(input.invoiceType, issueDate);
  
  // Calculate due date
  const dueDate = calculateDueDate(issueDate, paymentTerms);
  
  // Process line items
  const items: InvoiceLineItem[] = input.items.map((item, index) => {
    const calc = calculateLineItemTax(item);
    return {
      id: item.id || `item-${Date.now()}-${index}`,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount ?? 0,
      tvaRate: item.tvaRate ?? 19 as TVARate,
      productSku: item.productSku,
      unitOfMeasure: item.unitOfMeasure,
      lineTotal: calc.lineTotal,
      taxableAmount: calc.taxableAmount,
      tvaAmount: calc.tvaAmount,
      lineTotalWithTax: calc.lineTotalWithTax,
    };
  });
  
  // Calculate totals
  const totals = calculateInvoiceTotals(input.items, input.discountPercent ?? 0);
  
  // Build seller info (merge with defaults)
  const sellerInfo: CompanyInfo = {
    ...defaultCompanyInfo,
    ...input.sellerInfo,
  };
  
  // Build buyer info with defaults
  const buyerInfo: ClientInfo = {
    name: 'Client',
    address: '',
    ...input.buyerInfo,
  };

  // Validate before returning
  const validation = validateTVA(input.items);
  if (!validation.isValid) {
    console.warn('Invoice validation warnings:', validation.warnings);
    if (validation.errors.length > 0) {
      throw new Error(`Invoice validation failed: ${validation.errors.join('; ')}`);
    }
  }

  return {
    invoiceNumber,
    invoiceType: input.invoiceType,
    sellerId: input.sellerId,
    buyerId: input.buyerId,
    orderId: input.orderId,
    status: 'DRAFT',
    issueDate,
    dueDate,
    totals: {
      ...totals,
      amountPaid: 0,
      amountDue: totals.totalWithTax,
    },
    currency: currency as any,
    paymentTerms: paymentTerms as any,
    notes: input.notes,
    internalNotes: input.internalNotes,
    parentInvoiceId: input.parentInvoiceId,
    quotedInvoiceId: input.quotedInvoiceId,
    items,
    sellerInfo,
    buyerInfo,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Generate a proforma invoice (no accounting impact)
 */
export async function generateProformaInvoice(
  input: ProformaInvoiceInput
): Promise<InvoiceData> {
  const invoice = await generateInvoice({
    ...input,
    invoiceType: 'PROFORMA',
  });

  // Mark as proforma specific fields
  invoice.notes = [
    invoice.notes,
    `Facture Proforma - Valide jusqu'au ${input.validUntil ? 
      new Date(input.validUntil).toLocaleDateString('fr-DZ') : 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-DZ')}`,
    'Cette facture n\'a pas de valeur comptable.',
  ]
    .filter(Boolean)
    .join('\n');

  return invoice;
}

/**
 * Generate a credit note (avoir) for returns/refunds
 */
export async function generateCreditNote(input: CreditNoteInput): Promise<InvoiceData> {
  // This would typically fetch the original invoice from DB
  // For now, we create a credit note structure
  
  const creditItems = input.itemsToCredit?.map((item) => ({
    id: `credit-${item.itemId}`,
    description: `[AVOIR] Retour/Remboursement`,
    quantity: -(item.quantity ?? 1),
    unitPrice: 0, // Would be fetched from original
    tvaRate: 19 as TVARate,
  })) ?? [{
    id: 'credit-full',
    description: `[AVOIR] ${input.reason}`,
    quantity: -1,
    unitPrice: 0,
    tvaRate: 19 as TVARate,
  }];

  const invoice = await generateInvoice({
    sellerId: '', // Would be original buyer
    buyerId: '', // Would be original seller
    invoiceType: 'CREDIT_NOTE',
    items: creditItems,
    notes: `Note de Crédit (Avoir)\nRaison: ${input.reason}\nFacture originale référencée.`,
    parentInvoiceId: input.originalInvoiceId,
  });

  return invoice;
}

/**
 * Generate a debit note for price adjustments
 */
export async function generateDebitNote(input: DebitNoteInput): Promise<InvoiceData> {
  const debitItems = [
    ...input.additionalItems,
    ...(input.priceAdjustments?.map((adj) => ({
      id: `adj-${adj.itemId}`,
      description: `[AJUSTEMENT] ${adj.reason}`,
      quantity: 1,
      unitPrice: adj.newUnitPrice,
      tvaRate: 19 as TVARate,
    })) ?? []),
  ];

  const invoice = await generateInvoice({
    sellerId: '',
    buyerId: '',
    invoiceType: 'DEBIT_NOTE',
    items: debitItems,
    notes: `Note de Débit\nRaison: ${input.reason}\nFacture originale référencée.`,
    parentInvoiceId: input.originalInvoiceId,
  });

  return invoice;
}

/**
 * Duplicate an invoice with a new number
 */
export async function duplicateInvoice(originalInvoice: InvoiceData): Promise<InvoiceData> {
  const newItems = originalInvoice.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount,
    tvaRate: item.tvaRate,
    productSku: item.productSku,
    unitOfMeasure: item.unitOfMeasure,
  }));

  const duplicated = await generateInvoice({
    orderId: originalInvoice.orderId,
    sellerId: originalInvoice.sellerId,
    buyerId: originalInvoice.buyerId,
    invoiceType: originalInvoice.invoiceType,
    items: newItems,
    paymentTerms: originalInvoice.paymentTerms as any,
    currency: originalInvoice.currency as any,
    notes: `Duplication de: ${originalInvoice.invoiceNumber}`,
    sellerInfo: originalInvoice.sellerInfo,
    buyerInfo: originalInvoice.buyerInfo,
  });

  return duplicated;
}

/**
 * Cancel/void an invoice with reason
 */
export function cancelInvoice(
  invoice: InvoiceData,
  reason: string,
  cancelledBy: string
): InvoiceData {
  if (invoice.status === 'PAID') {
    throw new Error('Cannot cancel a paid invoice. Use credit note instead.');
  }

  if (invoice.status === 'CANCELLED') {
    throw new Error('Invoice is already cancelled.');
  }

  return {
    ...invoice,
    status: 'CANCELLED',
    cancelledAt: new Date(),
    internalNotes: [
      invoice.internalNotes,
      `ANNULÉ le ${new Date().toISOString()} par ${cancelledBy}`,
      `Raison: ${reason}`,
    ]
      .filter(Boolean)
      .join('\n'),
    updatedAt: new Date(),
  };
}

/**
 * Validate invoice completeness before issuing
 */
export function validateInvoice(invoice: InvoiceData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canIssue: boolean;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check mandatory fields per Algerian regulations
  const mandatoryFields = invoiceConfig.legalRequirements.mandatoryFields;

  // Invoice number
  if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === '') {
    errors.push('Numéro de facture manquant');
  }

  // Date
  if (!invoice.issueDate) {
    errors.push('Date d\'émission manquante');
  }

  // Seller info
  if (!invoice.sellerInfo?.name) {
    errors.push('Informations vendeur manquantes');
  } else {
    if (!invoice.sellerInfo.nif) {
      errors.push('NIF du vendeur manquant');
    }
    if (!invoice.sellerInfo.rc) {
      errors.push('RC du vendeur manquant');
    }
  }

  // Buyer info
  if (!invoice.buyerInfo?.name) {
    errors.push('Informations client manquantes');
  }

  // Items
  if (!invoice.items || invoice.items.length === 0) {
    errors.push('La facture doit contenir au moins un article');
  } else {
    // Validate each item has required info
    for (let i = 0; i < invoice.items.length; i++) {
      const item = invoice.items[i];
      if (!item.description) {
        errors.push(`Article ${i + 1}: Description manquante`);
      }
      if (item.quantity <= 0) {
        errors.push(`Article ${i + 1}: Quantité invalide`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Article ${i + 1}: Prix négatif`);
      }
    }
  }

  // Totals
  if (!invoice.totals) {
    errors.push('Totaux non calculés');
  } else {
    if (invoice.totals.totalWithTax < 0) {
      warnings.push('Le total est négatif');
    }
    if (invoice.totals.totalTVA < 0) {
      errors.push('TVA négative détectée');
    }
  }

  // TVA details
  if (!invoice.totals?.tvaBreakdown || invoice.totals.tvaBreakdown.length === 0) {
    warnings.push('Détail TVA non disponible');
  }

  // Payment terms
  if (!invoice.paymentTerms) {
    warnings.push('Conditions de paiement non spécifiées');
  }

  // Status checks
  if (invoice.status === 'ISSUED' || invoice.status === 'PAID') {
    errors.push('Cette facture a déjà été émise ou payée');
  }

  if (invoice.status === 'CANCELLED') {
    errors.push('Cette facture est annulée');
  }

  // Can issue if no errors
  const canIssue = errors.length === 0 && invoice.status === 'DRAFT';

  return {
    isValid: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    canIssue,
  };
}

/**
 * Issue an invoice (change status to ISSUED)
 */
export function issueInvoice(invoice: InvoiceData, issuedBy?: string): InvoiceData {
  const validation = validateInvoice(invoice);

  if (!validation.canIssue) {
    throw new Error(
      `Cannot issue invoice: ${validation.errors.join(', ')}`
    );
  }

  return {
    ...invoice,
    status: 'ISSUED',
    updatedAt: new Date(),
    internalNotes: [
      invoice.internalNotes,
      issuedBy ? `Émise par: ${issuedBy}` : null,
      `Date d'émission: ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

/**
 * Record payment on an invoice
 */
export function recordPayment(
  invoice: InvoiceData,
  amount: number,
  paymentMethod: string,
  reference?: string
): InvoiceData {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }

  const newAmountPaid = roundTVA(invoice.totals.amountPaid + amount);
  const newAmountDue = roundTVA(invoice.totals.amountDue - amount);

  let newStatus = invoice.status;

  if (newAmountDue <= 0.01) {
    newStatus = 'PAID';
  } else if (newAmountPaid > 0) {
    newStatus = 'PARTIAL';
  }

  return {
    ...invoice,
    status: newStatus,
    paidAt: newAmountDue <= 0.01 ? new Date() : invoice.paidAt,
    totals: {
      ...invoice.totals,
      amountPaid: newAmountPaid,
      amountDue: Math.max(0, newAmountDue),
    },
    updatedAt: new Date(),
  };
}

/**
 * Get invoice summary statistics
 */
export function getInvoiceStatistics(invoices: InvoiceData[]): {
  totalInvoices: number;
  totalAmount: number;
  totalTVA: number;
  totalPaid: number;
  totalOutstanding: number;
  countByStatus: Record<string, number>;
  countByType: Record<string, number>;
  overdueCount: number;
  overdueAmount: number;
} {
  const now = new Date();
  let totalAmount = 0;
  let totalTVA = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let overdueCount = 0;
  let overdueAmount = 0;

  const countByStatus: Record<string, number> = {};
  const countByType: Record<string, number> = {};

  for (const inv of invoices) {
    totalAmount += inv.totals.totalWithTax;
    totalTVA += inv.totals.totalTVA;
    totalPaid += inv.totals.amountPaid;
    totalOutstanding += Math.max(0, inv.totals.amountDue);

    // Count by status
    countByStatus[inv.status] = (countByStatus[inv.status] || 0) + 1;

    // Count by type
    countByType[inv.invoiceType] = (countByType[inv.invoiceType] || 0) + 1;

    // Check overdue
    if (
      (inv.status === 'ISSUED' || inv.status === 'PARTIAL') &&
      inv.dueDate &&
      new Date(inv.dueDate) < now &&
      inv.totals.amountDue > 0
    ) {
      overdueCount++;
      overdueAmount += inv.totals.amountDue;
    }
  }

  return {
    totalInvoices: invoices.length,
    totalAmount: roundTVA(totalAmount),
    totalTVA: roundTVA(totalTVA),
    totalPaid: roundTVA(totalPaid),
    totalOutstanding: roundTVA(totalOutstanding),
    countByStatus,
    countByType,
    overdueCount,
    overdueAmount: roundTVA(overdueAmount),
  };
}

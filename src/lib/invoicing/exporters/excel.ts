// Excel Export for Invoices
// Generates structured spreadsheets compatible with accounting software

import { type InvoiceData, type TVARate, formatCurrency } from '../config';
import { roundTVA } from '../calculator';

// Excel export options
export interface ExcelExportOptions {
  includeFormulas?: boolean;
  separateSheets?: boolean;
  includeSummary?: boolean;
  includeTvaBreakdown?: boolean;
  sheetName?: string;
}

/**
 * Generate CSV content for invoice (simple export)
 */
export function generateInvoiceCSV(invoice: InvoiceData): string {
  const headers = [
    'N°',
    'Description',
    'Quantité',
    'Unité',
    'Prix Unitaire',
    'Remise %',
    'Montant Remise',
    'Taux TVA',
    'Base Imposable',
    'Montant TVA',
    'Total TTC',
  ];

  const rows = invoice.items.map((item, index) => [
    index + 1,
    `"${escapeCSV(item.description)}"`,
    item.quantity,
    item.unitOfMeasure || 'unité',
    item.unitPrice,
    item.discount,
    roundTVA((item.quantity * item.unitPrice * (item.discount || 0)) / 100),
    item.tvaRate === -1 ? 'Exonéré' : `${item.tvaRate}%`,
    item.taxableAmount,
    item.tvaAmount,
    item.lineTotalWithTax,
  ]);

  // Add totals row
  rows.push([
    '',
    'TOTAL',
    '',
    '',
    '',
    '',
    invoice.totals.discountAmount,
    '',
    invoice.totals.taxableBase,
    invoice.totals.totalTVA,
    invoice.totals.totalWithTax,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Generate Excel-compatible data structure for invoice
 * This can be used with libraries like xlsx or exceljs
 */
export function generateInvoiceExcelData(
  invoice: InvoiceData,
  options: ExcelExportOptions = {}
): {
  workbook: WorkbookData;
  filename: string;
} {
  const {
    separateSheets = true,
    includeSummary = true,
    includeTvaBreakdown = true,
  } = options;

  const workbook: WorkbookData = {
    sheets: {},
    properties: {
      title: `Facture ${invoice.invoiceNumber}`,
      author: 'AlgeriaTrade.dz',
      company: 'AlgeriaTrade SARL',
      created: new Date(),
    },
  };

  if (separateSheets) {
    // Main invoice sheet
    workbook.sheets['Facture'] = generateInvoiceSheet(invoice);

    // Items detail sheet
    workbook.sheets['Articles'] = generateItemsSheet(invoice);

    // TVA breakdown sheet
    if (includeTvaBreakdown) {
      workbook.sheets['TVA'] = generateTVASheet(invoice);
    }

    // Summary sheet
    if (includeSummary) {
      workbook.sheets['Résumé'] = generateSummarySheet(invoice);
    }
  } else {
    // Single combined sheet
    workbook.sheets['Facture'] = generateCombinedSheet(invoice);
  }

  return {
    workbook,
    filename: `Facture_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`,
  };
}

// Sheet generators
function generateInvoiceSheet(invoice: InvoiceData): SheetData {
  const headers = [
    ['FACTURE', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['Numéro:', invoice.invoiceNumber, '', 'Date:', formatDate(invoice.issueDate), ''],
    ['', '', '', '', '', ''],
    ['ÉMETTEUR', '', '', 'CLIENT', '', ''],
    [invoice.sellerInfo?.name || '', '', '', invoice.buyerInfo?.name || '', '', ''],
    [invoice.sellerInfo?.address || '', '', '', invoice.buyerInfo?.address || '', '', ''],
    [`NIF: ${invoice.sellerInfo?.nif || ''}`, '', '', `NIF: ${invoice.buyerInfo?.nif || '-'}`, '', ''],
    [`RC: ${invoice.sellerInfo?.rc || ''}`, '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['Détails de la facture', '', '', '', '', ''],
    ["Date d'émission:", formatDate(invoice.issueDate), '', "Date d'échéance:", invoice.dueDate ? formatDate(invoice.dueDate) : '-', ''],
    ['Conditions:', getPaymentTermLabel(invoice.paymentTerms as any), '', 'Devise:', invoice.currency, ''],
    ['Statut:', getStatusLabel(invoice.status), '', '', '', ''],
  ];

  return {
    headers,
    data: [],
    columns: [
      { width: 25 },
      { width: 20 },
      { width: 5 },
      { width: 25 },
      { width: 20 },
      { width: 15 },
    ],
    merges: [],
    styles: {
      titleRow: { font: { bold: true, size: 16 }, fill: { color: '006233' }, fontColor: 'FFFFFF' },
      headerRow: { font: { bold: true }, fill: { color: 'E8F5E9' } },
    },
  };
}

function generateItemsSheet(invoice: InvoiceData): SheetData {
  const headers = [
    ['N°', 'Description', 'Quantité', 'Unité', 'Prix Unit.', 'Remise %', 'Montant Remise', 'Taux TVA', 'Base Imposable', 'Montant TVA', 'Total TTC'],
  ];

  const data = invoice.items.map((item, index) => [
    index + 1,
    item.description,
    item.quantity,
    item.unitOfMeasure || 'unité',
    item.unitPrice,
    item.discount || 0,
    roundTVA((item.quantity * item.unitPrice * (item.discount || 0)) / 100),
    item.tvaRate === -1 ? 'Exonéré' : `${item.tvaRate}%`,
    item.taxableAmount,
    item.tvaAmount,
    item.lineTotalWithTax,
  ]);

  // Add totals row
  data.push(['', 'TOTAL', '', '', '', '', invoice.totals.discountAmount, '', invoice.totals.taxableBase, invoice.totals.totalTVA, invoice.totals.totalWithTax]);

  return {
    headers,
    data,
    columns: [
      { width: 5 },
      { width: 40 },
      { width: 10 },
      { width: 10 },
      { width: 15 },
      { width: 10 },
      { width: 15 },
      { width: 12 },
      { width: 18 },
      { width: 15 },
      { width: 15 },
    ],
    merges: [],
    styles: {
      headerRow: { font: { bold: true }, fill: { color: '006233' }, fontColor: 'FFFFFF' },
      totalRow: { font: { bold: true }, fill: { color: 'E8F5E9' } },
    },
  };
}

function generateTVASheet(invoice: InvoiceData): SheetData {
  const headers = [
    ['DÉTAIL TVA - Taxe sur la Valeur Ajoutée', '', '', ''],
    ['', '', '', ''],
    ['Taux TVA', 'Base Imposable', 'Montant TVA', 'Pourcentage du Total'],
  ];

  const data = invoice.totals.tvaBreakdown.map(entry => [
    entry.rate === -1 ? 'Exonéré' : `${entry.rate}%`,
    entry.taxableBase,
    entry.tvaAmount,
    invoice.totals.totalTVA > 0 
      ? roundTVA((entry.tvaAmount / invoice.totals.totalTVA) * 100)
      : 0,
  ]);

  data.push(['TOTAL', invoice.totals.taxableBase, invoice.totals.totalTVA, '100%']);

  return {
    headers,
    data,
    columns: [
      { width: 15 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
    ],
    merges: [['A1', 'D1']],
    styles: {
      titleRow: { font: { bold: true, size: 14 }, fill: { color: '006233' }, fontColor: 'FFFFFF' },
      headerRow: { font: { bold: true }, fill: { color: 'E3F2FD' } },
      totalRow: { font: { bold: true }, fill: { color: 'E3F2FD' } },
    },
  };
}

function generateSummarySheet(invoice: InvoiceData): SheetData {
  const headers = [
    ['RÉSUMÉ DE LA FACTURE', '', ''],
    ['', '', ''],
    ['Informations générales', '', ''],
    ['Numéro de facture', invoice.invoiceNumber, ''],
    ['Type', getInvoiceTypeLabel(invoice.invoiceType), ''],
    ['Statut', getStatusLabel(invoice.status), ''],
    ["Date d'émission", formatDate(invoice.issueDate), ''],
    ["Date d'échéance", invoice.dueDate ? formatDate(invoice.dueDate) : '-', ''],
    ['', '', ''],
    ['Montants', '', ''],
    ['Sous-total HT', invoice.totals.subtotal, invoice.currency],
    ['Remise totale', invoice.totals.discountAmount, invoice.currency],
    ['Base imposable', invoice.totals.taxableBase, invoice.currency],
    ['Total TVA', invoice.totals.totalTVA, invoice.currency],
    ['Total TTC', invoice.totals.totalWithTax, invoice.currency],
    ['', '', ''],
    ['Paiement', '', ''],
    ['Montant payé', invoice.totals.amountPaid, invoice.currency],
    ['Solde dû', Math.max(0, invoice.totals.amountDue), invoice.currency],
  ];

  return {
    headers,
    data: [],
    columns: [
      { width: 30 },
      { width: 20 },
      { width: 10 },
    ],
    merges: [['A1', 'C1']],
    styles: {
      titleRow: { font: { bold: true, size: 14 }, fill: { color: '006233' }, fontColor: 'FFFFFF' },
      sectionHeader: { font: { bold: true }, fill: { color: 'E8F5E9' } },
    },
  };
}

function generateCombinedSheet(invoice: InvoiceData): SheetData {
  // Combine all data into a single sheet
  const allHeaders = [
    ['FACTURE', invoice.invoiceNumber, '', "Date:", formatDate(invoice.issueDate), ''],
    ['', '', '', '', '', ''],
    ['ÉMETTEUR:', invoice.sellerInfo?.name || '', '', 'CLIENT:', invoice.buyerInfo?.name || '', ''],
    [invoice.sellerInfo?.address || '', '', '', invoice.buyerInfo?.address || '', '', ''],
    ['', '', '', '', '', ''],
    ['#', 'Description', 'Qté', 'P.U.', 'Remise', 'TVA', 'Base Imp.', 'TVA', 'Total TTC'],
  ];

  const itemsData = invoice.items.map((item, index) => [
    index + 1,
    item.description,
    item.quantity,
    item.unitPrice,
    item.discount || 0,
    item.tvaRate === -1 ? 'Ex.' : `${item.tvaRate}%`,
    item.taxableAmount,
    item.tvaAmount,
    item.lineTotalWithTax,
  ]);

  itemsData.push(['', 'TOTAL', '', '', '', '', invoice.totals.taxableBase, invoice.totals.totalTVA, invoice.totals.totalWithTax]);

  return {
    headers: allHeaders,
    data: itemsData,
    columns: [
      { width: 5 },
      { width: 35 },
      { width: 8 },
      { width: 12 },
      { width: 8 },
      { width: 8 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
    ],
    merges: [['A1', 'B1']],
    styles: {
      titleRow: { font: { bold: true, size: 16 }, fill: { color: '006233' }, fontColor: 'FFFFFF' },
      headerRow: { font: { bold: true }, fill: { color: 'E8F5E9' } },
      totalRow: { font: { bold: true }, fill: { color: 'E8F5E9' } },
    },
  };
}

// Type definitions for Excel structure
export interface ColumnDef {
  width?: number;
  header?: string;
}

export interface StyleDef {
  font?: {
    bold?: boolean;
    size?: number;
    color?: string;
  };
  fill?: {
    color: string;
  };
  fontColor?: string;
  alignment?: string;
  numberFormat?: string;
}

export interface SheetData {
  headers: any[][];
  data: any[][];
  columns: ColumnDef[];
  merges?: string[];
  styles?: {
    titleRow?: StyleDef;
    headerRow?: StyleDef;
    totalRow?: StyleDef;
    sectionHeader?: StyleDef;
  };
}

export interface WorkbookData {
  sheets: Record<string, SheetData>;
  properties?: {
    title?: string;
    author?: string;
    company?: string;
    created?: Date;
  };
}

// Helper functions
function escapeCSV(value: string): string {
  return value.replace(/"/g, '""');
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-DZ');
}

function getPaymentTermLabel(term: string): string {
  const labels: Record<string, string> = {
    immediate: 'Paiement immédiat',
    net30: 'Net 30 jours',
    net60: 'Net 60 jours',
    net90: 'Net 90 jours',
    endOfMonth: 'Fin de mois',
  };
  return labels[term] || term;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Brouillon',
    ISSUED: 'Émise',
    PAID: 'Payée',
    PARTIAL: 'Partielle',
    OVERDUE: 'En retard',
    CANCELLED: 'Annulée',
  };
  return labels[status] || status;
}

function getInvoiceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    STANDARD: 'Facture Standard',
    PROFORMA: 'Facture Proforma',
    CREDIT_NOTE: 'Note de Crédit (Avoir)',
    DEBIT_NOTE: 'Note de Débit',
  };
  return labels[type] || type;
}

/**
 * Generate multiple invoices to a single workbook
 */
export function generateMultipleInvoicesExcel(
  invoices: InvoiceData[],
  options: ExcelExportOptions = {}
): { workbook: WorkbookData; filename: string } {
  const workbook: WorkbookData = {
    sheets: {},
    properties: {
      title: 'Export Factures AlgeriaTrade',
      author: 'AlgeriaTrade.dz',
      created: new Date(),
    },
  };

  // Summary of all invoices
  const summaryHeaders = [
    ['N° Facture', 'Type', 'Client', 'Date', 'Échéance', 'Statut', 'HT', 'TVA', 'TTC', 'Payé', 'Reste'],
  ];
  
  const summaryData = invoices.map(inv => [
    inv.invoiceNumber,
    getInvoiceTypeLabel(inv.invoiceType),
    inv.buyerInfo?.name || '',
    formatDate(inv.issueDate),
    inv.dueDate ? formatDate(inv.dueDate) : '-',
    getStatusLabel(inv.status),
    inv.totals.subtotal,
    inv.totals.totalTVA,
    inv.totals.totalWithTax,
    inv.totals.amountPaid,
    Math.max(0, inv.totals.amountDue),
  ]);

  // Add totals row
  summaryData.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    invoices.reduce((sum, i) => sum + i.totals.subtotal, 0),
    invoices.reduce((sum, i) => sum + i.totals.totalTVA, 0),
    invoices.reduce((sum, i) => sum + i.totals.totalWithTax, 0),
    invoices.reduce((sum, i) => sum + i.totals.amountPaid, 0),
    invoices.reduce((sum, i) => sum + Math.max(0, i.totals.amountDue), 0),
  ]);

  workbook.sheets['Résumé'] = {
    headers: summaryHeaders,
    data: summaryData,
    columns: Array(11).fill({ width: 15 }),
    styles: {
      headerRow: { font: { bold: true }, fill: { color: '006233' }, fontColor: 'FFFFFF' },
      totalRow: { font: { bold: true }, fill: { color: 'E8F5E9' } },
    },
  };

  // Add individual invoice sheets (limit to prevent too many sheets)
  invoices.slice(0, 50).forEach((inv, index) => {
    const sheetName = `FAC${index + 1}`.slice(0, 31); // Excel sheet name limit
    workbook.sheets[sheetName] = generateCombinedSheet(inv);
  });

  return {
    workbook,
    filename: `Factures_AlgeriaTrade_${new Date().toISOString().split('T')[0]}.xlsx`,
  };
}

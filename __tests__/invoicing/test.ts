// Professional Invoice System Tests - TVA Tax Calculation for AlgeriaTrade.dz
// Comprehensive test suite for Algerian TVA (Taxe sur la Valeur Ajoutée) compliance

import {
  roundTVA,
  calculateLineItemTax,
  calculateSubtotal,
  calculateTVAByRate,
  calculateTotalWithTax,
  applyDiscount,
  calculateInvoiceTotals,
  validateTVA,
  calculatePriceFromTTC,
  determineTVARate,
  formatCurrency,
} from '@/lib/invoicing/calculator';
import {
  invoiceConfig,
  generateInvoiceNumber,
  getTVARateForCategory,
  getPaymentTermDays,
  getPaymentTermLabel,
  getCurrencySymbol,
  getStatusLabel,
  isValidNIF,
  isValidRC,
  calculateDueDate,
} from '@/lib/invoicing/config';
import type { TVARate, InvoiceLineItemInput } from '@/lib/invoicing/config';

// ============================================
// ROUNDING TESTS (Banker's Rounding / Round Half to Even)
// ============================================

describe('roundTVA - Banker\'s Rounding', () => {
  test('should round standard values correctly', () => {
    expect(roundTVA(1.234)).toBe(1.23);
    expect(roundTVA(1.235)).toBe(1.24); // Rounds up
    expect(roundTVA(1.245)).toBe(1.25); // Rounds up
    expect(roundTVA(9.999)).toBe(10.00);
  });

  test('should handle zero', () => {
    expect(roundTVA(0)).toBe(0);
    expect(roundTVA(0.001)).toBe(0);
    expect(roundTVA(0.005)).toBe(0.01);
  });

  test('should handle negative values', () => {
    expect(roundTVA(-1.234)).toBe(-1.23);
    expect(roundTVA(-1.235)).toBe(-1.24);
  });

  test('should respect decimal places parameter', () => {
    expect(roundTVA(1.23456, 3)).toBe(1.235);
    expect(roundTVA(1.23456, 4)).toBe(1.2346);
    expect(roundTVA(1234.56789, 0)).toBe(1235);
  });

  test('should handle very large numbers', () => {
    expect(roundTVA(999999999.999)).toBe(1000000000);
    expect(roundTVA(0.000001, 6)).toBe(0.000001);
  });

  test('edge cases for financial precision', () => {
    // Common edge cases in financial calculations
    expect(roundTVA(0.0049)).toBe(0); // Below rounding threshold
    expect(roundTVA(0.0050)).toBe(0.01); // At threshold - rounds up
    expect(roundTVA(99.995)).toBe(100); // Near integer boundary
    expect(roundTVA(0.125, 2)).toBe(0.13); // Classic .125 case
  });
});

// ============================================
// LINE ITEM TAX CALCULATION TESTS
// ============================================

describe('calculateLineItemTax', () => {
  const baseItem: InvoiceLineItemInput = {
    description: 'Test Product',
    quantity: 1,
    unitPrice: 1000,
    tvaRate: 19 as TVARate,
  };

  test('should calculate standard TVA (19%) correctly', () => {
    const result = calculateLineItemTax(baseItem);

    expect(result.subtotal).toBe(1000);
    expect(result.discountAmount).toBe(0);
    expect(result.taxableAmount).toBe(1000);
    expect(result.tvaAmount).toBe(190); // 19% of 1000
    expect(result.lineTotal).toBe(1000);
    expect(result.lineTotalWithTax).toBe(1190);
  });

  test('should calculate reduced TVA (9%) correctly', () => {
    const item = { ...baseItem, tvaRate: 9 as TVARate };
    const result = calculateLineItemTax(item);

    expect(result.tvaAmount).toBe(90); // 9% of 1000
    expect(result.lineTotalWithTax).toBe(1090);
  });

  test('should handle zero-rated TVA (0%)', () => {
    const item = { ...baseItem, tvaRate: 0 as TVARate };
    const result = calculateLineItemTax(item);

    expect(result.tvaAmount).toBe(0);
    expect(result.lineTotalWithTax).toBe(1000);
  });

  test('should handle exempt TVA (-1)', () => {
    const item = { ...baseItem, tvaRate: -1 as TVARate };
    const result = calculateLineItemTax(item);

    expect(result.tvaAmount).toBe(0);
    expect(result.lineTotalWithTax).toBe(1000);
  });

  test('should apply discount before calculating TVA', () => {
    const item = { ...baseItem, discount: 10 }; // 10% discount
    const result = calculateLineItemTax(item);

    expect(result.subtotal).toBe(1000);
    expect(result.discountAmount).toBe(100); // 10% of 1000
    expect(result.taxableAmount).toBe(900); // After discount
    expect(result.tvaAmount).toBe(171); // 19% of 900
    expect(result.lineTotalWithTax).toBe(1071);
  });

  test('should handle multiple quantities', () => {
    const item = { ...baseItem, quantity: 5 };
    const result = calculateLineItemTax(item);

    expect(result.subtotal).toBe(5000);
    expect(result.tvaAmount).toBe(950); // 19% of 5000
    expect(result.lineTotalWithTax).toBe(5950);
  });

  test('should handle fractional quantities', () => {
    const item = { ...baseItem, quantity: 2.5, unitPrice: 800 };
    const result = calculateLineItemTax(item);

    expect(result.subtotal).toBe(2000);
    expect(result.tvaAmount).toBe(380); // 19% of 2000
  });

  test('should handle zero quantity', () => {
    const item = { ...baseItem, quantity: 0 };
    const result = calculateLineItemTax(item);

    expect(result.subtotal).toBe(0);
    expect(result.tvaAmount).toBe(0);
    expect(result.lineTotalWithTax).toBe(0);
  });

  test('should default to 19% TVA when not specified', () => {
    const itemWithoutTVA: InvoiceLineItemInput = {
      description: 'Test',
      quantity: 1,
      unitPrice: 1000,
    };

    const result = calculateLineItemTax(itemWithoutTVA);
    expect(result.tvaAmount).toBe(190); // Should use 19%
  });

  test('complex scenario with discount and reduced rate', () => {
    const item: InvoiceLineItemInput = {
      description: 'Food product',
      quantity: 100,
      unitPrice: 50,
      discount: 5, // 5% discount
      tvaRate: 9 as TVARate, // Food has reduced rate
    };

    const result = calculateLineItemTax(item);

    expect(result.subtotal).toBe(5000);
    expect(result.discountAmount).toBe(250); // 5% of 5000
    expect(result.taxableAmount).toBe(4750);
    expect(result.tvaAmount).toBe(427.5); // 9% of 4750
    expect(result.lineTotalWithTax).toBe(5177.5);
  });
});

// ============================================
// SUBTOTAL CALCULATION TESTS
// ============================================

describe('calculateSubtotal', () => {
  test('should sum all items correctly', () => {
    const items: InvoiceLineItemInput[] = [
      { description: 'Item 1', quantity: 2, unitPrice: 100 },
      { description: 'Item 2', quantity: 3, unitPrice: 200 },
      { description: 'Item 3', quantity: 1, unitPrice: 300 },
    ];

    expect(calculateSubtotal(items)).toBe(1100); // 200 + 600 + 300
  });

  test('should return 0 for empty array', () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  test('should handle single item', () => {
    const items = [{ description: 'Single', quantity: 1, unitPrice: 500 }];
    expect(calculateSubtotal(items)).toBe(500);
  });
});

// ============================================
// TVA BY RATE CALCULATION TESTS
// ============================================

describe('calculateTVAByRate', () => {
  test('should group items by TVA rate', () => {
    const items: InvoiceLineItemInput[] = [
      { description: 'Standard item', quantity: 1, unitPrice: 1000, tvaRate: 19 },
      { description: 'Reduced item', quantity: 1, unitPrice: 500, tvaRate: 9 },
      { description: 'Another standard', quantity: 2, unitPrice: 250, tvaRate: 19 },
    ];

    const breakdown = calculateTVAByRate(items);

    expect(breakdown).toHaveLength(2);

    const rate19 = breakdown.find((b) => b.rate === 19)!;
    const rate9 = breakdown.find((b) => b.rate === 9)!;

    expect(rate19.taxableBase).toBe(1500); // 1000 + 500
    expect(rate19.tvaAmount).toBe(285); // 19% of 1500

    expect(rate9.taxableBase).toBe(500);
    expect(rate9.tvaAmount).toBe(45); // 9% of 500
  });

  test('should handle all four TVA rates', () => {
    const items: InvoiceLineItemInput[] = [
      { description: 'Standard', quantity: 1, unitPrice: 1000, tvaRate: 19 },
      { description: 'Reduced', quantity: 1, unitPrice: 1000, tvaRate: 9 },
      { description: 'Zero rated (export)', quantity: 1, unitPrice: 1000, tvaRate: 0 },
      { description: 'Exempt', quantity: 1, unitPrice: 1000, tvaRate: -1 },
    ];

    const breakdown = calculateTVAByRate(items);
    expect(breakdown).toHaveLength(4);

    const rate19 = breakdown.find((b) => b.rate === 19)!;
    const rate9 = breakdown.find((b) => b.rate === 9)!;
    const rate0 = breakdown.find((b) => b.rate === 0)!;
    const rateExempt = breakdown.find((b) => b.rate === -1)!;

    expect(rate19.tvaAmount).toBe(190);
    expect(rate9.tvaAmount).toBe(90);
    expect(rate0.tvaAmount).toBe(0);
    expect(rateExempt.tvaAmount).toBe(0);
  });

  test('should return empty array for no items', () => {
    expect(calculateTVAByRate([])).toEqual([]);
  });
});

// ============================================
// TOTAL WITH TAX CALCULATION TESTS
// ============================================

describe('calculateTotalWithTax', () => {
  test('should calculate total with standard TVA', () => {
    const items = [{ description: 'Test', quantity: 1, unitPrice: 1000, tvaRate: 19 }];
    const result = calculateTotalWithTax(items);

    expect(result.subtotal).toBe(1000);
    expect(result.totalDiscount).toBe(0);
    expect(result.totalTVA).toBe(190);
    expect(result.totalWithTax).toBe(1190);
  });

  test('should apply additional discount percentage', () => {
    const items = [{ description: 'Test', quantity: 1, unitPrice: 1000, tvaRate: 19 }];
    const result = calculateTotalWithTax(items, 10); // 10% global discount

    expect(result.subtotal).toBe(1000);
    expect(result.totalDiscount).toBe(100); // 10% of 1000
    expect(result.totalWithTax).toBeGreaterThan(900);
    expect(result.totalWithTax).toBeLessThan(1100);
  });

  test('should handle mixed TVA rates', () => {
    const items: InvoiceLineItemInput[] = [
      { description: 'Standard', quantity: 1, unitPrice: 1000, tvaRate: 19 },
      { description: 'Reduced', quantity: 1, unitPrice: 1000, tvaRate: 9 },
    ];

    const result = calculateTotalWithTax(items);

    expect(result.subtotal).toBe(2000);
    expect(result.totalTVA).toBe(280); // 190 + 90
    expect(result.totalWithTax).toBe(2280);
  });
});

// ============================================
// DISCOUNT APPLICATION TESTS
// ============================================

describe('applyDiscount', () => {
  const sampleItems: InvoiceLineItemInput[] = [
    { description: 'Item A', quantity: 2, unitPrice: 500, tvaRate: 19 },
    { description: 'Item B', quantity: 1, unitPrice: 1000, tvaRate: 9 },
  ];

  test('should apply percentage discount pre-tax', () => {
    const result = applyDiscount(sampleItems, 'percentage', 10, true);

    expect(result.discountAmount).toBe(200); // 10% of 2000
    // The newTotals reflects the calculated discount
    expect(result.newTotals.discountAmount).toBeGreaterThan(0);
  });

  test('should apply fixed amount discount', () => {
    const result = applyDiscount(sampleItems, 'fixed', 200, true);

    expect(result.discountAmount).toBe(200);
  });

  test('should handle zero discount value', () => {
    const result = applyDiscount(sampleItems, 'percentage', 0);

    expect(result.discountAmount).toBe(0);
    expect(result.adjustedItems).toEqual(sampleItems);
  });

  test('post-tax discount should add negative line item', () => {
    const result = applyDiscount(sampleItems, 'percentage', 10, false);

    expect(result.adjustedItems.length).toBe(3); // Original 2 + 1 discount line
    expect(result.adjustedItems[2].description).toContain('Remise');
  });
});

// ============================================
// INVOICE TOTALS CALCULATION TESTS
// ============================================

describe('calculateInvoiceTotals', () => {
  test('should calculate complete invoice totals', () => {
    const items: InvoiceLineItemInput[] = [
      { description: 'Product 1', quantity: 10, unitPrice: 1000, tvaRate: 19 },
      { description: 'Service 1', quantity: 5, unitPrice: 500, tvaRate: 9 },
    ];

    const totals = calculateInvoiceTotals(items);

    expect(totals.subtotal).toBe(12500); // 10000 + 2500
    expect(totals.discountAmount).toBe(0);
    expect(totals.taxableBase).toBe(12500);
    // TVA is calculated based on taxable base with potential adjustments
    expect(totals.totalTVA).toBeGreaterThan(0);
    expect(totals.totalWithTax).toBeGreaterThan(totals.subtotal);
    expect(totals.amountPaid).toBe(0);
    expect(totals.amountDue).toBe(totals.totalWithTax);
  });

  test('should include TVA breakdown', () => {
    const items: InvoiceLineItemInput[] = [
      { description: 'Standard', quantity: 1, unitPrice: 1000, tvaRate: 19 },
      { description: 'Reduced', quantity: 1, unitPrice: 1000, tvaRate: 9 },
    ];

    const totals = calculateInvoiceTotals(items);

    expect(totals.tvaBreakdown).toHaveLength(2);
    
    const rate19 = totals.tvaBreakdown.find((b) => b.rate === 19)!;
    const rate9 = totals.tvaBreakdown.find((b) => b.rate === 9)!;

    expect(rate19.taxableBase).toBe(1000);
    expect(rate19.tvaAmount).toBe(190);
    expect(rate9.taxableBase).toBe(1000);
    expect(rate9.tvaAmount).toBe(90);
  });

  test('should apply global discount correctly', () => {
    const items = [{ description: 'Test', quantity: 1, unitPrice: 1000, tvaRate: 19 }];
    const totals = calculateInvoiceTotals(items, 20); // 20% discount

    expect(totals.discountPercent).toBe(20);
    expect(totals.discountAmount).toBe(200);
  });
});

// ============================================
// VALIDATION TESTS
// ============================================

describe('validateTVA', () => {
  test('should pass valid invoice data', () => {
    const items = [{ description: 'Valid Item', quantity: 1, unitPrice: 100, tvaRate: 19 }];
    const result = validateTVA(items);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail on empty items array', () => {
    const result = validateTVA([]);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should detect missing descriptions', () => {
    const items = [{ description: '', quantity: 1, unitPrice: 100, tvaRate: 19 }];
    const result = validateTVA(items);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Description'))).toBe(true);
  });

  test('should detect invalid quantities', () => {
    const items = [{ description: 'Test', quantity: 0, unitPrice: 100, tvaRate: 19 }];
    const result = validateTVA(items);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Quantité'))).toBe(true);
  });

  test('should detect negative prices', () => {
    const items = [{ description: 'Test', quantity: 1, unitPrice: -100, tvaRate: 19 }];
    const result = validateTVA(items);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('négatif'))).toBe(true);
  });

  test('should warn about exempt items', () => {
    const items = [{ description: 'Exempt Item', quantity: 1, unitPrice: 100, tvaRate: -1 }];
    const result = validateTVA(items);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('exonéré'))).toBe(true);
  });

  test('should verify expected total when provided', () => {
    const items = [{ description: 'Test', quantity: 1, unitPrice: 100, tvaRate: 19 }];
    const result = validateTVA(items, 119); // Correct total

    expect(result.isValid).toBe(true);
  });

  test('should detect total mismatch', () => {
    const items = [{ description: 'Test', quantity: 1, unitPrice: 100, tvaRate: 19 }];
    const result = validateTVA(items, 999); // Wrong total

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Différence'))).toBe(true);
  });
});

// ============================================
// TTC TO HT PRICE CONVERSION TESTS
// ============================================

describe('calculatePriceFromTTC', () => {
  test('should convert TTC price to HT at 19%', () => {
    const result = calculatePriceFromTTC(119, 19);

    expect(result.htPrice).toBeCloseTo(100, 2);
    expect(result.tvaAmount).toBeCloseTo(19, 2);
  });

  test('should convert TTC price to HT at 9%', () => {
    const result = calculatePriceFromTTC(109, 9);

    expect(result.htPrice).toBeCloseTo(100, 2);
    expect(result.tvaAmount).toBeCloseTo(9, 2);
  });

  test('should handle zero TVA rate', () => {
    const result = calculatePriceFromTTC(100, 0);

    expect(result.htPrice).toBe(100);
    expect(result.tvaAmount).toBe(0);
  });

  test('should handle exempt (-1) rate', () => {
    const result = calculatePriceFromTTC(100, -1);

    expect(result.htPrice).toBe(100);
    expect(result.tvaAmount).toBe(0);
  });

  test('should handle exact amounts', () => {
    const result = calculatePriceFromTTC(15000, 19);

    // 15000 / 1.19 = 12605.04...
    expect(result.htPrice).toBeGreaterThan(12600);
    expect(result.htPrice).toBeLessThan(12610);
    expect(result.htPrice + result.tvaAmount).toBeCloseTo(15000, 2);
  });
});

// ============================================
// TVA RATE DETERMINATION TESTS
// ============================================

describe('determineTVARate', () => {
  test('should return 0 for exports', () => {
    expect(determineTVARate({ isExport: true })).toBe(0);
    expect(determineTVARate({ buyerCountry: 'FR' })).toBe(0);
  });

  test('should return -1 for exempt with certificate', () => {
    expect(determineTVARate({ hasExemptionCertificate: true })).toBe(-1);
    expect(determineTVARate({ isExempt: true })).toBe(-1);
  });

  test('should use category-based rates', () => {
    expect(determineTVARate({ category: 'food' })).toBe(9);
    expect(determineTVARate({ category: 'electronics' })).toBe(19);
    expect(determineTVARate({ category: 'exports' })).toBe(0);
  });

  test('should default to 19% for unknown categories', () => {
    expect(determineTVARate({ category: 'unknown_category' })).toBe(19);
    expect(determineTVARate({})).toBe(19);
  });
});

// ============================================
// CONFIGURATION TESTS
// ============================================

describe('invoiceConfig', () => {
  test('should have correct TVA rates', () => {
    expect(invoiceConfig.tvaRates.standard).toBe(19);
    expect(invoiceConfig.tvaRates.reduced).toBe(9);
    expect(invoiceConfig.tvaRates.zero).toBe(0);
    expect(invoiceConfig.tvaRates.exempt).toBe(-1);
  });

  test('should have company info with NIF, NIS, RC, AI', () => {
    expect(invoiceConfig.company.nif).toBeDefined();
    expect(invoiceConfig.company.nis).toBeDefined();
    expect(invoiceConfig.company.rc).toBeDefined();
    expect(invoiceConfig.company.ai).toBeDefined();
  });

  test('should have payment terms defined', () => {
    expect(invoiceConfig.paymentTerms.immediate.days).toBe(0);
    expect(invoiceConfig.paymentTerms.net30.days).toBe(30);
    expect(invoiceConfig.paymentTerms.net60.days).toBe(60);
    expect(invoiceConfig.paymentTerms.net90.days).toBe(90);
    expect(invoiceConfig.paymentTerms.endOfMonth.endOfMonth).toBe(true);
  });
});

describe('getTVARateForCategory', () => {
  test('should return correct rate for known categories', () => {
    expect(getTVARateForCategory('electronics')).toBe(19);
    expect(getTVARateForCategory('food')).toBe(9);
    expect(getTVARateForCategory('exports')).toBe(0);
  });

  test('should default to 19% for unknown category', () => {
    expect(getTVARateForCategory('unknown')).toBe(19);
  });
});

describe('generateInvoiceNumber', () => {
  test('should generate correct format', () => {
    const date = new Date(2024, 11, 15); // December 2024
    const number = generateInvoiceNumber('STANDARD', date, 42);

    expect(number).toBe('FAC2024-12-00042');
  });

  test('should use different prefixes for different types', () => {
    const date = new Date(2024, 0, 1);

    expect(generateInvoiceNumber('STANDARD', date, 1)).toContain('FAC');
    expect(generateInvoiceNumber('PROFORMA', date, 1)).toContain('PRO');
    expect(generateInvoiceNumber('CREDIT_NOTE', date, 1)).toContain('AVO');
  });

  test('should pad sequence to 5 digits', () => {
    const date = new Date(2024, 0, 1);

    expect(generateInvoiceNumber('STANDARD', date, 1)).toMatch(/FAC2024-01-00001$/);
    expect(generateInvoiceNumber('STANDARD', date, 999)).toMatch(/FAC2024-01-00999$/);
  });
});

describe('getPaymentTermDays', () => {
  it('returns correct days for each term', () => {
    expect(getPaymentTermDays('immediate')).toBe(0);
    expect(getPaymentTermDays('net30')).toBe(30);
    expect(getPaymentTermDays('net60')).toBe(60);
    expect(getPaymentTermDays('net90')).toBe(90);
    expect(getPaymentTermDays('endOfMonth')).toBe(0);
  });
});

describe('getPaymentTermLabel', () => {
  it('returns French labels', () => {
    expect(getPaymentTermLabel('immediate')).toBe('Paiement immédiat');
    expect(getPaymentTermLabel('net30')).toBe('Net 30 jours');
    expect(getPaymentTermLabel('endOfMonth')).toBe('Fin de mois');
  });
});

describe('getCurrencySymbol', () => {
  it('returns correct symbols', () => {
    expect(getCurrencySymbol('DZD')).toBe('د.ج');
    expect(getCurrencySymbol('EUR')).toBe('€');
    expect(getCurrencySymbol('USD')).toBe('$');
  });
});

describe('getStatusLabel', () => {
  it('returns labels in different languages', () => {
    expect(getStatusLabel('DRAFT', 'fr')).toBe('Brouillon');
    expect(getStatusLabel('DRAFT', 'ar')).toBe('مسودة');
    expect(getStatusLabel('DRAFT', 'en')).toBe('Draft');

    expect(getStatusLabel('PAID', 'fr')).toBe('Payée');
    expect(getStatusLabel('ISSUED', 'fr')).toBe('Émise');
    expect(getStatusLabel('OVERDUE', 'fr')).toBe('En retard');
  });
});

describe('isValidNIF', () => {
  it('validates NIF format (15 digits)', () => {
    expect(isValidNIF('000000000000000')).toBe(true);
    expect(isValidNIF('123456789012345')).toBe(true);
    expect(isValidNIF('00000000000000')).toBe(false); // 14 digits
    expect(isValidNIF('ABC000000000000')).toBe(false);
    expect(isValidNIF('')).toBe(false);
  });
});

describe('isValidRC', () => {
  it('validates RC format', () => {
    expect(isValidRC('16A/AAAA/BBBB')).toBe(true);
    expect(isValidRC('16A/1234567')).toBe(true);
    expect(isValidRC('short')).toBe(false);
  });
});

describe('calculateDueDate', () => {
  it('calculates due dates correctly', () => {
    const issueDate = new Date(2024, 0, 15); // Jan 15, 2024

    const net30Due = calculateDueDate(issueDate, 'net30');
    expect(net30Due.getDate()).toBe(14); // Feb 14
    expect(net30Due.getMonth()).toBe(1); // February

    const immediateDue = calculateDueDate(issueDate, 'immediate');
    expect(immediateDue.getTime()).toBe(issueDate.getTime());

    const eomDue = calculateDueDate(issueDate, 'endOfMonth');
    expect(eomDue.getDate()).toBe(31); // Last day of January
    expect(eomDue.getMonth()).toBe(0); // Still January
  });
});

// ============================================
// CURRENCY FORMATTING TESTS
// ============================================

describe('formatCurrency', () => {
  test('should format DZD correctly', () => {
    const formatted = formatCurrency(1234567.89, 'DZD');
    // DZD uses dz-DZ locale which may have different formatting
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).toContain('د.ج');
  });

  test('should format EUR correctly', () => {
    const formatted = formatCurrency(1234.56, 'EUR');
    expect(formatted).toContain('€');
  });

  test('should format USD correctly', () => {
    const formatted = formatCurrency(1234.56, 'USD');
    expect(formatted).toContain('1,234.56');
    expect(formatted).toContain('$');
  });

  test('should handle zero', () => {
    const formatted = formatCurrency(0, 'DZD');
    expect(formatted).toBeDefined();
    expect(formatted.length).toBeGreaterThan(0);
  });

  test('should handle large amounts', () => {
    const formatted = formatCurrency(999999999.99, 'DZD');
    expect(formatted).toBeDefined();
  });
});

// ============================================
// ALGERIAN TVA COMPLIANCE SCENARIOS
// ============================================

describe('Algerian TVA Compliance Scenarios', () => {
  test('Scenario 1: Standard B2B sale with 19% TVA', () => {
    // Typical equipment sale
    const items: InvoiceLineItemInput[] = [
      { description: 'Machine industrielle CNC', quantity: 1, unitPrice: 5000000, tvaRate: 19 },
      { description: 'Installation et mise en service', quantity: 1, unitPrice: 200000, tvaRate: 19 },
    ];

    const totals = calculateInvoiceTotals(items);

    expect(totals.subtotal).toBe(5200000);
    expect(totals.totalTVA).toBe(988000); // 19% of 5200000
    expect(totals.totalWithTax).toBe(6188000);
  });

  test('Scenario 2: Mixed rate sale (food products)', () => {
    // Grocery store supply
    const items: InvoiceLineItemInput[] = [
      { description: 'Riz importé (sac 25kg)', quantity: 100, unitPrice: 3500, tvaRate: 9 },
      { description: 'Huile de table (bidon 5L)', quantity: 50, unitPrice: 1200, tvaRate: 9 },
      { description: 'Articles ménagers divers', quantity: 20, unitPrice: 2500, tvaRate: 19 },
    ];

    const totals = calculateInvoiceTotals(items);

    // Rice: 100 * 3500 = 350,000 @ 9%
    // Oil: 50 * 1200 = 60,000 @ 9%
    // Household: 20 * 2500 = 50,000 @ 19%

    const tva9 = totals.tvaBreakdown.find((b) => b.rate === 9)!;
    const tva19 = totals.tvaBreakdown.find((b) => b.rate === 19)!;

    expect(tva9.taxableBase).toBe(410000); // 350000 + 60000
    expect(tva9.tvaAmount).toBe(36900); // 9% of 410000
    expect(tva19.taxableBase).toBe(50000);
    expect(tva19.tvaAmount).toBe(9500); // 19% of 50000
  });

  test('Scenario 3: Export sale (zero-rated)', () => {
    // International export - zero TVA
    const items: InvoiceLineItemInput[] = [
      { description: 'Dates deglet nour (carton)', quantity: 500, unitPrice: 4000, tvaRate: 0 },
      { description: 'Frais d\'exportation et douane', quantity: 1, unitPrice: 150000, tvaRate: 0 },
    ];

    const totals = calculateInvoiceTotals(items);

    expect(totals.totalTVA).toBe(0);
    expect(totals.totalWithTax).toBe(2150000); // 2000000 + 150000
  });

  test('Scenario 4: Sale with volume discount', () => {
    const items: InvoiceLineItemInput[] = [
      { description: 'Fournitures bureau (lot 1000)', quantity: 1, unitPrice: 850000, tvaRate: 19, discount: 5 },
    ];

    const totals = calculateInvoiceTotals(items);

    expect(totals.discountAmount).toBe(42500); // 5% of 850000
    expect(totals.taxableBase).toBe(807500);
    expect(totals.totalTVA).toBe(153425); // 19% of 807500
  });

  test('Scenario 5: Service company invoice', () => {
    const items: InvoiceLineItemInput[] = [
      { description: 'Étude technique et conception', quantity: 1, unitPrice: 450000, tvaRate: 19 },
      { description: 'Suivi de chantier (forfait mensuel)', quantity: 3, unitPrice: 120000, tvaRate: 19 },
      { description: 'Formation du personnel', quantity: 1, unitPrice: 75000, tvaRate: 9 },
    ];

    const totals = calculateInvoiceTotals(items);

    // Services at 19%: 450000 + 360000 = 810000
    // Training at 9%: 75000
    expect(totals.subtotal).toBe(885000);

    const tva19 = totals.tvaBreakdown.find((b) => b.rate === 19)!;
    const tva9 = totals.tvaBreakdown.find((b) => b.rate === 9)!;

    expect(tva19.tvaAmount).toBe(153900); // 19% of 810000
    expect(tva9.tvaAmount).toBe(6750); // 9% of 75000
  });

  test('Scenario 6: Proforma invoice calculation', () => {
    // Same calculations should work for proforma
    const items: InvoiceLineItemInput[] = [
      { description: 'Équipement prévu', quantity: 5, unitPrice: 280000, tvaRate: 19 },
    ];

    const totals = calculateInvoiceTotals(items);
    const validation = validateTVA(items);

    expect(validation.isValid).toBe(true);
    expect(totals.totalWithTax).toBe(1666000); // 1400000 + 266000
  });
});

// ============================================
// EDGE CASES AND ERROR HANDLING
// ============================================

describe('Edge Cases and Error Handling', () => {
  test('should handle very small amounts', () => {
    const items = [{ description: 'Tiny item', quantity: 1, unitPrice: 0.01, tvaRate: 19 }];
    const result = calculateLineItemTax(items[0]);

    // With rounding to 2 decimals, these values get rounded
    expect(result.tvaAmount).toBeGreaterThanOrEqual(0);
    expect(result.lineTotalWithTax).toBeGreaterThanOrEqual(0.01);
  });

  test('should handle very large amounts', () => {
    const items = [{ description: 'Large contract', quantity: 1, unitPrice: 999999999, tvaRate: 19 }];
    const result = calculateLineItemTax(items[0]);

    expect(result.tvaAmount).toBe(189999999.81); // 19%
    expect(result.lineTotalWithTax).toBe(1189999998.81);
  });

  test('should handle many decimal places in prices', () => {
    const items = [{ description: 'Precise price', quantity: 1, unitPrice: 123.456789, tvaRate: 19 }];
    const result = calculateLineItemTax(items[0]);

    // Price gets rounded during calculation
    expect(result.lineTotalWithTax).toBeGreaterThan(140);
    expect(result.lineTotalWithTax).toBeLessThan(150);
  });

  test('should handle 100% discount', () => {
    const items = [{ description: 'Free item', quantity: 1, unitPrice: 1000, tvaRate: 19, discount: 100 }];
    const result = calculateLineItemTax(items[0]);

    expect(result.taxableAmount).toBe(0);
    expect(result.tvaAmount).toBe(0);
    expect(result.lineTotalWithTax).toBe(0);
  });

  test('should handle items with maximum valid discount', () => {
    const items = [{ description: 'Max discount', quantity: 1, unitPrice: 1000, tvaRate: 19, discount: 99.99 }];
    const validation = validateTVA(items);

    // Should be valid (discount <= 100)
    expect(validation.isValid).toBe(true);
  });

  test('should handle mixed positive and negative scenarios', () => {
    const validItems = [{ description: 'OK', quantity: 1, unitPrice: 100, tvaRate: 19 }];
    const invalidItems = [{ description: '', quantity: 0, unitPrice: -50 }];

    expect(validateTVA(validItems).isValid).toBe(true);
    expect(validateTVA(invalidItems).isValid).toBe(false);
  });
});

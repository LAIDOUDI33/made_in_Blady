// TVA (Taxe sur la Valeur Ajoutée) Calculation Engine
// Compliant with Algerian Tax Regulations

import {
  type TVARate,
  type InvoiceLineItemInput,
  type InvoiceLineItem,
  type TVABreakdownEntry,
  type InvoiceTotals,
  invoiceConfig,
} from './config';

/**
 * Round to nearest cent according to Algerian regulations
 * Uses standard rounding (half up)
 */
export function roundTVA(amount: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor) / factor;
}

/**
 * Calculate TVA for a single line item
 */
export function calculateLineItemTax(item: InvoiceLineItemInput): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  tvaAmount: number;
  lineTotal: number;
  lineTotalWithTax: number;
} {
  const quantity = Number(item.quantity) || 0;
  const unitPrice = Number(item.unitPrice) || 0;
  const discount = Number(item.discount || 0);
  const tvaRate = (item.tvaRate ?? 19) as TVARate;

  // Calculate subtotal before discount
  const subtotal = quantity * unitPrice;

  // Calculate discount amount
  const discountAmount = roundTVA((subtotal * discount) / 100);

  // Taxable amount after discount
  const taxableAmount = roundTVA(subtotal - discountAmount);

  // Calculate TVA (-1 means exempt, 0 means zero-rated)
  let tvaAmount = 0;
  if (tvaRate > 0) {
    tvaAmount = roundTVA((taxableAmount * tvaRate) / 100);
  }

  // Line total without tax
  const lineTotal = taxableAmount;

  // Line total with tax
  const lineTotalWithTax = roundTVA(taxableAmount + tvaAmount);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    tvaAmount,
    lineTotal,
    lineTotalWithTax,
  };
}

/**
 * Calculate subtotal of all line items
 */
export function calculateSubtotal(items: InvoiceLineItemInput[]): number {
  let subtotal = 0;
  
  for (const item of items) {
    const calc = calculateLineItemTax(item);
    subtotal += calc.subtotal;
  }
  
  return roundTVA(subtotal);
}

/**
 * Group and calculate TVA by rate
 */
export function calculateTVAByRate(items: InvoiceLineItemInput[]): TVABreakdownEntry[] {
  const rateMap = new Map<TVARate, { base: number; amount: number }>();

  for (const item of items) {
    const calc = calculateLineItemTax(item);
    const rate = (item.tvaRate ?? 19) as TVARate;

    if (!rateMap.has(rate)) {
      rateMap.set(rate, { base: 0, amount: 0 });
    }

    const entry = rateMap.get(rate)!;
    entry.base += calc.taxableAmount;
    entry.amount += calc.tvaAmount;
  }

  // Convert map to array with rounded values
  return Array.from(rateMap.entries()).map(([rate, value]) => ({
    rate,
    taxableBase: roundTVA(value.base),
    tvaAmount: roundTVA(value.amount),
  }));
}

/**
 * Calculate total invoice including all taxes
 */
export function calculateTotalWithTax(
  items: InvoiceLineItemInput[],
  additionalDiscountPercent: number = 0
): {
  subtotal: number;
  totalDiscount: number;
  totalTVA: number;
  totalWithTax: number;
} {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTVA = 0;

  for (const item of items) {
    const calc = calculateLineItemTax(item);
    subtotal += calc.subtotal;
    totalDiscount += calc.discountAmount;
    totalTVA += calc.tvaAmount;
  }

  // Apply additional discount on subtotal if provided
  let finalSubtotal = roundTVA(subtotal - totalDiscount);
  if (additionalDiscountPercent > 0) {
    const additionalDiscount = roundTVA((finalSubtotal * additionalDiscountPercent) / 100);
    totalDiscount += additionalDiscount;
    finalSubtotal = roundTVA(finalSubtotal - additionalDiscount);
    
    // Recalculate TVA after additional discount
    totalTVA = 0;
    for (const item of items) {
      const calc = calculateLineItemTax({
        ...item,
        unitPrice: (Number(item.unitPrice) * (100 - additionalDiscountPercent)) / 100,
      });
      totalTVA += calc.tvaAmount;
    }
  }

  const totalWithTax = roundTVA(finalSubtotal + totalTVA);

  return {
    subtotal: roundTVA(subtotal),
    totalDiscount: roundTVA(totalDiscount),
    totalTVA: roundTVA(totalTVA),
    totalWithTax,
  };
}

/**
 * Apply discount to invoice totals
 * Supports pre-tax and post-tax discounts
 */
export function applyDiscount(
  items: InvoiceLineItemInput[],
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  applyBeforeTax: boolean = true
): {
  adjustedItems: InvoiceLineItemInput[];
  discountAmount: number;
  newTotals: InvoiceTotals;
} {
  if (discountValue <= 0) {
    return {
      adjustedItems: items,
      discountAmount: 0,
      newTotals: calculateInvoiceTotals(items, 0),
    };
  }

  let adjustedItems: InvoiceLineItemInput[];
  let discountAmount: number;

  if (discountType === 'percentage') {
    if (applyBeforeTax) {
      // Distribute discount proportionally across items
      const subtotal = calculateSubtotal(items);
      const totalDiscount = roundTVA((subtotal * discountValue) / 100);

      adjustedItems = items.map((item) => {
        const itemSubtotal = Number(item.quantity) * Number(item.unitPrice);
        const itemDiscountProportion = itemSubtotal / subtotal;
        const itemAdditionalDiscount = (item.discount || 0) + (discountValue * itemDiscountProportion);
        
        return {
          ...item,
          discount: roundTVA(itemAdditionalDiscount),
        };
      });

      discountAmount = totalDiscount;
    } else {
      // Post-tax discount - add as a negative line item
      adjustedItems = [
        ...items,
        {
          description: `Remise globale (${discountValue}%)`,
          quantity: 1,
          unitPrice: -(calculateTotalWithTax(items).totalWithTax * discountValue) / 100,
          discount: 0,
          tvaRate: 0 as TVARate,
        },
      ];
      
      discountAmount = roundTVA(
        (calculateTotalWithTax(items).totalWithTax * discountValue) / 100
      );
    }
  } else {
    // Fixed amount discount
    const subtotal = applyBeforeTax 
      ? calculateSubtotal(items) 
      : calculateTotalWithTax(items).totalWithTax;
    
    const discountPercent = (discountValue / subtotal) * 100;
    
    if (applyBeforeTax) {
      adjustedItems = items.map((item) => {
        const itemSubtotal = Number(item.quantity) * Number(item.unitPrice);
        const itemDiscountProportion = itemSubtotal / subtotal;
        const itemAdditionalDiscount = (item.discount || 0) + (discountPercent * itemDiscountProportion);
        
        return {
          ...item,
          discount: roundTVA(itemAdditionalDiscount),
        };
      });
    } else {
      adjustedItems = [
        ...items,
        {
          description: `Remise fixe`,
          quantity: 1,
          unitPrice: -discountValue,
          discount: 0,
          tvaRate: 0 as TVARate,
        },
      ];
    }

    discountAmount = discountValue;
  }

  const newTotals = calculateInvoiceTotals(adjustedItems, 0);

  return {
    adjustedItems,
    discountAmount: roundTVA(discountAmount),
    newTotals,
  };
}

/**
 * Calculate advance payment (partial payment) scenarios
 */
export function calculateAdvancePayment(
  totalAmount: number,
  advancePercent: number,
  tvaRate: TVARate = 19
): {
  advanceAmount: number;
  advanceTVA: number;
  advanceTotal: number;
  remainingAmount: number;
  remainingTVA: number;
  remainingTotal: number;
} {
  const baseAmount = totalAmount / (1 + (tvaRate > 0 ? tvaRate / 100 : 0));
  const totalTVA = totalAmount - baseAmount;

  const advanceBase = roundTVA((baseAmount * advancePercent) / 100);
  const advanceTVA = roundTVA((totalTVA * advancePercent) / 100);
  const advanceTotal = roundTVA(advanceBase + advanceTVA);

  const remainingBase = roundTVA(baseAmount - advanceBase);
  const remainingTVA = roundTVA(totalTVA - advanceTVA);
  const remainingTotal = roundTVA(remainingBase + remainingTVA);

  return {
    advanceAmount: advanceBase,
    advanceTVA,
    advanceTotal,
    remainingAmount: remainingBase,
    remainingTVA,
    remainingTotal,
  };
}

/**
 * Validate TVA calculations for correctness
 */
export function validateTVA(
  items: InvoiceLineItemInput[],
  expectedTotal?: number
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  calculated: InvoiceTotals;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const calculated = calculateInvoiceTotals(items, 0);

  // Check for empty items
  if (items.length === 0) {
    errors.push('La facture doit contenir au moins un article');
  }

  // Validate each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const index = i + 1;

    // Check description
    if (!item.description || item.description.trim() === '') {
      errors.push(`Article ${index}: Description manquante`);
    }

    // Check quantity
    if (item.quantity <= 0) {
      errors.push(`Article ${index}: Quantité invalide (${item.quantity})`);
    }

    // Check unit price
    if (item.unitPrice < 0) {
      errors.push(`Article ${index}: Prix unitaire négatif (${item.unitPrice})`);
    }

    // Check discount range
    if (item.discount !== undefined && (item.discount < 0 || item.discount > 100)) {
      errors.push(`Article ${index}: Remise hors plage (0-100%)`);
    }

    // Check TVA rate validity
    const validRates: TVARate[] = [19, 9, 0, -1];
    const tvaRate = item.tvaRate ?? 19;
    if (!validRates.includes(tvaRate)) {
      errors.push(`Article ${index}: Taux TVA invalide (${tvaRate}%)`);
    }

    // Warning for exempt items
    if (tvaRate === -1) {
      warnings.push(`Article ${index}: Article exonéré de TVA - certificat requis`);
    }
  }

  // Verify total calculation
  if (expectedTotal !== undefined && expectedTotal !== null) {
    const difference = Math.abs(calculated.totalWithTax - expectedTotal);
    if (difference > 0.01) {
      errors.push(
        `Différence de total détectée: calculé ${calculated.totalWithTax}, attendu ${expectedTotal}`
      );
    }
  }

  // Check that TVA breakdown sums correctly
  const tvaSumFromBreakdown = calculated.tvaBreakdown.reduce(
    (sum, entry) => sum + entry.tvaAmount,
    0
  );
  if (Math.abs(tvaSumFromBreakdown - calculated.totalTVA) > 0.01) {
    errors.push('Incohérence dans le détail TVA');
  }

  // Check that taxable base is correct
  const expectedTaxableBase = roundTVA(calculated.subtotal - calculated.discountAmount);
  const actualTaxableBase = calculated.taxableBase;
  if (Math.abs(expectedTaxableBase - actualTaxableBase) > 0.01) {
    errors.push('Incohérence dans la base imposable');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    calculated,
  };
}

/**
 * Calculate complete invoice totals from line items
 */
export function calculateInvoiceTotals(
  items: InvoiceLineItemInput[],
  additionalDiscountPercent: number = 0
): InvoiceTotals {
  let subtotal = 0;
  let discountAmount = 0;
  const tvaByRate = new Map<TVARate, { base: number; amount: number }>();

  for (const item of items) {
    const calc = calculateLineItemTax(item);
    subtotal += calc.subtotal;
    discountAmount += calc.discountAmount;

    const rate = (item.tvaRate ?? 19) as TVARate;
    if (!tvaByRate.has(rate)) {
      tvaByRate.set(rate, { base: 0, amount: 0 });
    }

    const entry = tvaByRate.get(rate)!;
    entry.base += calc.taxableAmount;
    entry.amount += calc.tvaAmount;
  }

  // Build TVA breakdown array
  const tvaBreakdown: TVABreakdownEntry[] = Array.from(tvaByRate.entries()).map(
    ([rate, value]) => ({
      rate,
      taxableBase: roundTVA(value.base),
      tvaAmount: roundTVA(value.amount),
    })
  );

  // Calculate totals
  const roundedSubtotal = roundTVA(subtotal);
  const roundedDiscount = roundTVA(discountAmount);
  const taxableBase = roundTVA(roundedSubtotal - roundedDiscount);

  // Apply additional discount
  let finalTaxableBase = taxableBase;
  let additionalDiscountAmount = 0;
  if (additionalDiscountPercent > 0) {
    additionalDiscountAmount = roundTVA((taxableBase * additionalDiscountPercent) / 100);
    finalTaxableBase = roundTVA(taxableBase - additionalDiscountAmount);
  }

  // Recalculate TVA based on final taxable amounts
  const totalTVA = roundTVA(
    tvaBreakdown.reduce((sum, entry) => {
      if (entry.rate > 0) {
        const rateProportion = entry.taxableBase / (taxableBase || 1);
        return sum + roundTVA((finalTaxableBase * rateProportion * entry.rate) / 100);
      }
      return sum;
    }, 0)
  );

  const totalWithTax = roundTVA(finalTaxableBase + totalTVA);

  return {
    subtotal: roundedSubtotal,
    discountAmount: roundTVA(roundedDiscount + additionalDiscountAmount),
    discountPercent: additionalDiscountPercent,
    taxableBase: finalTaxableBase,
    tvaBreakdown,
    totalTVA,
    totalWithTax,
    amountPaid: 0,
    amountDue: totalWithTax,
  };
}

/**
 * Reverse calculate price from TTC (all taxes included)
 */
export function calculatePriceFromTTC(
  ttcPrice: number,
  tvaRate: TVARate = 19
): { htPrice: number; tvaAmount: number } {
  if (tvaRate <= 0) {
    return { htPrice: ttcPrice, tvaAmount: 0 };
  }

  const htPrice = roundTVA(ttcPrice / (1 + tvaRate / 100));
  const tvaAmount = roundTVA(ttcPrice - htPrice);

  return { htPrice, tvaAmount };
}

/**
 * Get applicable TVA rate based on product category and other factors
 */
export function determineTVARate(options: {
  category?: string;
  isExport?: boolean;
  isExempt?: boolean;
  hasExemptionCertificate?: boolean;
  buyerCountry?: string;
}): TVARate {
  // Exports are always zero-rated
  if (options.isExport || options.buyerCountry && options.buyerCountry !== 'DZ') {
    return 0;
  }

  // Explicit exemption
  if (options.isExempt || options.hasExemptionCertificate) {
    return -1;
  }

  // Category-based rate
  if (options.category) {
    const categoryRate = invoiceConfig.categoryTVAMap[options.category];
    if (categoryRate !== undefined) {
      return categoryRate as TVARate;
    }
  }

  // Default to standard rate
  return 19;
}

/**
 * Format currency amount according to Algerian conventions
 */
export function formatCurrency(
  amount: number,
  currency: keyof typeof invoiceConfig.currencies = 'DZD'
): string {
  const config = invoiceConfig.currencies[currency];
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);

  return `${formatted} ${config.symbol}`;
}

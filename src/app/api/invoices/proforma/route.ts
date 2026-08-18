// Proforma Invoice API Route
// POST /api/invoices/proforma - Generate proforma invoice

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  calculateLineItemTax,
  calculateInvoiceTotals,
  roundTVA,
} from '@/lib/invoicing/calculator';
import { getInvoiceTypePrefix } from '@/lib/invoicing/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      sellerId,
      buyerId,
      items,
      orderId,
      paymentTerms = 'NET30',
      currency = 'DZD',
      discountPercent = 0,
      notes,
      validUntilDays = 30, // Default validity: 30 days
      convertToInvoiceOnOrder = false,
    } = body;
    
    // Validate required fields
    if (!sellerId || !buyerId) {
      return NextResponse.json(
        { success: false, error: 'sellerId and buyerId are required' },
        { status: 400 }
      );
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }
    
    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description) {
        return NextResponse.json(
          { success: false, error: `Item ${i + 1}: description is required` },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: `Item ${i + 1}: invalid quantity` },
          { status: 400 }
        );
      }
    }
    
    // Generate proforma number
    const now = new Date();
    const prefix = getInvoiceTypePrefix('PROFORMA');
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const count = await db.invoice.count({
      where: {
        invoiceType: 'PROFORMA',
        issueDate: {
          gte: new Date(year, parseInt(month) - 1, 1),
          lt: new Date(year, parseInt(month), 1),
        },
      },
    });
    
    const invoiceNumber = `${prefix}${year}-${month}-${String(count + 1).padStart(5, '0')}`;
    
    // Calculate validity date
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + validUntilDays);
    
    // Calculate due date (for reference only on proforma)
    const termDays: Record<string, number> = {
      IMMEDIATE: 0,
      NET30: 30,
      NET60: 60,
      NET90: 90,
      EOM: 30,
    };
    const days = termDays[paymentTerms.toUpperCase()] ?? 30;
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + days);
    
    // Process line items
    const processedItems = items.map((item: any, index: number) => {
      const calc = calculateLineItemTax(item);
      return {
        productId: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        tvaRate: item.tvaRate ?? 19,
        taxAmount: calc.tvaAmount,
        lineTotal: calc.lineTotal,
        lineTotalWithTax: calc.lineTotalWithTax,
        productSku: item.productSku || null,
        unitOfMeasure: item.unitOfMeasure || null,
        sortOrder: item.sortOrder ?? index,
      };
    });
    
    // Calculate totals
    const totals = calculateInvoiceTotals(items, discountPercent);
    
    // Calculate TVA breakdown
    const tvaBreakdownData = calculateTVABreakdown(items);
    
    // Build proforma notes
    const proformaNotes = [
      '=== FACTURE PROFORMA ===',
      `Valide jusqu'au: ${validUntil.toLocaleDateString('fr-DZ')}`,
      `Durée de validité: ${validUntilDays} jours`,
      '',
      'Cette facture proforma n\'a aucune valeur comptable.',
      'Elle sert uniquement de devis ou d\'estimation pour le client.',
      'Les prix et conditions peuvent être sujets à modification.',
      '',
      convertToInvoiceOnOrder 
        ? 'Cette proforma sera automatiquement convertie en facture lors de la confirmation de commande.'
        : 'Pour convertir cette proforma en facture, veuillez contacter le vendeur.',
      notes || '',
    ].filter(Boolean).join('\n');
    
    // Create proforma invoice
    const proforma = await db.invoice.create({
      data: {
        invoiceNumber,
        invoiceType: 'PROFORMA',
        status: 'ISSUED', // Proformas are typically issued immediately
        sellerId,
        buyerId,
        orderId: orderId || null,
        issueDate: now,
        dueDate,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        discountPercent: totals.discountPercent,
        taxableBase: totals.taxableBase,
        tvaAmount: totals.totalTVA,
        totalAmount: totals.totalWithTax,
        amountDue: totals.totalWithTax,
        currency,
        paymentTerms: paymentTerms.toUpperCase(),
        notes: proformaNotes,
        internalNotes: `Proforma valide ${validUntilDays} jours | Créée: ${now.toISOString()}`,
        items: {
          create: processedItems,
        },
        tvaBreakdown: {
          create: tvaBreakdownData.map((entry) => ({
            tvaRate: entry.rate,
            taxableBase: entry.taxableBase,
            tvaAmount: entry.tvaAmount,
          })),
        },
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        tvaBreakdown: true,
        payments: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ...proforma,
        meta: {
          validUntil: validUntil.toISOString(),
          validityDays: validUntilDays,
          convertibleToInvoice: true,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating proforma invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create proforma invoice' },
      { status: 500 }
    );
  }
}

function calculateTVABreakdown(items: any[]): Array<{ rate: number; taxableBase: number; tvaAmount: number }> {
  const rateMap = new Map<number, { base: number; amount: number }>();
  
  for (const item of items) {
    const calc = calculateLineItemTax(item);
    const rate = item.tvaRate ?? 19;
    
    if (!rateMap.has(rate)) {
      rateMap.set(rate, { base: 0, amount: 0 });
    }
    
    const entry = rateMap.get(rate)!;
    entry.base += calc.taxableAmount;
    entry.amount += calc.tvaAmount;
  }
  
  return Array.from(rateMap.entries()).map(([rate, value]) => ({
    rate,
    taxableBase: roundTVA(value.base),
    tvaAmount: roundTVA(value.amount),
  }));
}

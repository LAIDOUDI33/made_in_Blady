// Credit Notes API Route
// GET /api/invoices/credit-notes - List credit notes
// POST /api/invoices/credit-notes - Create new credit note

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  calculateLineItemTax,
  calculateInvoiceTotals,
  roundTVA,
} from '@/lib/invoicing/calculator';
import { getInvoiceTypePrefix } from '@/lib/invoicing/config';

// GET - List credit notes with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    const sellerId = searchParams.get('sellerId');
    const buyerId = searchParams.get('buyerId');
    const originalInvoiceId = searchParams.get('originalInvoiceId');
    const status = searchParams.get('status');
    
    const where: any = {
      invoiceType: 'CREDIT_NOTE',
    };
    
    if (sellerId) where.sellerId = sellerId;
    if (buyerId) where.buyerId = buyerId;
    if (originalInvoiceId) where.parentInvoiceId = originalInvoiceId;
    if (status) where.status = status.toUpperCase();
    
    const [creditNotes, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          tvaBreakdown: true,
          payments: true,
          parentInvoice: {
            select: { id: true, invoiceNumber: true, totalAmount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.invoice.count({ where }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: creditNotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing credit notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit notes' },
      { status: 500 }
    );
  }
}

// POST - Create new credit note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      originalInvoiceId,
      reason,
      itemsToCredit,
      partialCredit = false,
      sellerId,
      buyerId,
      notes,
    } = body;
    
    // Validate required fields
    if (!originalInvoiceId) {
      return NextResponse.json(
        { success: false, error: 'originalInvoiceId is required' },
        { status: 400 }
      );
    }
    
    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Reason for credit note is required' },
        { status: 400 }
      );
    }
    
    // Fetch original invoice
    const originalInvoice = await db.invoice.findUnique({
      where: { id: originalInvoiceId },
      include: { items: true },
    });
    
    if (!originalInvoice) {
      return NextResponse.json(
        { success: false, error: 'Original invoice not found' },
        { status: 404 }
      );
    }
    
    // Determine which items to credit
    let creditItems;
    
    if (itemsToCredit && Array.isArray(itemsToCredit) && itemsToCredit.length > 0) {
      // Credit specific items
      creditItems = itemsToCredit.map((itemToCredit: any) => {
        const originalItem = originalInvoice.items.find(i => i.id === itemToCredit.itemId);
        
        if (!originalItem) {
          throw new Error(`Item ${itemToCredit.itemId} not found in original invoice`);
        }
        
        const quantity = itemToCredit.quantity ?? Number(originalItem.quantity);
        
        return {
          description: `[AVOIR] ${originalItem.description}`,
          quantity: -Math.abs(quantity), // Negative for credit
          unitPrice: Number(originalItem.unitPrice),
          discount: Number(originalItem.discount),
          tvaRate: Number(originalItem.tvaRate),
          productSku: originalItem.productSku || undefined,
          reason: itemToCredit.reason || undefined,
        };
      });
    } else {
      // Credit entire invoice
      creditItems = originalInvoice.items.map((item) => ({
        description: `[AVOIR] ${item.description}`,
        quantity: -Number(item.quantity), // Negative for credit
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        tvaRate: Number(item.tvaRate),
        productSku: item.productSku || undefined,
      }));
    }
    
    // Generate credit note number
    const date = new Date();
    const prefix = getInvoiceTypePrefix('CREDIT_NOTE');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const count = await db.invoice.count({
      where: {
        invoiceType: 'CREDIT_NOTE',
        issueDate: {
          gte: new Date(year, parseInt(month) - 1, 1),
          lt: new Date(year, parseInt(month), 1),
        },
      },
    });
    
    const invoiceNumber = `${prefix}${year}-${month}-${String(count + 1).padStart(5, '0')}`;
    
    // Calculate totals for credit note
    const totals = calculateInvoiceTotals(creditItems);
    
    // Calculate TVA breakdown
    const tvaBreakdownData = calculateTVABreakdownFromItems(creditItems);
    
    // Create credit note (swap seller/buyer for credit)
    const creditNote = await db.invoice.create({
      data: {
        invoiceNumber,
        invoiceType: 'CREDIT_NOTE',
        status: 'DRAFT',
        sellerId: sellerId || originalInvoice.buyerId, // Reversed
        buyerId: buyerId || originalInvoice.sellerId,   // Reversed
        orderId: originalInvoice.orderId,
        issueDate: date,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxableBase: totals.taxableBase,
        tvaAmount: totals.totalTVA,
        totalAmount: totals.totalWithTax,
        amountDue: totals.totalWithTax,
        currency: originalInvoice.currency,
        paymentTerms: originalInvoice.paymentTerms,
        notes: [
          `NOTE DE CRÉDIT (AVOIR)`,
          `Facture originale: ${originalInvoice.invoiceNumber}`,
          `Raison: ${reason}`,
          notes || '',
        ].filter(Boolean).join('\n'),
        parentInvoiceId: originalInvoice.id,
        items: {
          create: creditItems.map((item, index) => {
            const calc = calculateLineItemTax(item);
            return {
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              tvaRate: item.tvaRate,
              taxAmount: calc.tvaAmount,
              lineTotal: calc.lineTotal,
              lineTotalWithTax: calc.lineTotalWithTax,
              productSku: item.productSku || null,
              sortOrder: index,
            };
          }),
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
        parentInvoice: {
          select: { id: true, invoiceNumber: true, totalAmount: true },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: creditNote,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating credit note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create credit note' },
      { status: 500 }
    );
  }
}

// Helper function to calculate TVA breakdown
function calculateTVABreakdownFromItems(items: any[]): Array<{ rate: number; taxableBase: number; tvaAmount: number }> {
  const rateMap = new Map<number, { base: number; amount: number }>();
  
  for (const item of items) {
    const calc = calculateLineItemTax(item);
    const rate = item.tvaRate ?? 19;
    
    if (!rateMap.has(rate)) {
      rateMap.set(rate, { base: 0, amount: 0 });
    }
    
    const entry = rateMap.get(rate)!;
    entry.base += Math.abs(calc.taxableAmount); // Use absolute values for credit notes
    entry.amount += Math.abs(calc.tvaAmount);
  }
  
  return Array.from(rateMap.entries()).map(([rate, value]) => ({
    rate,
    taxableBase: roundTVA(value.base),
    tvaAmount: roundTVA(value.amount),
  }));
}

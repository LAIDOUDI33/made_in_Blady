// Invoice API Routes - Main endpoint
// GET /api/invoices - List invoices with filtering
// POST /api/invoices - Create new invoice

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  generateInvoiceNumber,
  calculateLineItemTax,
  calculateInvoiceTotals,
  roundTVA,
} from '@/lib/invoicing/calculator';
import { invoiceConfig, getInvoiceTypePrefix } from '@/lib/invoicing/config';

// GET - List invoices with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    // Filter parameters
    const sellerId = searchParams.get('sellerId');
    const buyerId = searchParams.get('buyerId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    
    // Build where clause
    const where: any = {};
    
    if (sellerId) where.sellerId = sellerId;
    if (buyerId) where.buyerId = buyerId;
    if (status) where.status = status.toUpperCase();
    if (type) where.invoiceType = type.toUpperCase();
    
    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = new Date(dateFrom);
      if (dateTo) where.issueDate.lte = new Date(dateTo);
    }
    
    // Search by invoice number or notes
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Execute queries in parallel
    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          tvaBreakdown: true,
          payments: { orderBy: { paidAt: 'desc' } },
          creditNotes: {
            select: { id: true, invoiceNumber: true, status: true, totalAmount: true },
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
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      orderId,
      sellerId,
      buyerId,
      invoiceType = 'STANDARD',
      items,
      issueDate,
      paymentTerms = 'NET30',
      currency = 'DZD',
      discountPercent = 0,
      notes,
      internalNotes,
      parentInvoiceId,
      quotedInvoiceId,
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
      if (item.unitPrice < 0) {
        return NextResponse.json(
          { success: false, error: `Item ${i + 1}: unit price cannot be negative` },
          { status: 400 }
        );
      }
    }
    
    // Generate invoice number
    const prefix = getInvoiceTypePrefix(invoiceType);
    const date = issueDate ? new Date(issueDate) : new Date();
    const invoiceNumber = await generateUniqueInvoiceNumber(invoiceType, date);
    
    // Calculate due date based on payment terms
    const dueDate = calculateDueDateFromDate(date, paymentTerms);
    
    // Process line items and calculate totals
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
    
    // Create invoice with all related data
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        invoiceType: invoiceType.toUpperCase(),
        status: 'DRAFT',
        sellerId,
        buyerId,
        orderId: orderId || null,
        issueDate: date,
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
        notes: notes || null,
        internalNotes: internalNotes || null,
        parentInvoiceId: parentInvoiceId || null,
        quotedInvoiceId: quotedInvoiceId || null,
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
      data: invoice,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

// Helper functions
async function generateUniqueInvoiceNumber(type: string, date: Date): Promise<string> {
  const prefix = getInvoiceTypePrefix(type as any);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Count existing invoices for this month and type
  const count = await db.invoice.count({
    where: {
      invoiceType: type.toUpperCase(),
      issueDate: {
        gte: new Date(year, parseInt(month) - 1, 1),
        lt: new Date(year, parseInt(month), 1),
      },
    },
  });
  
  const sequence = String(count + 1).padStart(5, '0');
  return `${prefix}${year}-${month}-${sequence}`;
}

function calculateDueDateFromDate(issueDate: Date, paymentTerms: string): Date {
  const termDays: Record<string, number> = {
    IMMEDIATE: 0,
    NET30: 30,
    NET60: 60,
    NET90: 90,
    EOM: 0, // End of month - handled specially
  };
  
  const days = termDays[paymentTerms.toUpperCase()] ?? 30;
  const dueDate = new Date(issueDate);
  
  if (paymentTerms.toUpperCase() === 'EOM') {
    // Set to last day of current month
    dueDate.setMonth(dueDate.getMonth() + 1, 0);
  } else {
    dueDate.setDate(dueDate.getDate() + days);
  }
  
  return dueDate;
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

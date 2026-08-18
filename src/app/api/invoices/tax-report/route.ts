// Tax Report API Route
// GET /api/invoices/tax-report - TVA report for date range

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sellerId = searchParams.get('sellerId');
    
    // Default to current month if no dates provided
    const now = new Date();
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = dateTo ? new Date(dateTo) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Build where clause for issued/paid invoices only (not drafts or cancelled)
    const where: any = {
      status: { in: ['ISSUED', 'PAID', 'PARTIAL', 'OVERDUE'] },
      issueDate: {
        gte: fromDate,
        lte: toDate,
      },
    };
    
    if (sellerId) where.sellerId = sellerId;
    
    // Fetch invoices with TVA breakdown
    const invoices = await db.invoice.findMany({
      where,
      include: {
        tvaBreakdown: true,
        items: true,
      },
      orderBy: { issueDate: 'asc' },
    });
    
    // Calculate aggregated TVA data
    const tvaByRate = new Map<number, { 
      taxableBase: number; 
      tvaAmount: number; 
      invoiceCount: number;
      itemCount: number;
    }>();
    
    let totalSubtotal = 0;
    let totalTVA = 0;
    let totalWithTax = 0;
    let totalAmountPaid = 0;
    let totalOutstanding = 0;
    
    let issuedCount = 0;
    let paidCount = 0;
    let partialCount = 0;
    let overdueCount = 0;
    
    for (const invoice of invoices) {
      // Count by status
      switch (invoice.status) {
        case 'ISSUED': issuedCount++; break;
        case 'PAID': paidCount++; break;
        case 'PARTIAL': partialCount++; break;
        case 'OVERDUE': overdueCount++; break;
      }
      
      // Accumulate totals
      totalSubtotal += Number(invoice.subtotal || 0);
      totalTVA += Number(invoice.tvaAmount || 0);
      totalWithTax += Number(invoice.totalAmount || 0);
      totalAmountPaid += Number(invoice.amountPaid || 0);
      totalOutstanding += Math.max(0, Number(invoice.amountDue || 0));
      
      // Aggregate by TVA rate
      for (const tb of invoice.tvaBreakdown) {
        const rate = Number(tb.tvaRate);
        
        if (!tvaByRate.has(rate)) {
          tvaByRate.set(rate, {
            taxableBase: 0,
            tvaAmount: 0,
            invoiceCount: 0,
            itemCount: 0,
          });
        }
        
        const entry = tvaByRate.get(rate)!;
        entry.taxableBase += Number(tb.taxableBase);
        entry.tvaAmount += Number(tb.tvaAmount);
        entry.itemCount++;
      }
      
      // Count unique invoices per rate
      if (invoice.tvaBreakdown.length > 0) {
        for (const rate of tvaByRate.keys()) {
          if (invoice.tvaBreakdown.some(tb => Number(tb.tvaRate) === rate)) {
            tvaByRate.get(rate)!.invoiceCount++;
          }
        }
      }
    }
    
    // Format breakdown array
    const tvaBreakdown = Array.from(tvaByRate.entries()).map(([rate, data]) => ({
      rate,
      rateLabel: getTVARateLabel(rate),
      taxableBase: Math.round(data.taxableBase * 100) / 100,
      tvaAmount: Math.round(data.tvaAmount * 100) / 100,
      invoiceCount: data.invoiceCount,
      itemCount: data.itemCount,
    }));
    
    // Previous period comparison (same period last month)
    const prevFromDate = new Date(fromDate);
    prevFromDate.setMonth(prevFromDate.getMonth() - 1);
    const prevToDate = new Date(toDate);
    prevToDate.setMonth(prevToDate.getMonth() - 1);
    
    const previousPeriodWhere = {
      ...where,
      issueDate: {
        gte: prevFromDate,
        lte: prevToDate,
      },
    };
    
    const [previousInvoices, previousTotal] = await Promise.all([
      db.invoice.findMany({
        where: previousPeriodWhere,
        select: { tvaAmount: true, totalAmount: true },
      }),
      db.invoice.aggregate({
        where: previousPeriodWhere,
        _sum: { tvaAmount: true, totalAmount: true },
      }),
    ]);
    
    const previousTVA = Number(previousTotal._sum?.tvaAmount || 0);
    const tvaChange = previousTVA !== 0 ? ((totalTVA - previousTVA) / previousTVA) * 100 : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        reportPeriod: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          label: `${fromDate.toLocaleDateString('fr-DZ')} - ${toDate.toLocaleDateString('fr-DZ')}`,
        },
        summary: {
          totalInvoices: invoices.length,
          issuedCount,
          paidCount,
          partialCount,
          overdueCount,
          totalSubtotal: Math.round(totalSubtotal * 100) / 100,
          totalTVA: Math.round(totalTVA * 100) / 100,
          totalWithTax: Math.round(totalWithTax * 100) / 100,
          totalAmountPaid: Math.round(totalAmountPaid * 100) / 100,
          totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        },
        tvaBreakdown,
        comparison: {
          previousPeriodTVA: Math.round(previousTVA * 100) / 100,
          changePercent: Math.round(tvaChange * 100) / 100,
          changeDirection: tvaChange >= 0 ? 'increase' : 'decrease',
        },
        // Summary for accountant export
        accountantSummary: {
          declarationReference: `TVA-${fromDate.getFullYear()}${String(fromDate.getMonth() + 1).padStart(2, '0')}`,
          taxableOperationsTotal: Math.round(totalSubtotal * 100) / 100,
          tvacollectable: Math.round(totalTVA * 100) / 100,
          currency: 'DZD',
        },
      },
    });
  } catch (error) {
    console.error('Error generating tax report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate tax report' },
      { status: 500 }
    );
  }
}

function getTVARateLabel(rate: number): string {
  switch (rate) {
    case 19: return 'Taux normal (19%)';
    case 9: return 'Taux réduit (9%)';
    case 0: return 'Taux zéro (0%) - Exports';
    case -1: return 'Exonéré';
    default: return `${rate}%`;
  }
}

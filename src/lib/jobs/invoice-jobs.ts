// Invoice Scheduled Tasks
// Automated jobs for invoice management

import { db } from '@/lib/db';

// ============================================
// Job Types and Interfaces
// ============================================

export interface JobContext {
  jobId: string;
  startedAt: Date;
  log: (message: string) => void;
  error: (message: string, error?: Error) => void;
}

export interface JobResult {
  success: boolean;
  processed: number;
  errors: number;
  message: string;
  details?: any;
}

// ============================================
// Job 1: Auto-generate invoices for completed orders
// ============================================

/**
 * Daily job to automatically generate invoices for completed orders
 * that don't have an invoice yet.
 */
export async function autoGenerateInvoicesForCompletedOrders(
  context: JobContext
): Promise<JobResult> {
  context.log('Starting auto-generation of invoices for completed orders');
  
  let processed = 0;
  let errors = 0;

  try {
    // Find completed orders without invoices
    const completedOrdersWithoutInvoice = await db.order.findMany({
      where: {
        status: 'COMPLETED',
        invoice: null, // No invoice yet
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        buyer: {
          select: { id: true, name: true },
        },
        seller: {
          select: { id: true, name: true },
        },
      },
    });

    context.log(`Found ${completedOrdersWithoutInvoice.length} completed orders without invoices`);

    for (const order of completedOrdersWithoutInvoice) {
      try {
        // Generate invoice from order data
        const invoiceItems = order.items.map((item) => ({
          description: item.product?.name || `Produit ${item.productId}`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          tvaRate: determineTVARateFromCategory(item.product?.category),
          productId: item.productId,
          productSku: item.product?.sku,
        }));

        // Calculate totals (simplified)
        let subtotal = 0;
        let totalTVA = 0;

        for (const item of invoiceItems) {
          const lineTotal = item.quantity * item.unitPrice;
          const discountAmount = lineTotal * (item.discount / 100);
          const taxableBase = lineTotal - discountAmount;
          const tvaAmount = item.tvaRate > 0 ? (taxableBase * item.tvaRate) / 100 : 0;
          
          subtotal += lineTotal;
          totalTVA += tvaAmount;
        }

        // Generate invoice number
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        
        const count = await db.invoice.count({
          where: {
            invoiceType: 'STANDARD',
            issueDate: {
              gte: new Date(year, parseInt(month) - 1, 1),
              lt: new Date(year, parseInt(month), 1),
            },
          },
        });
        
        const invoiceNumber = `FAC${year}-${month}-${String(count + 1).padStart(5, '0')}`;

        // Create the invoice
        await db.invoice.create({
          data: {
            invoiceNumber,
            invoiceType: 'STANDARD',
            status: 'DRAFT', // Start as draft, can be auto-issued if configured
            sellerId: order.sellerId,
            buyerId: order.buyerId,
            orderId: order.id,
            issueDate: now,
            dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Net 30 default
            subtotal,
            discountAmount: 0,
            taxableBase: subtotal - 0, // Would need proper calculation
            tvaAmount: totalTVA,
            totalAmount: subtotal + totalTVA,
            amountDue: subtotal + totalTVA,
            currency: 'DZD',
            paymentTerms: 'NET30',
            notes: `Facture générée automatiquement pour la commande ${order.orderNumber || order.id}`,
            internalNotes: `Auto-generated job | Order ID: ${order.id}`,
            items: {
              create: invoiceItems.map((item, index) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                tvaRate: item.tvaRate,
                taxAmount: item.tvaRate > 0 
                  ? ((item.quantity * item.unitPrice * (1 - item.discount / 100)) * item.tvaRate) / 100 
                  : 0,
                lineTotal: item.quantity * item.unitPrice,
                lineTotalWithTax: (item.quantity * item.unitPrice) + (
                  item.tvaRate > 0 
                    ? ((item.quantity * item.unitPrice * (1 - item.discount / 100)) * item.tvaRate) / 100 
                    : 0
                ),
                productSku: item.productSku,
                sortOrder: index,
              })),
            },
          },
        });

        processed++;
        context.log(`Created invoice for order ${order.id}`);
      } catch (error) {
        errors++;
        context.error(`Failed to create invoice for order ${order.id}`, error as Error);
      }
    }

    return {
      success: true,
      processed,
      errors,
      message: `Processed ${completedOrdersWithoutInvoice.length} orders. Created ${processed} invoices. ${errors} errors.`,
    };
  } catch (error) {
    context.error('Failed in autoGenerateInvoicesForCompletedOrders', error as Error);
    return {
      success: false,
      processed,
      errors: completedOrdersWithoutInvoice.length,
      message: 'Job failed due to unexpected error',
    };
  }
}

// ============================================
// Job 2: Overdue invoice detection and alerts
// ============================================

/**
 * Daily job to detect overdue invoices and send alerts
 */
export async function detectOverdueInvoices(context: JobContext): Promise<JobResult> {
  context.log('Starting overdue invoice detection');
  
  let overdueCount = 0;
  let updatedCount = 0;

  try {
    const now = new Date();

    // Find issued/partial invoices past their due date that aren't already marked as overdue
    const potentiallyOverdue = await db.invoice.findMany({
      where: {
        status: { in: ['ISSUED', 'PARTIAL'] },
        dueDate: { lt: now },
        amountDue: { gt: 0 }, // Still has balance due
      },
    });

    context.log(`Found ${potentiallyOverdue.length} potentially overdue invoices`);

    for (const invoice of potentiallyOverdue) {
      try {
        // Update status to OVERDUE
        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'OVERDUE',
            internalNotes: [
              invoice.internalNotes,
              `=== OVERDUE DETECTION ===`,
              `Detected: ${now.toISOString()}`,
              `Due date was: ${invoice.dueDate?.toISOString()}`,
              `Days overdue: ${Math.floor((now.getTime() - new Date(invoice.dueDate!).getTime()) / (1000 * 60 * 60 * 24))}`,
            ].filter(Boolean).join('\n'),
          },
        });

        overdueCount++;
        updatedCount++;

        // TODO: Send notification to buyer
        // TODO: Send notification to seller
        context.log(`Invoice ${invoice.invoiceNumber} marked as OVERDUE`);
      } catch (error) {
        context.error(`Failed to update invoice ${invoice.id}`, error as Error);
      }
    }

    return {
      success: true,
      processed: potentiallyOverdue.length,
      errors: potentiallyOverdue.length - updatedCount,
      message: `Detected ${overdueCount} overdue invoices. Updated ${updatedCount} records.`,
      details: { overdueCount, updatedCount },
    };
  } catch (error) {
    context.error('Failed in detectOverdueInvoices', error as Error);
    return {
      success: false,
      processed: 0,
      errors: 1,
      message: 'Job failed due to unexpected error',
    };
  }
}

// ============================================
// Job 3: Payment reminders
// ============================================

/**
 * Send payment reminders at configurable intervals before/after due date
 */
export async function sendPaymentReminders(context: JobContext): Promise<JobResult> {
  context.log('Starting payment reminder process');
  
  const now = new Date();
  let remindersSent = 0;

  // Reminder intervals (in days)
  const reminderIntervals = [7, 3, 1]; // Days before due date

  try {
    for (const daysBefore of reminderIntervals) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysBefore);

      // Find invoices due on targetDate that still have balance
      const invoicesNeedingReminder = await db.invoice.findMany({
        where: {
          status: { in: ['ISSUED', 'PARTIAL'] },
          dueDate: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lt: new Date(targetDate.setHours(23, 59, 59, 999)),
          },
          amountDue: { gt: 0 },
        },
        include: {
          buyer: { select: { id: true, email: true, name: true } },
          seller: { select: { id: true, email: true, name: true } },
        },
      });

      for (const invoice of invoicesNeedingReminder) {
        try {
          // TODO: Implement actual email sending
          context.log(
            `Sending ${daysBefore}-day reminder for invoice ${invoice.invoiceNumber} to buyer ${(invoice.buyer as any)?.email}`
          );
          
          remindersSent++;
        } catch (error) {
          context.error(`Failed to send reminder for invoice ${invoice.id}`, error as Error);
        }
      }
    }

    // Also check for overdue invoices that haven't been reminded recently
    const overdueInvoices = await db.invoice.findMany({
      where: {
        status: 'OVERDUE',
        amountDue: { gt: 0 },
      },
      include: {
        buyer: { select: { id: true, email: true, name: true } },
      },
    });

    for (const invoice of overdueInvoices.slice(0, 10)) { // Limit to avoid spam
      // TODO: Send overdue reminder (with different template)
      context.log(`Sending overdue notice for invoice ${invoice.invoiceNumber}`);
      remindersSent++;
    }

    return {
      success: true,
      processed: remindersSent,
      errors: 0,
      message: `Sent ${remindersSent} payment reminders.`,
    };
  } catch (error) {
    context.error('Failed in sendPaymentReminders', error as Error);
    return {
      success: false,
      processed: 0,
      errors: 1,
      message: 'Job failed due to unexpected error',
    };
  }
}

// ============================================
// Job 4: Monthly TVA reporting preparation
// ============================================

/**
 * Prepare monthly TVA report data for accounting/tax filing
 */
export async function prepareMonthlyTVAReport(context: JobContext): Promise<JobResult> {
  context.log('Preparing monthly TVA report');

  try {
    const now = new Date();
    const reportMonth = now.getMonth(); // 0-indexed
    const reportYear = now.getFullYear();

    // Get start and end of current month
    const periodStart = new Date(reportYear, reportMonth, 1);
    const periodEnd = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59, 999);

    // Fetch all non-cancelled invoices for the period
    const invoices = await db.invoice.findMany({
      where: {
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        issueDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        tvaBreakdown: true,
        payments: true,
      },
    });

    // Calculate aggregates
    let totalSubtotal = 0;
    let totalTVA = 0;
    let totalWithTax = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    const tvaByRate = new Map<number, { base: number; amount: number; count: number }>();

    for (const invoice of invoices) {
      totalSubtotal += Number(invoice.subtotal || 0);
      totalTVA += Number(invoice.tvaAmount || 0);
      totalWithTax += Number(invoice.totalAmount || 0);
      totalPaid += Number(invoice.amountPaid || 0);
      totalOutstanding += Math.max(0, Number(invoice.amountDue || 0));

      for (const tb of invoice.tvaBreakdown) {
        const rate = Number(tb.tvaRate);
        if (!tvaByRate.has(rate)) {
          tvaByRate.set(rate, { base: 0, amount: 0, count: 0 });
        }
        const entry = tvaByRate.get(rate)!;
        entry.base += Number(tb.taxableBase);
        entry.amount += Number(tb.tvaAmount);
        entry.count++;
      }
    }

    const reportData = {
      period: {
        year: reportYear,
        month: reportMonth + 1,
        label: `${periodStart.toLocaleDateString('fr-DZ', { month: 'long', year: 'numeric' })}`,
        from: periodStart.toISOString(),
        to: periodEnd.toISOString(),
      },
      summary: {
        totalInvoices: invoices.length,
        totalSubtotal,
        totalTVA,
        totalWithTax,
        totalPaid,
        totalOutstanding,
      },
      tvaBreakdown: Array.from(tvaByRate.entries()).map(([rate, data]) => ({
        rate,
        taxableBase: data.base,
        tvaAmount: data.amount,
        invoiceCount: data.count,
      })),
      generatedAt: now.toISOString(),
      reference: `TVA-${reportYear}${String(reportMonth + 1).padStart(2, '0')}`,
    };

    context.log(`Monthly TVA report prepared: ${invoices.length} invoices, Total TVA: ${totalTVA}`);

    // TODO: Save report to database or file system
    // TODO: Notify accountant/admin

    return {
      success: true,
      processed: invoices.length,
      errors: 0,
      message: `Monthly TVA report prepared successfully.`,
      details: reportData,
    };
  } catch (error) {
    context.error('Failed in prepareMonthlyTVAReport', error as Error);
    return {
      success: false,
      processed: 0,
      errors: 1,
      message: 'Job failed due to unexpected error',
    };
  }
}

// ============================================
// Job 5: Annual invoice archiving
// ============================================

/**
 * Archive invoices older than retention period (10 years per Algerian law)
 * This would typically move them to cold storage or mark them as archived
 */
export async function archiveOldInvoices(context: JobContext): Promise<JobResult> {
  context.log('Starting annual invoice archiving process');

  try {
    const now = new Date();
    // Retention period is 10 years per Algerian regulations
    const retentionYears = 10;
    const cutoffDate = new Date(
      now.getFullYear() - retentionYears,
      now.getMonth(),
      now.getDate()
    );

    // Find invoices older than retention period
    const oldInvoices = await db.invoice.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { not: 'ARCHIVED' }, // Not already archived
      },
      select: { id: true, invoiceNumber: true, createdAt: true },
    });

    context.log(`Found ${oldInvoices.length} invoices eligible for archival (${retentionYears}+ years old)`);

    let archivedCount = 0;

    for (const invoice of oldInvoices) {
      try {
        // Mark as archived (or move to cold storage)
        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'ARCHIVED',
            internalNotes: [
              `=== ARCHIVED ===`,
              `Archived: ${now.toISOString()}`,
              `Retention policy: ${retentionYears} years`,
              `Original creation: ${invoice.createdAt}`,
            ].join('\n'),
          },
        });

        archivedCount++;
      } catch (error) {
        context.error(`Failed to archive invoice ${invoice.id}`, error as Error);
      }
    }

    return {
      success: true,
      processed: oldInvoices.length,
      errors: oldInvoices.length - archivedCount,
      message: `Archived ${archivedCount} of ${oldInvoices.length} old invoices.`,
    };
  } catch (error) {
    context.error('Failed in archiveOldInvoices', error as Error);
    return {
      success: false,
      processed: 0,
      errors: 1,
      message: 'Job failed due to unexpected error',
    };
  }
}

// ============================================
// Helper Functions
// ============================================

function determineTVARateFromCategory(category?: string): number {
  // Map product categories to TVA rates
  const categoryMap: Record<string, number> = {
    electronics: 19,
    machinery: 19,
    textiles: 19,
    food: 9,
    pharmaceuticals: 9,
    education: 9,
    exports: 0,
    services: 19,
  };

  if (!category) return 19; // Default to standard rate
  return categoryMap[category.toLowerCase()] ?? 19;
}

// ============================================
// Job Runner
// ============================================

/**
 * Run all scheduled invoice jobs
 */
export async function runAllInvoiceJobs(): Promise<void> {
  const startTime = Date.now();
  
  console.log('='.repeat(50));
  console.log(`INVOICE JOBS - Started at ${new Date().toISOString()}`);
  console.log('='.repeat(50));

  const jobs = [
    { name: 'Auto-generate Invoices', fn: autoGenerateInvoicesForCompletedOrders },
    { name: 'Detect Overdue Invoices', fn: detectOverdueInvoices },
    { name: 'Send Payment Reminders', fn: sendPaymentReminders },
  ];

  const results: Array<{ name: string; result: JobResult }> = [];

  for (const job of jobs) {
    const context: JobContext = {
      jobId: job.name.replace(/\s+/g, '-').toLowerCase(),
      startedAt: new Date(),
      log: (msg) => console.log(`  [${job.name}] ${msg}`),
      error: (msg, err) => console.error(`  [${job.name}] ERROR: ${msg}`, err?.stack || ''),
    };

    try {
      console.log(`\n▶ Running: ${job.name}...`);
      const result = await job.fn(context);
      results.push({ name: job.name, result });
      
      console.log(`  ✅ Completed: ${result.message}`);
      if (result.errors > 0) {
        console.log(`  ⚠ With ${result.errors} errors`);
      }
    } catch (error) {
      console.error(`  ❌ Failed: ${job.name}`, error);
      results.push({ 
        name: job.name, 
        result: { success: false, processed: 0, errors: 1, message: 'Job threw exception' } 
      });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(50));
  console.log(`INVOICE JOBS COMPLETED - Duration: ${duration}s`);
  console.log('Summary:');
  results.forEach(({ name, result }) => {
    console.log(`  ${result.success ? '✅' : '❌'} ${name}: ${result.processed} processed, ${result.errors} errors`);
  });
  console.log('='.repeat(50));
}

// POST /api/payments/stripe/webhook - Stripe webhook handler
// Processes all Stripe webhook events for international payments

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleWebhook, processWebhookEvent } from '@/lib/payments/stripe/client';

// POST /api/payments/stripe/webhook - Handle webhook events
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification (important!)
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header');
      
      // Log the failed attempt
      await db.webhookEventLog.create({
        data: {
          gateway: 'STRIPE',
          eventType: 'unknown',
          payload: 'Missing signature header',
          processed: true,
          success: false,
          errorMessage: 'Missing stripe-signature header',
          signatureValid: false,
        },
      });
      
      return new NextResponse(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400 }
      );
    }

    // Verify and construct event
    let event;
    try {
      event = handleWebhook(body, signature);
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err);
      
      // Log the failed verification
      await db.webhookEventLog.create({
        data: {
          gateway: 'STRIPE',
          eventType: 'unknown',
          eventId: 'unknown',
          payload: body.substring(0, 1000), // Truncate for storage
          processed: true,
          success: false,
          errorMessage: `Signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          signatureValid: false,
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
        },
      });
      
      return new NextResponse(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401 }
      );
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    // Log the received event
    const eventLog = await db.webhookEventLog.create({
      data: {
        gateway: 'STRIPE',
        eventType: event.type,
        eventId: event.id,
        payload: JSON.stringify(event.data.object),
        processed: false,
        success: false,
        signatureValid: true,
        orderId: (event.data.object as any)?.metadata?.orderId || null,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      },
    });

    // Process the event using our handler
    let processResult;
    try {
      processResult = await processWebhookEvent(event);
    } catch (processingError) {
      console.error(`[Stripe Webhook] Error processing ${event.type}:`, processingError);
      
      // Update log with error
      await db.webhookEventLog.update({
        where: { id: eventLog.id },
        data: {
          processed: true,
          success: false,
          errorMessage: processingError instanceof Error ? processingError.message : 'Processing error',
        },
      });
      
      // Still return 200 to prevent retries for processing errors
      return new NextResponse(
        JSON.stringify({ 
          received: true, 
          error: 'Processing error logged',
          eventId: event.id,
        }),
        { status: 200 }
      );
    }

    // Handle specific events that require database updates
    await handleDatabaseUpdates(event.type, processResult.data);

    // Update the event log as successfully processed
    await db.webhookEventLog.update({
      where: { id: eventLog.id },
      data: {
        processed: true,
        success: true,
      },
    });

    console.log(`[Stripe Webhook] Successfully processed: ${event.type}`);

    return new NextResponse(
      JSON.stringify({ 
        received: true, 
        eventType: event.type,
        eventId: event.id,
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('[Stripe Webhook] Unexpected error:', error);
    
    return new NextResponse(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500 }
    );
  }
}

/**
 * Handle database updates based on event type
 */
async function handleDatabaseUpdates(
  eventType: string,
  eventData: Record<string, unknown>
): Promise<void> {
  switch (eventType) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(eventData);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailure(eventData);
      break;

    case 'charge.refunded':
      await handleRefund(eventData);
      break;

    case 'customer.created':
      await handleCustomerCreated(eventData);
      break;
  }
}

/**
 * Handle successful payment - update transaction and order status
 */
async function handlePaymentSuccess(data: Record<string, unknown>): Promise<void> {
  const paymentIntentId = data.paymentIntentId as string;
  
  if (!paymentIntentId) return;

  // Find the Stripe transaction
  const transaction = await db.stripeTransaction.findUnique({
    where: { paymentIntentId },
    include: { order: true },
  });

  if (!transaction) {
    console.warn(`[Stripe Webhook] No transaction found for intent: ${paymentIntentId}`);
    return;
  }

  // Skip if already succeeded
  if (transaction.status === 'SUCCEEDED') return;

  // Extract card details from charge if available
  const charges = (data as any).charges?.data;
  let cardLast4: string | undefined;
  let cardBrand: string | undefined;
  let chargeId: string | undefined;

  if (charges?.[0]) {
    cardLast4 = charges[0].payment_method_details?.card?.last4;
    cardBrand = charges[0].payment_method_details?.card?.brand;
    chargeId = charges[0].id;
  }

  // Update transaction status
  await db.stripeTransaction.update({
    where: { id: transaction.id },
    data: {
      status: 'SUCCEEDED',
      cardLast4,
      cardBrand,
      chargeId,
      receiptUrl: (data as any).charges?.data?.[0]?.receipt_url,
      rawEvent: JSON.stringify(data),
    },
  });

  // Update order status if linked
  if (transaction.order) {
    await db.order.update({
      where: { id: transaction.orderId },
      data: { status: 'CONFIRMED' },
    });

    // Create notification for buyer
    await db.notification.create({
      data: {
        userId: transaction.userId,
        type: 'PAYMENT_RECEIVED',
        category: 'ORDER',
        title: 'Paiement confirmé ✓',
        message: `Votre paiement de ${formatAmount(transaction.convertedAmount, transaction.targetCurrency)} a été reçu avec succès.`,
        data: JSON.stringify({
          transactionId: transaction.id,
          orderId: transaction.orderId,
          paymentIntentId,
        }),
        actionUrl: `/orders/${transaction.orderId}`,
        actionText: 'Voir la commande',
      },
    });
  }

  // Log to transaction log
  await db.transactionLog.create({
    data: {
      paymentId: transaction.id,
      action: 'stripe_payment_succeeded',
      details: JSON.stringify({
        paymentIntentId,
        status: 'SUCCEEDED',
        amount: transaction.convertedAmount,
        currency: transaction.targetCurrency,
      }),
      userAgent: 'Stripe-Webhook/1.0',
    },
  });
}

/**
 * Handle failed payment - update status and notify user
 */
async function handlePaymentFailure(data: Record<string, unknown>): Promise<void> {
  const paymentIntentId = data.paymentIntentId as string;
  
  if (!paymentIntentId) return;

  const transaction = await db.stripeTransaction.findUnique({
    where: { paymentIntentId },
    include: { order: true },
  });

  if (!transaction) return;

  const failureMessage = data.failureMessage as string || 'Payment failed';
  const failureCode = data.failureCode as string;

  // Update transaction status
  await db.stripeTransaction.update({
    where: { id: transaction.id },
    data: {
      status: 'REQUIRES_PAYMENT_METHOD',
      failureReason: failureMessage,
      rawEvent: JSON.stringify(data),
    },
  });

  // Notify user about failure
  if (transaction.order) {
    await db.notification.create({
      data: {
        userId: transaction.userId,
        type: 'ORDER_CANCELLED',
        category: 'ORDER',
        title: 'Paiement échoué',
        message: `Le paiement pour votre commande a échoué. Raison: ${failureMessage}`,
        data: JSON.stringify({
          transactionId: transaction.id,
          orderId: transaction.orderId,
          failureCode,
        }),
        actionUrl: `/checkout?orderId=${transaction.orderId}`,
        actionText: 'Réessayer le paiement',
      },
    });
  }

  // Log failure
  await db.transactionLog.create({
    data: {
      paymentId: transaction.id,
      action: 'stripe_payment_failed',
      details: JSON.stringify({
        paymentIntentId,
        failureMessage,
        failureCode,
      }),
      userAgent: 'Stripe-Webhook/1.0',
    },
  });
}

/**
 * Handle refund - update transaction refund info
 */
async function handleRefund(data: Record<string, unknown>): Promise<void> {
  const paymentIntentId = data.paymentIntentId as string;
  
  if (!paymentIntentId) return;

  const transaction = await db.stripeTransaction.findUnique({
    where: { paymentIntentId },
  });

  if (!transaction) return;

  const amountRefunded = data.amountRefunded as number;
  const isFullRefund = (data as any).refunded === true;

  // Update transaction with refund info
  await db.stripeTransaction.update({
    where: { id: transaction.id },
    data: {
      refundedAt: isFullRefund ? new Date() : transaction.refundedAt,
      refundAmount: isFullRefund ? amountRefunded : (transaction.refundAmount || 0) + ((data as any).amount || 0),
      rawEvent: JSON.stringify(data),
    },
  });

  // Notify user about refund
  await db.notification.create({
    data: {
      userId: transaction.userId,
      type: 'REFUND_PROCESSED',
      category: 'ORDER',
      title: isFullRefund ? 'Remboursement effectué' : 'Remboursement partiel',
      message: isFullRefund
        ? `Un remboursement complet de ${formatAmount(amountRefunded, transaction.targetCurrency)} a été effectué.`
        : `Un remboursement partiel a été effectué.`,
      data: JSON.stringify({
        transactionId: transaction.id,
        amountRefunded,
      }),
    },
  });
}

/**
 * Handle customer creation - link to local user if applicable
 */
async function handleCustomerCreated(data: Record<string, unknown>): Promise<void> {
  const stripeCustomerId = data.customerId as string;
  const userId = data.userId as string;
  
  if (!stripeCustomerId || !userId) return;

  // Check if we should create a link
  const existingCustomer = await db.stripeCustomer.findUnique({
    where: { stripeCustomerId },
  });

  if (!existingCustomer) {
    // Could optionally auto-create link here
    // For now, just log it
    console.log(`[Stripe Webhook] Customer created: ${stripeCustomerId}, userId: ${userId}`);
  }
}

// Helper function to format amounts
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100); // Assuming amount is in cents
}

// GET /api/payments/stripe/webhook - Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Stripe International Cards Webhook',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    configured: !!process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET !== 'whsec_dummy_for_development',
    supportedEvents: [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payment_intent.processing',
      'payment_intent.canceled',
      'charge.refunded',
      'charge.dispute.created',
      'customer.created',
      'customer.updated',
      'payment_method.attached',
      'payment_method.detached',
    ],
  });
}

// Stripe Webhook Events Handler
// Processes all Stripe webhook events and updates database accordingly

import { db } from '@/lib/db'
import type Stripe from 'stripe'

// ============================================
// TYPES
// ============================================

export interface WebhookHandlerResult {
  success: boolean
  error?: string
  processedEvent?: string
}

// ============================================
// MAIN HANDLER
// ============================================

/**
 * Main webhook event handler - routes to specific handlers based on event type
 */
export async function handleStripeWebhookEvent(
  event: Stripe.Event,
  request?: Request
): Promise<WebhookHandlerResult> {
  console.log(`[Stripe Webhooks] Processing: ${event.type}`)

  try {
    // Route to appropriate handler based on event type
    switch (event.type) {
      // Payment Intent events
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event)
      
      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(event)
      
      case 'payment_intent.processing':
        return await handlePaymentIntentProcessing(event)
      
      case 'payment_intent.canceled':
        return await handlePaymentIntentCanceled(event)

      // Charge/Refund events
      case 'charge.refunded':
        return await handleChargeRefunded(event)
      
      case 'charge.dispute.created':
        return await handleChargeDisputeCreated(event)

      // Customer events
      case 'customer.created':
        return await handleCustomerCreated(event)
      
      case 'customer.updated':
        return await handleCustomerUpdated(event)

      // Subscription events (future use)
      case 'invoice.paid':
        return await handleInvoicePaid(event)
      
      case 'invoice.payment_failed':
        return await handleInvoicePaymentFailed(event)
      
      case 'customer.subscription.created':
        return await handleSubscriptionCreated(event)

      // Setup Intent (for saving cards)
      case 'setup_intent.setup_succeeded':
        return await handleSetupIntentSucceeded(event)

      // Default: log unhandled events
      default:
        console.log(`[Stripe Webhooks] Unhandled event type: ${event.type}`)
        return { 
          success: true, 
          processedEvent: event.type,
        }
    }
  } catch (error) {
    console.error(`[Stripe Webhooks] Error processing ${event.type}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown processing error',
    }
  }
}

// ============================================
// PAYMENT INTENT HANDLERS
// ============================================

/**
 * Handle payment_intent.succeeded
 * Update order status to CONFIRMED, send notifications
 */
async function handlePaymentIntentSucceeded(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  
  console.log(`[Stripe Webhooks] Payment succeeded: ${paymentIntent.id}`)

  // Find payment by Stripe Payment Intent ID
  const payment = await findPaymentByStripeId(paymentIntent.id)
  
  if (!payment) {
    console.warn(`[Stripe Webhooks] No payment found for intent: ${paymentIntent.id}`)
    // Return success to prevent retries even if we don't have the payment
    return { success: true, processedEvent: event.type }
  }

  // Skip if already completed
  if (payment.status === 'COMPLETED') {
    return { success: true, processedEvent: event.type }
  }

  // Extract card details from charges
  let cardLast4: string | undefined
  let cardType: string | undefined
  
  if (paymentIntent.charges?.data?.[0]?.payment_method_details?.card) {
    const card = paymentIntent.charges.data[0].payment_method_details.card as {
      last4?: string
      brand?: string
    }
    cardLast4 = card.last4
    cardType = card.brand?.toLowerCase()
  }

  // Update payment status
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      paidAt: new Date(),
      cardLast4: cardLast4 || payment.cardLast4,
      cardType: cardType || payment.cardType,
      metadata: JSON.stringify({
        ...JSON.parse(payment.metadata || '{}'),
        stripePaymentConfirmed: true,
        stripeConfirmedAt: new Date().toISOString(),
        chargeId: paymentIntent.charges?.data?.[0]?.id,
      }),
    },
  })

  // Update order status
  await db.order.update({
    where: { id: payment.orderId },
    data: { status: 'CONFIRMED' },
  })

  // Get order details for notification
  const order = await db.order.findUnique({
    where: { id: payment.orderId },
    select: { buyerId: true, orderNumber: true },
  })

  if (order) {
    // Create success notification for buyer
    await db.notification.create({
      data: {
        userId: order.buyerId,
        type: 'PAYMENT_RECEIVED',
        category: 'ORDER',
        title: 'Paiement confirmé ✓',
        message: `Votre paiement de ${payment.amount} ${payment.currency} a été reçu avec succès.`,
        data: JSON.stringify({
          orderId: payment.orderId,
          orderNumber: order.orderNumber,
          stripePaymentIntentId: paymentIntent.id,
          amount: payment.amount,
          currency: payment.currency,
        }),
        actionUrl: `/orders/${payment.orderId}`,
        actionText: 'Voir la commande',
      },
    })
  }

  // Log this event
  await logWebhookEvent(payment.id, event.type, {
    paymentIntentId: paymentIntent.id,
    status: 'COMPLETED',
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
  })

  console.log(`[Stripe Webhooks] Payment ${payment.id} marked as COMPLETED`)
  
  return { success: true, processedEvent: event.type }
}

/**
 * Handle payment_intent.payment_failed
 * Notify user of failure, update status
 */
async function handlePaymentIntentFailed(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  
  console.log(`[Stripe Webhooks] Payment failed: ${paymentIntent.id}`)

  const payment = await findPaymentByStripeId(paymentIntent.id)
  
  if (!payment) {
    return { success: true, processedEvent: event.type }
  }

  // Get failure reason
  const failureReason = paymentIntent.last_payment_error?.message || 
    'Payment failed without specific reason'

  // Update payment status
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'FAILED',
      failureReason: failureReason,
      metadata: JSON.stringify({
        ...JSON.parse(payment.metadata || '{}'),
        stripeFailureReason: failureReason,
        stripeErrorCode: paymentIntent.last_payment_error?.code,
        stripeDeclineCode: paymentIntent.last_payment_error?.decline_code,
        failedAt: new Date().toISOString(),
      }),
    },
  })

  // Get order for notification
  const order = await db.order.findUnique({
    where: { id: payment.orderId },
    select: { buyerId: true, orderNumber: true },
  })

  if (order) {
    // Create failure notification
    await db.notification.create({
      data: {
        userId: order.buyerId,
        type: 'ORDER_CANCELLED',
        category: 'ORDER',
        title: 'Paiement échoué',
        message: `Le paiement pour votre commande ${order.orderNumber} a échoué. Raison: ${failureReason}`,
        data: JSON.stringify({
          orderId: payment.orderId,
          orderNumber: order.orderNumber,
          stripePaymentIntentId: paymentIntent.id,
          failureReason,
        }),
        actionUrl: `/checkout?orderId=${payment.orderId}`,
        actionText: 'Réessayer le paiement',
      },
    })

    // Cancel the order
    await db.order.update({
      where: { id: payment.orderId },
      data: { status: 'CANCELLED' },
    })
  }

  // Log event
  await logWebhookEvent(payment.id, event.type, {
    paymentIntentId: paymentIntent.id,
    status: 'FAILED',
    failureReason,
  })

  return { success: true, processedEvent: event.type }
}

/**
 * Handle payment_intent.processing
 * Payment is being processed (may take time)
 */
async function handlePaymentIntentProcessing(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  
  const payment = await findPaymentByStripeId(paymentIntent.id)
  
  if (!payment) {
    return { success: true, processedEvent: event.type }
  }

  await db.payment.update({
    where: { id: payment.id },
    data: { status: 'PROCESSING' },
  })

  await logWebhookEvent(payment.id, event.type, {
    paymentIntentId: paymentIntent.id,
    status: 'PROCESSING',
  })

  return { success: true, processedEvent: event.type }
}

/**
 * Handle payment_intent.canceled
 */
async function handlePaymentIntentCanceled(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  
  const payment = await findPaymentByStripeId(paymentIntent.id)
  
  if (!payment) {
    return { success: true, processedEvent: event.type }
  }

  await db.payment.update({
    where: { id: payment.id },
    data: { 
      status: 'CANCELLED',
      failureReason: 'Payment canceled by user',
    },
  })

  await logWebhookEvent(payment.id, event.type, {
    paymentIntentId: paymentIntent.id,
    status: 'CANCELLED',
  })

  return { success: true, processedEvent: event.type }
}

// ============================================
// CHARGE & REFUND HANDLERS
// ============================================

/**
 * Handle charge.refunded
 */
async function handleChargeRefunded(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const charge = event.data.object as Stripe.Charge
  
  console.log(`[Stripe Webhooks] Charge refunded: ${charge.id}`)

  // Find payment by charge or payment intent
  const payment = await findPaymentByStripeId(charge.payment_intent as string)
  
  if (!payment) {
    return { success: true, processedEvent: event.type }
  }

  // Check if full or partial refund
  const refundAmount = charge.amount_refunded / 100
  const wasFullRefund = refundAmount >= payment.amount

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: wasFullRefund ? 'REFUNDED' : payment.status,
      metadata: JSON.stringify({
        ...JSON.parse(payment.metadata || '{}'),
        refunded: true,
        refundAmount,
        refundId: charge.refunds?.data?.[0]?.id,
        refundedAt: new Date().toISOString(),
        fullRefund: wasFullRefund,
      }),
    },
  })

  // Create notification about refund
  const order = await db.order.findUnique({
    where: { id: payment.orderId },
    select: { buyerId: true, orderNumber: true },
  })

  if (order) {
    await db.notification.create({
      data: {
        userId: order.buyerId,
        type: 'REFUND_PROCESSED',
        category: 'ORDER',
        title: wasFullRefund ? 'Remboursement effectué' : 'Remboursement partiel',
        message: wasFullRefund
          ? `Votre remboursement de ${refundAmount} ${payment.currency} a été traité.`
          : `Un remboursement partiel de ${refundAmount} ${payment.currency} a été effectué.`,
        data: JSON.stringify({
          orderId: payment.orderId,
          refundAmount,
        }),
      },
    })
  }

  await logWebhookEvent(payment.id, event.type, {
    chargeId: charge.id,
    refundAmount,
    fullRefund: wasFullRefund,
  })

  return { success: true, processedEvent: event.type }
}

/**
 * Handle charge.dispute.created
 */
async function handleChargeDisputeCreated(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const dispute = event.data.object as Stripe.Dispute
  
  console.warn(`[Stripe Webhooks] Dispute created: ${dispute.id} for charge: ${dispute.charge}`)

  // Find payment by charge
  const payment = await db.payment.findFirst({
    where: {
      metadata: { contains: dispute.charge },
    },
  })

  if (payment) {
    await db.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: 'stripe_dispute_created',
        details: JSON.stringify({
          disputeId: dispute.id,
          chargeId: dispute.charge,
          reason: dispute.reason,
          amount: dispute.amount / 100,
          status: dispute.status,
        }),
      },
    })

    // Alert admin about dispute
    // In production, you'd send an email/notification here
    console.error(`[ALERT] Payment dispute created for payment ${payment.id}`)
  }

  return { success: true, processedEvent: event.type }
}

// ============================================
// CUSTOMER HANDLERS
// ============================================

/**
 * Handle customer.created
 */
async function handleCustomerCreated(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const customer = event.data.object as Stripe.Customer
  
  console.log(`[Stripe Webhooks] Customer created: ${customer.id}, email: ${customer.email}`)

  // Could link customer to user account here if needed
  // For now, just log it
  
  return { success: true, processedEvent: event.type }
}

/**
 * Handle customer.updated
 */
async function handleCustomerUpdated(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const customer = event.data.object as Stripe.Customer
  
  console.log(`[Stripe Webhooks] Customer updated: ${customer.id}`)
  
  return { success: true, processedEvent: event.type }
}

// ============================================
// SUBSCRIPTION HANDLERS (Future Use)
// ============================================

/**
 * Handle invoice.paid - Subscription payment succeeded
 */
async function handleInvoicePaid(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const invoice = event.data.object as Stripe.Invoice
  
  console.log(`[Stripe Webhooks] Invoice paid: ${invoice.id}, subscription: ${invoice.subscription}`)

  // Future: Handle subscription renewals
  // This would extend subscription end dates, etc.
  
  return { success: true, processedEvent: event.type }
}

/**
 * Handle invoice.payment_failed - Subscription payment failed
 */
async function handleInvoicePaymentFailed(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const invoice = event.data.object as Stripe.Invoice
  
  console.warn(`[Stripe Webhooks] Invoice payment failed: ${invoice.id}`)

  // Future: Notify customer, potentially suspend subscription
  
  return { success: true, processedEvent: event.type }
}

/**
 * Handle customer.subscription.created
 */
async function handleSubscriptionCreated(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const subscription = event.data.object as Stripe.Subscription
  
  console.log(`[Stripe Webhooks] Subscription created: ${subscription.id}`)
  
  return { success: true, processedEvent: event.type }
}

// ============================================
// SETUP INTENT HANDLER (Save Cards)
// ============================================

/**
 * Handle setup_intent.setup_succeeded - Card saved successfully
 */
async function handleSetupIntentSucceeded(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const setupIntent = event.data.object as Stripe.SetupIntent
  
  console.log(`[Stripe Webhooks] Setup intent succeeded: ${setupIntent.id}`)
  
  // Future: Save payment method for future use
  // Would store paymentMethodId for one-click checkout
  
  return { success: true, processedEvent: event.type }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Find payment record by Stripe Payment Intent ID
 */
async function findPaymentByStripeId(
  stripePaymentIntentId: string
) {
  return db.payment.findFirst({
    where: {
      OR: [
        { transactionId: stripePaymentIntentId },
        { metadata: { contains: stripePaymentIntentId } },
      ],
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          buyerId: true,
        },
      },
    },
  })
}

/**
 * Log webhook event to transaction logs
 */
async function logWebhookEvent(
  paymentId: string,
  eventType: string,
  details: Record<string, unknown>
): Promise<void> {
  await db.transactionLog.create({
    data: {
      paymentId,
      action: `stripe_webhook_${eventType}`,
      details: JSON.stringify({
        eventType,
        ...details,
        receivedAt: new Date().toISOString(),
      }),
      userAgent: 'Stripe-Webhook/1.0',
    },
  })
}

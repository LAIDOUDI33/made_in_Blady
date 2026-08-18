// AlgeriaTrade.dz - Stripe International Cards Client
// Handles all Stripe operations for export orders

import Stripe from 'stripe';
import { stripe, stripeConfig, calculateStripeFees, isCurrencySupported, getMinimumAmount } from './config';
import type {
  StripePaymentRequest,
  StripePaymentResponse,
  StripeConfirmResponse,
  StripeCustomerRequest,
  StripeCustomerResponse,
  SavedPaymentMethod,
  StripeRefundRequest,
  StripeRefundResponse,
  ExchangeRate,
  PaymentMethodType,
  StripeTransactionStatus,
} from './types';

// ============================================
// CURRENCY CONVERSION
// ============================================

/**
 * Convert DZD amount to target currency using live rates
 * Falls back to cached or default rates if API unavailable
 */
export async function convertCurrency(
  amountDZD: number,
  targetCurrency: string
): Promise<{ convertedAmount: number; exchangeRate: number }> {
  // Import exchange rate service dynamically to avoid circular dependencies
  const { getExchangeRate } = await import('../exchange-rates');
  
  try {
    const rate = await getExchangeRate('DZD', targetCurrency);
    const convertedAmount = Math.round(amountDZD * rate.rate * 100) / 100;
    
    return {
      convertedAmount: Math.round(convertedAmount * 100), // Convert to cents
      exchangeRate: rate.rate,
    };
  } catch (error) {
    console.warn('[Stripe Client] Exchange rate fetch failed, using fallback:', error);
    
    // Fallback exchange rates (DZD to target currency)
    const fallbackRates: Record<string, number> = {
      EUR: 0.0069,
      USD: 0.0075,
      GBP: 0.0059,
      CHF: 0.0072,
      CAD: 0.0101,
      AUD: 0.0113,
    };
    
    const rate = fallbackRates[targetCurrency] || 0.007;
    
    return {
      convertedAmount: Math.round(amountDZD * rate * 100), // Convert to cents
      exchangeRate: rate,
    };
  }
}

// ============================================
// PAYMENT INTENT OPERATIONS
// ============================================

/**
 * Create a new Payment Intent for international card payment
 */
export async function createPaymentIntent(
  request: StripePaymentRequest
): Promise<StripePaymentResponse> {
  try {
    // Validate inputs
    if (!request.amount || request.amount <= 0) {
      throw new Error('Invalid amount: must be greater than 0');
    }

    if (!isCurrencySupported(request.currency)) {
      throw new Error(`Unsupported currency: ${request.currency}`);
    }

    if (!request.customerEmail) {
      throw new Error('Customer email is required');
    }

    // Convert DZD to target currency
    const { convertedAmount, exchangeRate } = await convertCurrency(
      request.amount,
      request.currency
    );

    // Check minimum amount
    const minAmount = getMinimumAmount(request.currency);
    if (convertedAmount < minAmount) {
      throw new Error(`Minimum amount for ${request.currency} is ${minAmount / 100}`);
    }

    // Calculate estimated fees
    const fees = calculateStripeFees(convertedAmount, request.currency);

    // Create or get Stripe customer
    let stripeCustomerId: string | undefined;
    if (request.customerId || request.savePaymentMethod) {
      const customerResult = await createCustomer({
        userId: request.customerId || '',
        email: request.customerEmail,
        name: request.customerName,
      });
      
      if (customerResult.success && customerResult.stripeCustomerId) {
        stripeCustomerId = customerResult.stripeCustomerId;
      }
    }

    // Build payment intent parameters
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: convertedAmount,
      currency: request.currency.toLowerCase(),
      customer: stripeCustomerId,
      receipt_email: request.customerEmail,
      description: request.description || `AlgeriaTrade.dz Export Order - ${request.orderId}`,
      metadata: {
        orderId: request.orderId,
        platform: 'algeriatrade-dz',
        originalAmountDZD: request.amount.toString(),
        targetCurrency: request.currency,
        exchangeRate: exchangeRate.toString(),
        ...(request.metadata || {}),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Setup for saving payment method or recurring payments
    if (request.savePaymentMethod || request.setupFutureUsage) {
      paymentIntentParams.setup_future_usage = request.setupFutureUsage || 'off_session';
    }

    // Configure payment method options based on currency
    paymentIntentParams.payment_method_options = getPaymentMethodOptions(request.currency);

    // Add shipping information for export orders
    if (request.shippingAddress) {
      paymentIntentParams.shipping = {
        name: request.customerName,
        address: {
          line1: request.shippingAddress.line1,
          line2: request.shippingAddress.line2,
          city: request.shippingAddress.city,
          state: request.shippingAddress.state,
          postal_code: request.shippingAddress.postalCode,
          country: request.shippingAddress.country,
        },
      };
    }

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      publishableKey: stripeConfig.publishableKey,
      amount: request.amount,
      currency: request.currency,
      convertedAmount: paymentIntent.amount,
      exchangeRate,
      estimatedFees: fees.feeAmount,
      status: paymentIntent.status,
      createdAt: new Date(paymentIntent.created * 1000).toISOString(),
    };
  } catch (error) {
    console.error('[Stripe Client] createPaymentIntent error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      throw new StripeErrorAdapter(error);
    }
    
    throw error;
  }
}

/**
 * Get payment method options based on currency
 */
function getPaymentMethodOptions(currency: string): Stripe.PaymentIntentCreateParams.PaymentMethodOptions {
  const baseOptions: Stripe.PaymentIntentCreateParams.PaymentMethodOptions = {
    card: {
      request_three_d_secure: 'automatic',
    },
  };

  // Add SEPA options for Euro
  if (currency === 'EUR') {
    baseOptions.sepa_debit = {};
    baseOptions.ideal = {};
    baseOptions.bancontact = {};
    baseOptions.sofort = {};
    baseOptions.giropay = {};
    baseOptions.eps = {};
    baseOptions.p24 = {};
  }

  // Add UK-specific options
  if (currency === 'GBP') {
    baseOptions.bacs_debit = {};
  }

  return baseOptions;
}

/**
 * Confirm a payment intent on the server side
 */
export async function confirmPayment(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<StripeConfirmResponse> {
  try {
    let paymentIntent: Stripe.PaymentIntent;

    if (paymentMethodId) {
      paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/payments/return`,
      });
    } else {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    }

    // Handle next actions (3D Secure, etc.)
    if (paymentIntent.next_action?.type === 'redirect_to_url') {
      return {
        success: false,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        nextAction: {
          type: 'redirect_to_url',
          url: paymentIntent.next_action.redirect_to_url?.url,
        },
      };
    }

    if (paymentIntent.next_action?.type === 'use_stripe_sdk') {
      return {
        success: false,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        nextAction: {
          type: 'use_stripe_sdk',
        },
      };
    }

    return {
      success: paymentIntent.status === 'succeeded',
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      error: paymentIntent.last_payment_error?.message,
    };
  } catch (error) {
    console.error('[Stripe Client] confirmPayment error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message,
        errorCode: error.code,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Confirmation failed',
    };
  }
}

/**
 * Retrieve payment intent details
 */
export async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('[Stripe Client] retrievePaymentIntent error:', error);
    return null;
  }
}

// ============================================
// CUSTOMER OPERATIONS
// ============================================

/**
 * Create a new Stripe customer or retrieve existing one
 */
export async function createCustomer(
  request: StripeCustomerRequest
): Promise<StripeCustomerResponse> {
  try {
    // Check if customer already exists by email
    const existingCustomers = await stripe.customers.list({
      email: request.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const existing = existingCustomers.data[0];
      return {
        success: true,
        stripeCustomerId: existing.id,
        customer: {
          id: existing.id,
          email: existing.email || '',
          name: existing.name,
          created: existing.created,
        },
      };
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: request.email,
      name: request.name,
      phone: request.phone,
      metadata: {
        userId: request.userId,
        platform: 'algeriatrade-dz',
        ...(request.metadata || {}),
      },
      address: request.address,
    });

    return {
      success: true,
      stripeCustomerId: customer.id,
      customer: {
        id: customer.id,
        email: customer.email || '',
        name: customer.name,
        created: customer.created,
      },
    };
  } catch (error) {
    console.error('[Stripe Client] createCustomer error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create customer',
    };
  }
}

/**
 * Retrieve customer's saved payment methods
 */
export async function getCustomerPaymentMethods(
  stripeCustomerId: string,
  type?: PaymentMethodType
): Promise<SavedPaymentMethod[]> {
  try {
    const params: Stripe.PaymentMethodListParams = {
      customer: stripeCustomerId,
      type: type || 'card',
    };

    const paymentMethods = await stripe.paymentMethods.list(params);

    return paymentMethods.data.map((pm) => ({
      id: pm.id,
      type: pm.type,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.metadata?.isDefault === 'true',
      createdAt: new Date(pm.created * 1000).toISOString(),
    }));
  } catch (error) {
    console.error('[Stripe Client] getCustomerPaymentMethods error:', error);
    return [];
  }
}

/**
 * Attach a payment method to a customer
 */
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return { success: true };
  } catch (error) {
    console.error('[Stripe Client] attachPaymentMethod error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to attach payment method',
    };
  }
}

/**
 * Detach (remove) a payment method from a customer
 */
export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    return { success: true };
  } catch (error) {
    console.error('[Stripe Client] detachPaymentMethod error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to detach payment method',
    };
  }
}

/**
 * Set default payment method for a customer
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update the payment method metadata to mark as default
    await stripe.paymentMethods.update(paymentMethodId, {
      metadata: { isDefault: 'true' },
    });

    // Update customer's default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[Stripe Client] setDefaultPaymentMethod error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set default payment method',
    };
  }
}

// ============================================
// REFUND OPERATIONS
// ============================================

/**
 * Process a refund for a payment intent
 */
export async function processRefund(
  request: StripeRefundRequest
): Promise<StripeRefundResponse> {
  try {
    // Verify payment intent exists
    const paymentIntent = await stripe.paymentIntents.retrieve(request.paymentIntentId);
    
    if (!paymentIntent) {
      return {
        success: false,
        error: 'Payment intent not found',
      };
    }

    // Check if payment can be refunded
    if (paymentIntent.status !== 'succeeded') {
      return {
        success: false,
        error: `Cannot refund payment with status: ${paymentIntent.status}`,
      };
    }

    // Calculate refundable amount
    const refundableAmount = paymentIntent.amount - (paymentIntent.amount_refunded || 0);
    
    if (request.amount && request.amount > refundableAmount) {
      return {
        success: false,
        error: `Refund amount exceeds refundable amount. Maximum: ${refundableAmount}`,
      };
    }

    // Create refund
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: request.paymentIntentId,
      reason: request.reason || 'requested_by_customer',
      metadata: request.metadata,
    };

    // Add amount for partial refunds
    if (request.amount) {
      refundParams.amount = request.amount;
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount,
      currency: refund.currency.toUpperCase(),
    };
  } catch (error) {
    console.error('[Stripe Client] processRefund error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund processing failed',
    };
  }
}

// ============================================
// WEBHOOK HANDLING
// ============================================

/**
 * Construct and verify a webhook event from raw payload
 */
export function handleWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeConfig.webhookSecret
    );
  } catch (error) {
    console.error('[Stripe Client] Webhook verification failed:', error);
    throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process webhook event and return standardized result
 */
export async function processWebhookEvent(event: Stripe.Event): Promise<{
  processed: boolean;
  eventType: string;
  data: Record<string, unknown>;
  error?: string;
}> {
  console.log(`[Stripe Client] Processing webhook event: ${event.type}`);

  const result = {
    processed: true,
    eventType: event.type,
    data: {} as Record<string, unknown>,
  };

  switch (event.type) {
    case 'payment_intent.succeeded':
      result.data = handlePaymentIntentSucceeded(event);
      break;

    case 'payment_intent.payment_failed':
      result.data = handlePaymentIntentFailed(event);
      break;

    case 'charge.refunded':
      result.data = handleChargeRefunded(event);
      break;

    case 'customer.created':
      result.data = handleCustomerCreated(event);
      break;

    case 'payment_method.attached':
      result.data = handlePaymentMethodAttached(event);
      break;

    case 'payment_method.detached':
      result.data = handlePaymentMethodDetached(event);
      break;

    default:
      console.log(`[Stripe Client] Unhandled event type: ${event.type}`);
      result.processed = false;
  }

  return result;
}

function handlePaymentIntentSucceeded(event: Stripe.Event): Record<string, unknown> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  return {
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    orderId: paymentIntent.metadata?.orderId,
    customer: paymentIntent.customer,
  };
}

function handlePaymentIntentFailed(event: Stripe.Event): Record<string, unknown> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  return {
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    failureMessage: paymentIntent.last_payment_error?.message,
    failureCode: paymentIntent.last_payment_error?.code,
    declineCode: paymentIntent.last_payment_error?.decline_code,
    orderId: paymentIntent.metadata?.orderId,
  };
}

function handleChargeRefunded(event: Stripe.Event): Record<string, unknown> {
  const charge = event.data.object as Stripe.Charge;
  return {
    chargeId: charge.id,
    paymentIntentId: charge.payment_intent,
    amountRefunded: charge.amount_refunded,
    refunded: charge.refunded,
    orderId: charge.metadata?.orderId,
  };
}

function handleCustomerCreated(event: Stripe.Event): Record<string, unknown> {
  const customer = event.data.object as Stripe.Customer;
  return {
    customerId: customer.id,
    email: customer.email,
    name: customer.name,
    userId: customer.metadata?.userId,
  };
}

function handlePaymentMethodAttached(event: Stripe.Event): Record<string, unknown> {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;
  return {
    paymentMethodId: paymentMethod.id,
    type: paymentMethod.type,
    customer: paymentMethod.customer,
    cardBrand: paymentMethod.card?.brand,
    cardLast4: paymentMethod.card?.last4,
  };
}

function handlePaymentMethodDetached(event: Stripe.Event): Record<string, unknown> {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;
  return {
    paymentMethodId: paymentMethod.id,
    type: paymentMethod.type,
    customer: paymentMethod.customer,
  };
}

// ============================================
// ERROR ADAPTER
// ============================================

class StripeErrorAdapter extends Error {
  code: string;
  type: string;
  decline_code?: string;
  doc_url?: string;

  constructor(stripeError: Stripe.errors.StripeError) {
    super(stripeError.message);
    this.name = 'StripeError';
    this.code = stripeError.code || 'unknown';
    this.type = stripeError.type || 'unknown';
    this.decline_code = (stripeError as any).decline_code;
    this.doc_url = (stripeError as any).doc_url;
  }
}

// ============================================
// EXPORT UTILITIES
// ============================================

/**
 * Calculate fees for display purposes
 */
export function calculateFeesForDisplay(amountInCents: number, currency: string): {
  processingFee: string;
  totalAmount: string;
  youReceive: string;
} {
  const fees = calculateStripeFees(amountInCents, currency);
  
  const format = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  return {
    processingFee: format(fees.feeAmount),
    totalAmount: format(fees.totalAmount),
    youReceive: format(fees.netAmount),
  };
}

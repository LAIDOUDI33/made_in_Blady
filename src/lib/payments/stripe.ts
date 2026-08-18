// Stripe Payment Integration for AlgeriaTrade.dz
// Handles international card payments (USD, EUR, etc.)
// Documentation: https://stripe.com/docs

import Stripe from 'stripe'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface StripeConfig {
  secretKey: string
  publishableKey: string
  webhookSecret: string
  environment: 'test' | 'production'
}

export interface StripePaymentIntentInput {
  amount: number
  currency: string // USD, EUR, DZD (if supported)
  orderId: string
  customerId?: string
  customerEmail: string
  customerName: string
  metadata?: Record<string, string>
}

export interface StripePaymentResult {
  success: boolean
  clientSecret?: string
  paymentIntentId?: string
  publishableKey?: string
  error?: string
  errorCode?: string
}

export interface StripeCustomerResult {
  success: boolean
  customerId?: string
  error?: string
}

export interface StripeRefundResult {
  success: boolean
  refundId?: string
  status?: string
  error?: string
}

export interface StripeSubscriptionResult {
  success: boolean
  subscriptionId?: string
  clientSecret?: string
  error?: string
}

// ============================================
// CONFIGURATION & INITIALIZATION
// ============================================

let stripeClient: Stripe | null = null
let stripeConfig: StripeConfig | null = null

/**
 * Initialize Stripe with credentials
 * Call this once during application startup
 */
export function initializeStripe(config: StripeConfig): void {
  stripeConfig = config
  stripeClient = new Stripe(config.secretKey, {
    apiVersion: '2024-06-20',
    typescript: true,
  })
  
  if (config.environment === 'test') {
    console.log('[Stripe] Initialized in TEST mode')
  } else {
    console.log('[Stripe] Initialized in PRODUCTION mode')
  }
}

/**
 * Get current Stripe client instance
 * @throws Error if not initialized
 */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    throw new Error('Stripe not initialized. Call initializeStripe() first.')
  }
  return stripeClient
}

/**
 * Get current Stripe configuration
 */
export function getStripeConfig(): StripeConfig {
  if (!stripeConfig) {
    throw new Error('Stripe not initialized. Call initializeStripe() first.')
  }
  return stripeConfig
}

// ============================================
// PAYMENT INTENT OPERATIONS
// ============================================

/**
 * Create a new Stripe Payment Intent
 * Returns clientSecret for frontend to complete payment
 */
export async function createStripePaymentIntent(
  data: StripePaymentIntentInput
): Promise<StripePaymentResult> {
  const stripe = getStripeClient()
  const config = getStripeConfig()
  
  try {
    // Validate amount
    if (!data.amount || data.amount <= 0) {
      return {
        success: false,
        error: 'Invalid amount',
        errorCode: 'INVALID_AMOUNT',
      }
    }

    // Validate currency (Stripe uses lowercase currency codes)
    const validCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud', 'dzd']
    const normalizedCurrency = data.currency.toLowerCase()
    
    if (!validCurrencies.includes(normalizedCurrency)) {
      return {
        success: false,
        error: `Unsupported currency: ${data.currency}`,
        errorCode: 'INVALID_CURRENCY',
      }
    }

    // Create or get customer
    let customerId = data.customerId
    if (!customerId && data.customerEmail) {
      const customerResult = await createStripeCustomer(
        data.customerEmail,
        data.customerName
      )
      if (customerResult.success && customerResult.customerId) {
        customerId = customerResult.customerId
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Stripe amounts are in cents
      currency: normalizedCurrency,
      customer: customerId || undefined,
      receipt_email: data.customerEmail,
      metadata: {
        orderId: data.orderId,
        platform: 'algeriatrade-dz',
        ...(data.metadata || {}),
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // Setup for 3D Secure / SCA compliance
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic' as const,
        },
      },
    })

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey: config.publishableKey,
    }
  } catch (error) {
    console.error('[Stripe] createStripePaymentIntent error:', error)
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message,
        errorCode: error.code || 'STRIPE_ERROR',
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'INTERNAL_ERROR',
    }
  }
}

/**
 * Confirm a Stripe Payment Intent (server-side confirmation)
 */
export async function confirmStripePayment(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<StripePaymentResult> {
  const stripe = getStripeClient()
  
  try {
    let paymentIntent: Stripe.PaymentIntent

    if (paymentMethodId) {
      // Confirm with a specific payment method
      paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      })
    } else {
      // Just retrieve current status
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    }

    return {
      success: paymentIntent.status === 'succeeded',
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    }
  } catch (error) {
    console.error('[Stripe] confirmStripePayment error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message,
        errorCode: error.code || 'STRIPE_ERROR',
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Confirmation failed',
      errorCode: 'CONFIRM_ERROR',
    }
  }
}

/**
 * Retrieve Payment Intent status
 */
export async function retrieveStripePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  const stripe = getStripeClient()
  
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch (error) {
    console.error('[Stripe] retrieveStripePaymentIntent error:', error)
    return null
  }
}

// ============================================
// CUSTOMER OPERATIONS
// ============================================

/**
 * Create a new Stripe Customer
 */
export async function createStripeCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<StripeCustomerResult> {
  const stripe = getStripeClient()
  
  try {
    // Check if customer already exists by email
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      return {
        success: true,
        customerId: existingCustomers.data[0].id,
      }
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        platform: 'algeriatrade-dz',
        ...(metadata || {}),
      },
    })

    return {
      success: true,
      customerId: customer.id,
    }
  } catch (error) {
    console.error('[Stripe] createStripeCustomer error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create customer',
    }
  }
}

/**
 * Retrieve a Stripe Customer
 */
export async function retrieveStripeCustomer(
  customerId: string
): Promise<Stripe.Customer | null> {
  const stripe = getStripeClient()
  
  try {
    return await stripe.customers.retrieve(customerId) as Stripe.Customer
  } catch (error) {
    console.error('[Stripe] retrieveStripeCustomer error:', error)
    return null
  }
}

// ============================================
// REFUND OPERATIONS
// ============================================

/**
 * Process a refund for a Payment Intent
 */
export async function refundStripePayment(
  paymentIntentId: string,
  amount?: number // If omitted, full refund
): Promise<StripeRefundResult> {
  const stripe = getStripeClient()
  
  try {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    }

    // Add amount for partial refund (in cents)
    if (amount && amount > 0) {
      refundParams.amount = Math.round(amount * 100)
    }

    const refund = await stripe.refunds.create(refundParams)

    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
    }
  } catch (error) {
    console.error('[Stripe] refundStripePayment error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund failed',
    }
  }
}

// ============================================
// SUBSCRIPTION OPERATIONS (Future Use)
// ============================================

/**
 * Setup a subscription for recurring payments
 * For future use with premium features
 */
export async function setupStripeSubscription(
  customerId: string,
  priceId: string,
  trialPeriodDays?: number
): Promise<StripeSubscriptionResult> {
  const stripe = getStripeClient()
  
  try {
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    }

    if (trialPeriodDays) {
      subscriptionParams.trial_period_days = trialPeriodDays
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams)

    // Get client secret from invoice's payment intent
    const invoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent

    return {
      success: true,
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret,
    }
  } catch (error) {
    console.error('[Stripe] setupStripeSubscription error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Subscription setup failed',
    }
  }
}

// ============================================
// WEBHOOK HANDLING
// ============================================

/**
 * Construct an event from webhook payload and signature
 * Use this in your webhook handler route
 */
export function constructStripeWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const config = getStripeConfig()
  
  return stripeClient!.webhooks.constructEvent(
    payload,
    signature,
    config.webhookSecret
  )
}

/**
 * Verify webhook signature without constructing full event
 */
export function verifyStripeWebhookSignature(
  payload: string | Buffer,
  signature: string
): boolean {
  const config = getStripeConfig()
  
  try {
    stripeClient!.webhooks.constructEvent(
      payload,
      signature,
      config.webhookSecret
    )
    return true
  } catch {
    return false
  }
}

// ============================================
// CURRENCY HELPERS
// ============================================

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
] as const

export type SupportedCurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code']

/**
 * Format amount with currency symbol
 */
export function formatStripeAmount(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  })
  return formatter.format(amount)
}

/**
 * Convert DZD to another currency (simplified - use real rates in production)
 */
export function convertFromDZD(
  amountDZD: number,
  targetCurrency: string
): number {
  // Simplified exchange rates - in production, use a real API
  const rates: Record<string, number> = {
    USD: 0.0074,   // 1 DZD ≈ 0.0074 USD
    EUR: 0.0068,   // 1 DZD ≈ 0.0068 EUR
    GBP: 0.0059,   // 1 DZD ≈ 0.0059 GBP
    CAD: 0.0101,   // 1 DZD ≈ 0.0101 CAD
    AUD: 0.0115,   // 1 DZD ≈ 0.0115 AUD
  }

  const rate = rates[targetCurrency.toUpperCase()] || 1
  return Math.round(amountDZD * rate * 100) / 100
}

// ============================================
// ERROR MESSAGES (Multilingual)
// ============================================

export const STRIPE_ERRORS: Record<string, { fr: string; ar: string; en: string }> = {
  INVALID_AMOUNT: {
    fr: 'Montant invalide',
    ar: 'المبلغ غير صالح',
    en: 'Invalid amount',
  },
  INVALID_CURRENCY: {
    fr: 'Devise non supportée',
    ar: 'العملة غير مدعومة',
    en: 'Unsupported currency',
  },
  CARD_DECLINED: {
    fr: 'Carte refusée',
    ar: 'تم رفض البطاقة',
    en: 'Card declined',
  },
  INSUFFICIENT_FUNDS: {
    fr: 'Fonds insuffisants',
    ar: 'رصيد غير كافٍ',
    en: 'Insufficient funds',
  },
  INCORRECT_CVC: {
    fr: 'CVC incorrect',
    ar: 'رمز التحقق غير صحيح',
    en: 'Incorrect CVC',
  },
  EXPIRED_CARD: {
    fr: 'Carte expirée',
    ar: 'البطاقة منتهية الصلاحية',
    en: 'Expired card',
  },
  PROCESSING_ERROR: {
    fr: 'Erreur de traitement',
    ar: 'خطأ في المعالجة',
    en: 'Processing error',
  },
  THREE_D_SECURE_REQUIRED: {
    fr: 'Authentification 3D Secure requise',
    ar: 'مطلوب مصادقة آمنة ثلاثية الأبعاد',
    en: '3D Secure authentication required',
  },
}

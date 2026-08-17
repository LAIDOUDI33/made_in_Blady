// SATIM (Système Algérien de Télécompensation Interbancaire et Monétique)
// Official CIB payment gateway for Algeria
// Documentation: https://www.satim.dz

import crypto from 'crypto'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface SATIMConfig {
  merchantId: string
  merchantKey: string
  environment: 'test' | 'production'
  endpoint: string // https://payment.cib.dz or test URL
}

export interface SATIMPaymentRequest {
  amount: number
  currency: string // DZD only for SATIM
  orderId: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  returnUrl: string
  cancelUrl: string
  notificationUrl: string // Webhook
}

export interface SATIMResponse {
  success: boolean
  transactionId?: string
  redirectUrl?: string // Redirect user here for 3D Secure
  error?: string
  errorCode?: string
}

export interface SATIMTransactionStatus {
  transactionId: string
  orderId: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  amount: number
  currency: string
  paidAt?: Date
  authCode?: string
  cardLast4?: string
  cardType?: string
}

export interface SATIMWebhookPayload {
  transactionId: string
  orderId: string
  status: string
  amount: number
  currency: string
  signature: string
  timestamp: string
  [key: string]: unknown
}

// ============================================
// CONFIGURATION
// ============================================

let satimConfig: SATIMConfig | null = null

/**
 * Initialize SATIM with credentials
 * Call this once during application startup
 */
export function initializeSATIM(config: SATIMConfig): void {
  satimConfig = config
  
  if (config.environment === 'test') {
    console.log('[SATIM] Initialized in TEST mode')
  } else {
    console.log('[SATIM] Initialized in PRODUCTION mode')
  }
}

/**
 * Get current SATIM configuration
 * @throws Error if not initialized
 */
export function getSATIMConfig(): SATIMConfig {
  if (!satimConfig) {
    throw new Error('SATIM not initialized. Call initializeSATIM() first.')
  }
  return satimConfig
}

// Default endpoints based on environment
export const SATIM_ENDPOINTS = {
  test: 'https://test-payment.cib.dz',
  production: 'https://payment.cib.dz',
} as const

// ============================================
// SIGNATURE GENERATION & VERIFICATION
// ============================================

/**
 * Generate HMAC-SHA256 signature for SATIM requests
 * SATIM requires signed requests for security
 */
export function generateSATIMSignature(
  data: Record<string, string | number>,
  secretKey: string
): string {
  // Sort keys alphabetically and concatenate values
  const sortedKeys = Object.keys(data).sort()
  const signString = sortedKeys.map(key => `${key}=${data[key]}`).join('&')
  
  return crypto
    .createHmac('sha256', secretKey)
    .update(signString)
    .digest('hex')
}

/**
 * Verify SATIM webhook signature
 * Returns true if signature is valid
 */
export function verifySATIMWebhookSignature(
  payload: SATIMWebhookPayload,
  secretKey: string
): boolean {
  const { signature, ...data } = payload
  
  // Recreate expected signature
  const expectedSignature = generateSATIMSignature(
    data as unknown as Record<string, string | number>,
    secretKey
  )
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// ============================================
// PAYMENT OPERATIONS
// ============================================

/**
 * Create a new SATIM payment session
 * Returns redirect URL for 3D Secure authentication
 */
export async function createSATIMPayment(
  request: SATIMPaymentRequest
): Promise<SATIMResponse> {
  const config = getSATIMConfig()
  
  try {
    // Validate required fields
    if (!request.amount || request.amount <= 0) {
      return {
        success: false,
        error: 'Invalid amount',
        errorCode: 'INVALID_AMOUNT',
      }
    }
    
    if (!request.orderId) {
      return {
        success: false,
        error: 'Order ID is required',
        errorCode: 'MISSING_ORDER_ID',
      }
    }
    
    if (request.currency !== 'DZD') {
      return {
        success: false,
        error: 'SATIM only supports DZD currency',
        errorCode: 'INVALID_CURRENCY',
      }
    }

    // Generate unique transaction ID
    const transactionId = `SATIM_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    
    // Prepare request data
    const requestData = {
      merchant_id: config.merchantId,
      amount: Math.round(request.amount * 100), // Amount in centimes
      currency: request.currency,
      order_id: request.orderId,
      transaction_id: transactionId,
      customer_email: request.customerEmail,
      customer_name: request.customerName,
      customer_phone: request.customerPhone || '',
      return_url: request.returnUrl,
      cancel_url: request.cancelUrl,
      notification_url: request.notificationUrl,
      language: 'fr', // Default to French for Algeria
      timestamp: Math.floor(Date.now() / 1000),
    }

    // Generate signature
    const signature = generateSATIMSignature(requestData, config.merchantKey)
    
    // In test mode, simulate the API response
    if (config.environment === 'test') {
      console.log('[SATIM] TEST MODE - Simulating payment creation')
      console.log('[SATIM] Request data:', JSON.stringify(requestData, null, 2))
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Return mock redirect URL (in production, this would be from SATIM API)
      const mockRedirectUrl = `${config.endpoint}/payment/authorize?` +
        `transaction_id=${transactionId}&` +
        `merchant_id=${config.merchantId}&` +
        `signature=${signature}`
      
      return {
        success: true,
        transactionId,
        redirectUrl: mockRedirectUrl,
      }
    }

    // Production: Make actual API call to SATIM
    const response = await fetch(`${config.endpoint}/api/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.merchantKey}`,
      },
      body: JSON.stringify({
        ...requestData,
        signature,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[SATIM] API Error:', response.status, errorData)
      return {
        success: false,
        error: errorData.message || 'Failed to create payment',
        errorCode: `API_ERROR_${response.status}`,
      }
    }

    const data = await response.json()
    
    return {
      success: true,
      transactionId: data.transaction_id || transactionId,
      redirectUrl: data.redirect_url || data.payment_url,
    }
  } catch (error) {
    console.error('[SATIM] createSATIMPayment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'INTERNAL_ERROR',
    }
  }
}

/**
 * Verify SATIM transaction status
 * Use this to check if payment was completed after redirect
 */
export async function verifySATIMTransaction(
  transactionId: string
): Promise<SATIMTransactionStatus> {
  const config = getSATIMConfig()
  
  try {
    // In test mode, return simulated status
    if (config.environment === 'test') {
      console.log('[SATIM] TEST MODE - Verifying transaction:', transactionId)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // For testing, we'll check if this looks like a valid test transaction
      const isValidTestTxn = transactionId.startsWith('SATIM_')
      
      return {
        transactionId,
        orderId: `order_${transactionId.substring(6)}`,
        status: isValidTestTxn ? 'COMPLETED' : 'FAILED',
        amount: 0, // Would be fetched from DB in real implementation
        currency: 'DZD',
        paidAt: isValidTestTxn ? new Date() : undefined,
        authCode: isValidTestTxn ? 'AUTH_TEST_' + Math.random().toString(36).substring(2, 8) : undefined,
        cardLast4: isValidTestTxn ? '1234' : undefined,
        cardType: isValidTestTxn ? 'visa' : undefined,
      }
    }

    // Production: Call SATIM verification API
    const requestData = {
      merchant_id: config.merchantId,
      transaction_id: transactionId,
      timestamp: Math.floor(Date.now() / 1000),
    }

    const signature = generateSATIMSignature(requestData, config.merchantKey)

    const response = await fetch(`${config.endpoint}/api/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.merchantKey}`,
      },
      body: JSON.stringify({
        ...requestData,
        signature,
      }),
    })

    if (!response.ok) {
      throw new Error(`Verification failed with status ${response.status}`)
    }

    const data = await response.json()

    // Map SATIM status to our internal status
    const statusMap: Record<string, SATIMTransactionStatus['status']> = {
      'AUTHORIZED': 'COMPLETED',
      'CAPTURED': 'COMPLETED',
      'PENDING_AUTH': 'PENDING',
      'FAILED': 'FAILED',
      'CANCELLED': 'CANCELLED',
      'REFUNDED': 'REFUNDED',
    }

    return {
      transactionId: data.transaction_id,
      orderId: data.order_id,
      status: statusMap[data.status] || 'PENDING',
      amount: data.amount / 100, // Convert from centimes
      currency: data.currency,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      authCode: data.auth_code,
      cardLast4: data.card_last4,
      cardType: data.card_type?.toLowerCase(),
    }
  } catch (error) {
    console.error('[SATIM] verifySATIMTransaction error:', error)
    throw error
  }
}

/**
 * Handle SATIM webhook notification
 * SATIM sends async notifications when payment status changes
 */
export async function handleSATIMWebhook(
  payload: unknown,
  rawBody?: string
): Promise<{
  valid: boolean
  event?: string
  data?: SATIMTransactionStatus
  error?: string
}> {
  const config = getSATIMConfig()
  
  try {
    const webhookPayload = payload as SATIMWebhookPayload
    
    // Verify webhook signature
    if (!verifySATIMWebhookSignature(webhookPayload, config.merchantKey)) {
      console.error('[SATIM] Invalid webhook signature')
      return { valid: false, error: 'Invalid signature' }
    }

    console.log('[SATIM] Valid webhook received:', webhookPayload.transactionId)

    // Map webhook status
    const statusMap: Record<string, SATIMTransactionStatus['status']> = {
      'PAYMENT_SUCCESS': 'COMPLETED',
      'PAYMENT_FAILED': 'FAILED',
      'PAYMENT_CANCELLED': 'CANCELLED',
      'PAYMENT_REFUNDED': 'REFUNDED',
      'AUTH_SUCCESS': 'COMPLETED',
      'AUTH_FAILED': 'FAILED',
    }

    const status = statusMap[webhookPayload.status] || 'PENDING'

    return {
      valid: true,
      event: webhookPayload.status,
      data: {
        transactionId: webhookPayload.transactionId,
        orderId: webhookPayload.orderId,
        status,
        amount: webhookPayload.amount,
        currency: webhookPayload.currency,
        paidAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    }
  } catch (error) {
    console.error('[SATIM] handleSATIMWebhook error:', error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed',
    }
  }
}

/**
 * Refund a SATIM transaction (partial or full)
 */
export async function refundSATIMTransaction(
  transactionId: string,
  amount?: number
): Promise<{
  success: boolean
  refundId?: string
  error?: string
}> {
  const config = getSATIMConfig()
  
  try {
    if (config.environment === 'test') {
      console.log('[SATIM] TEST MODE - Simulating refund for:', transactionId)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return {
        success: true,
        refundId: `REFUND_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      }
    }

    const requestData = {
      merchant_id: config.merchantId,
      transaction_id: transactionId,
      refund_amount: amount ? Math.round(amount * 100) : undefined, // Optional partial refund
      timestamp: Math.floor(Date.now() / 1000),
    }

    const signature = generateSATIMSignature(
      requestData as Record<string, string | number>,
      config.merchantKey
    )

    const response = await fetch(`${config.endpoint}/api/payment/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.merchantKey}`,
      },
      body: JSON.stringify({
        ...requestData,
        signature,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || 'Refund failed',
      }
    }

    const data = await response.json()
    
    return {
      success: true,
      refundId: data.refund_id,
    }
  } catch (error) {
    console.error('[SATIM] refundSATIMTransaction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund processing failed',
    }
  }
}

// ============================================
// ERROR MESSAGES (Multilingual)
// ============================================

export const SATIM_ERRORS: Record<string, { fr: string; ar: string; en: string }> = {
  INVALID_AMOUNT: {
    fr: 'Montant invalide',
    ar: 'المبلغ غير صالح',
    en: 'Invalid amount',
  },
  MISSING_ORDER_ID: {
    fr: 'ID de commande manquant',
    ar: 'رقم الطلب مفقود',
    en: 'Order ID is required',
  },
  INVALID_CURRENCY: {
    fr: 'SATIM ne prend en charge que le DZD',
    ar: 'ساتيم يدعم فقط الدينار الجزائري',
    en: 'SATIM only supports DZD currency',
  },
  TRANSACTION_NOT_FOUND: {
    fr: 'Transaction non trouvée',
    ar: 'العملية غير موجودة',
    en: 'Transaction not found',
  },
  PAYMENT_FAILED: {
    fr: 'Le paiement a échoué',
    ar: 'فشل الدفع',
    en: 'Payment failed',
  },
  NETWORK_ERROR: {
    fr: 'Erreur de connexion au serveur de paiement',
    ar: 'خطأ في الاتصال بخادم الدفع',
    en: 'Connection error to payment server',
  },
  INTERNAL_ERROR: {
    fr: 'Erreur interne du système',
    ar: 'خطأ داخلي في النظام',
    en: 'Internal system error',
  },
}

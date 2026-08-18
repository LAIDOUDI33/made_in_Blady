/**
 * SATIM (Système Algérien de Télécompensation Interbancaire et Monétique)
 * API Client for CIB payment gateway integration
 * @module satim/client
 */

import crypto from 'crypto'
import type {
  SatimPaymentRequest,
  SatimPaymentResponse,
  SatimTransactionStatus,
  SatimWebhookPayload,
  SatimRefundRequest,
  SatimRefundResponse,
  ThreeDSecureResult,
  SatimErrorCode,
  CardType,
} from './types'
import {
  satimConfig,
  satimEndpoints,
  getEndpointUrl,
  timeoutConfig,
  retryConfig,
  validateAmount,
  isSatimConfigured,
} from './config'

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Custom error class for SATIM operations
 */
export class SatimError extends Error {
  public readonly code: SatimErrorCode
  public readonly httpStatus: number
  public readonly details?: Record<string, unknown>

  constructor(
    code: SatimErrorCode,
    message: string,
    httpStatus: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'SatimError'
    this.code = code
    this.httpStatus = httpStatus
    this.details = details
  }
}

/**
 * Multilingual error messages for common errors
 */
export const errorMessages: Record<SatimErrorCode, { fr: string; ar: string; en: string }> = {
  INVALID_AMOUNT: {
    fr: 'Montant invalide',
    ar: 'المبلغ غير صالح',
    en: 'Invalid amount',
  },
  INVALID_CURRENCY: {
    fr: 'SATIM ne prend en charge que le DZD',
    ar: 'ساتيم يدعم فقط الدينار الجزائري',
    en: 'SATIM only supports DZD currency',
  },
  MISSING_ORDER_ID: {
    fr: 'ID de commande manquant',
    ar: 'رقم الطلب مفقود',
    en: 'Order ID is required',
  },
  MISSING_CUSTOMER_ID: {
    fr: 'ID client manquant',
    ar: 'معرف العميل مفقود',
    en: 'Customer ID is required',
  },
  INVALID_CARD_NUMBER: {
    fr: 'Numéro de carte invalide',
    ar: 'رقم البطاقة غير صالح',
    en: 'Invalid card number',
  },
  INVALID_EXPIRY_DATE: {
    fr: "Date d'expiration invalide",
    ar: 'تاريخ الانتهاء غير صالح',
    en: 'Invalid expiry date',
  },
  TRANSACTION_NOT_FOUND: {
    fr: 'Transaction non trouvée',
    ar: 'العملية غير موجودة',
    en: 'Transaction not found',
  },
  TRANSACTION_ALREADY_PROCESSED: {
    fr: 'Transaction déjà traitée',
    ar: 'العملية تمت معالجتها بالفعل',
    en: 'Transaction already processed',
  },
  PAYMENT_FAILED: {
    fr: 'Le paiement a échoué',
    ar: 'فشل الدفع',
    en: 'Payment failed',
  },
  PAYMENT_DECLINED: {
    ref: 'Paiement refusé par la banque',
    ar: 'تم رفض الدفع من قبل البنك',
    en: 'Payment declined by bank',
  },
  '3D_SECURE_FAILED': {
    fr: "Échec de l'authentification 3D Secure",
    ar: 'فشل المصادقة ثلاثية الأبعاد',
    en: '3D Secure authentication failed',
  },
  REFUND_FAILED: {
    fr: "Le remboursement a échoué",
    ar: 'فشل الاسترداد',
    en: 'Refund failed',
  },
  REFUND_EXCEEDS_AMOUNT: {
    fr: 'Le montant du remboursement dépasse le montant disponible',
    ar: 'مبلغ الاسترداد يتجاوز المبلغ المتاح',
    en: 'Refund amount exceeds available amount',
  },
  SIGNATURE_MISMATCH: {
    fr: 'Signature invalide',
    ar: 'التوقيع غير صالح',
    en: 'Invalid signature',
  },
  NETWORK_ERROR: {
    fr: 'Erreur de connexion au serveur de paiement',
    ar: 'خطأ في الاتصال بخادم الدفع',
    en: 'Connection error to payment server',
  },
  API_ERROR: {
    fr: 'Erreur de l\'API SATIM',
    ar: 'خطأ في واجهة برمجة تطبيقات ساتيم',
    en: 'SATIM API error',
  },
  INTERNAL_ERROR: {
    fr: 'Erreur interne du système',
    ar: 'خطأ داخلي في النظام',
    en: 'Internal system error',
  },
  CONFIGURATION_ERROR: {
    fr: 'Configuration SATIM incomplète',
    ar: 'تكوين ساتيم غير مكتمل',
    en: 'SATIM configuration incomplete',
  },
}

/**
 * Get localized error message
 */
export function getErrorMessage(
  code: SatimErrorCode,
  locale: 'fr' | 'ar' | 'en' = 'fr'
): string {
  return errorMessages[code]?.[locale] || errorMessages[code]?.fr || code
}

// ============================================
// SIGNATURE GENERATION & VERIFICATION
// ============================================

/**
 * Generate HMAC-SHA256 signature for SATIM requests
 * SATIM requires signed requests for security verification
 * 
 * @param data - Data object to sign (will be sorted alphabetically)
 * @param secret - API secret key for signing
 * @returns Hex-encoded HMAC-SHA256 signature
 * 
 * @example
 * ```ts
 * const signature = generateSignature({
 *   merchantId: '001000000000001',
 *   amount: 10000,
 *   orderId: 'ORD-123456'
 * }, 'your-api-secret')
 * ```
 */
export function generateSignature(
  data: Record<string, string | number | boolean | undefined>,
  secret: string
): string {
  // Filter out undefined values and sort keys alphabetically
  const sortedKeys = Object.keys(data)
    .filter(key => data[key] !== undefined && data[key] !== '')
    .sort()
  
  // Build signature string: key1=value1&key2=value2...
  const signString = sortedKeys
    .map(key => `${key}=${data[key]}`)
    .join('&')
  
  // Generate HMAC-SHA256
  return crypto
    .createHmac('sha256', secret)
    .update(signString)
    .digest('hex')
}

/**
 * Verify SATIM webhook/callback signature
 * Uses constant-time comparison to prevent timing attacks
 * 
 * @param payload - The webhook payload containing signature
 * @param secret - API secret key for verification
 * @returns True if signature is valid
 * 
 * @example
 * ```ts
 * const isValid = validateCallback({
 *   transactionId: 'TXN-123',
 *   status: 'APPROVED',
 *   signature: 'abc123...'
 * }, 'your-api-secret')
 * ```
 */
export function validateCallback(
  payload: SatimWebhookPayload | Record<string, unknown>,
  secret: string
): boolean {
  const payloadRecord = payload as Record<string, unknown>
  const receivedSignature = payloadRecord.signature as string
  
  if (!receivedSignature) {
    console.warn('[SATIM] No signature in payload')
    return false
  }
  
  // Extract data without signature for verification
  const { signature, ...dataToVerify } = payload
  
  // Generate expected signature
  const expectedSignature = generateSignature(
    dataToVerify as Record<string, string | number | boolean | undefined>,
    secret
  )
  
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    // Fall back to regular comparison if hex decoding fails
    return receivedSignature === expectedSignature
  }
}

// ============================================
// CARD TYPE DETECTION
// ============================================

/**
 * Detect card type from card number using BIN ranges
 * 
 * @param cardNumber - The credit/debit card number
 * @returns Detected card type
 * 
 * @example
 * ```ts
 * detectCardType('4111111111111111') // Returns 'VISA'
 * ```
 */
export function detectCardType(cardNumber: string): CardType {
  const cleaned = cardNumber.replace(/\s/g, '').replace(/\D/g, '')
  
  // Visa: starts with 4
  if (/^4/.test(cleaned)) {
    return 'VISA'
  }
  
  // Mastercard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
    return 'MASTERCARD'
  }
  
  // CIB cards: Algerian bank BINs (simplified detection)
  // CIB cards typically start with 6 (Discover range reused in Algeria)
  // or have specific Algerian bank prefixes
  if (/^6/.test(cleaned)) {
    return 'CIB'
  }
  
  return 'UNKNOWN'
}

/**
 * Get display information for a card type
 */
export function getCardTypeInfo(type: CardType): {
  name: string
  color: string
  bgColor: string
} {
  const info = {
    VISA: {
      name: 'Visa',
      color: '#1434CB',
      bgColor: '#EBF5FF',
    },
    MASTERCARD: {
      name: 'Mastercard',
      color: '#EB001B',
      bgColor: '#FFE8E8',
    },
    CIB: {
      name: 'CIB',
      color: '#006233',
      bgColor: '#E8F5EE',
    },
    UNKNOWN: {
      name: 'Carte',
      color: '#6B7280',
      bgColor: '#F3F4F6',
    },
  }
  
  return info[type]
}

// ============================================
// HTTP HELPERS
// ============================================

interface RequestOptions extends RequestInit {
  timeout?: number
}

/**
 * Make HTTP request with timeout and retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestOptions = {},
  retries: number = retryConfig.maxAttempts
): Promise<Response> {
  const { timeout = timeoutConfig.initiatePayment, ...fetchOptions } = options
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    // Check if we should retry
    if (
      !response.ok &&
      retryConfig.retryableStatusCodes.includes(response.status) &&
      retries > 0
    ) {
      const delay = retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, retryConfig.maxAttempts - retries)
      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchWithRetry(url, options, retries - 1)
    }
    
    return response
  } catch (error) {
    // Retry on network errors
    if (retries > 0) {
      const delay = retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, retryConfig.maxAttempts - retries)
      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

// ============================================
// PAYMENT OPERATIONS
// ============================================

/**
 * Initiate a new SATIM payment session
 * Creates a payment session and returns redirect URL for 3D Secure authentication
 * 
 * @param request - Payment request details
 * @returns Payment response with redirect URL
 * @throws {SatimError} If payment initiation fails
 * 
 * @example
 * ```ts
 * const result = await initiatePayment({
 *   amount: 5000,
 *   orderId: 'ORD-123456',
 *   customerId: 'user-789',
 *   customerEmail: 'buyer@example.com',
 *   customerPhone: '+213555123456'
 * })
 * console.log(result.redirectUrl) // Redirect user here
 * ```
 */
export async function initiatePayment(
  request: SatimPaymentRequest
): Promise<SatimPaymentResponse> {
  // Validate configuration
  if (!isSatimConfigured() && satimConfig.environment === 'production') {
    throw new SatimError('CONFIGURATION_ERROR', 'SATIM not properly configured', 500)
  }
  
  // Validate required fields
  if (!request.orderId) {
    throw new SatimError('MISSING_ORDER_ID', 'Order ID is required', 400)
  }
  
  if (!request.customerId) {
    throw new SatimError('MISSING_CUSTOMER_ID', 'Customer ID is required', 400)
  }
  
  // Validate amount
  const amountValidation = validateAmount(request.amount)
  if (!amountValidation.valid) {
    throw new SatimError('INVALID_AMOUNT', amountValidation.error!, 400)
  }
  
  // Generate unique transaction ID
  const transactionId = `SATIM_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
  
  // Prepare request payload
  const timestamp = Math.floor(Date.now() / 1000)
  const requestData = {
    merchant_id: satimConfig.merchantId,
    transaction_id: transactionId,
    order_id: request.orderId,
    customer_id: request.customerId,
    amount: Math.round(request.amount * 100), // Convert to centimes
    currency: 'DZD',
    customer_email: request.customerEmail || '',
    customer_phone: request.customerPhone || '',
    description: request.description || `Payment for order ${request.orderId}`,
    language: 'fr',
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}${callbackUrls.success}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}${callbackUrls.cancel}`,
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}${callbackUrls.notification}`,
    three_d_secure_enabled: threeDSecureConfig.enabled,
    three_d_secure_version: threeDSecureConfig.version,
    installments: request.installments || 1,
    timestamp,
  }
  
  // Generate request signature
  const signature = generateSignature(requestData, satimConfig.apiSecret)
  
  // Log test mode
  if (satimConfig.environment === 'test') {
    console.log('[SATIM] TEST MODE - Initiating payment:', {
      transactionId,
      orderId: request.orderId,
      amount: request.amount,
    })
  }
  
  try {
    // In test mode, simulate API response
    if (satimConfig.environment === 'test') {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Generate mock redirect URL
      const mockRedirectUrl = `${getEndpointUrl(satimEndpoints.threeDSecure)}?` +
        `transaction_id=${transactionId}&` +
        `merchant_id=${satimConfig.merchantId}`
      
      return {
        transactionId,
        redirectUrl: mockRedirectUrl,
        status: 'PENDING',
        createdAt: new Date(),
      }
    }
    
    // Production: Make actual API call
    const response = await fetchWithRetry(
      getEndpointUrl(satimEndpoints.initiatePayment),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${satimConfig.apiKey}`,
          'X-SATIM-Merchant-ID': satimConfig.merchantId,
        },
        body: JSON.stringify({ ...requestData, signature }),
        timeout: timeoutConfig.initiatePayment,
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new SatimError(
        'API_ERROR',
        errorData.message || `SATIM API error: ${response.status}`,
        response.status,
        errorData
      )
    }
    
    const data = await response.json()
    
    return {
      transactionId: data.transaction_id || transactionId,
      redirectUrl: data.redirect_url || data.payment_url,
      status: 'PENDING',
      createdAt: new Date(),
    }
  } catch (error) {
    if (error instanceof SatimError) {
      throw error
    }
    
    console.error('[SATIM] initiatePayment error:', error)
    throw new SatimError(
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Failed to connect to SATIM',
      503
    )
  }
}

/**
 * Check the status of a SATIM transaction
 * Use this after user returns from 3D Secure or for async status checks
 * 
 * @param transactionId - Transaction ID to check
 * @returns Current transaction status
 * @throws {SatimError} If status check fails
 * 
 * @example
 * ```ts
 * const status = await checkPaymentStatus('SATIM_1234567890_abcdef')
 * console.log(status.status) // 'COMPLETED'
 * ```
 */
export async function checkPaymentStatus(
  transactionId: string
): Promise<SatimTransactionStatus> {
  if (!transactionId) {
    throw new SatimError('TRANSACTION_NOT_FOUND', 'Transaction ID is required', 400)
  }
  
  // Prepare request data
  const requestData = {
    merchant_id: satimConfig.merchantId,
    transaction_id: transactionId,
    timestamp: Math.floor(Date.now() / 1000),
  }
  
  const signature = generateSignature(requestData, satimConfig.apiSecret)
  
  try {
    // In test mode, simulate response
    if (satimConfig.environment === 'test') {
      console.log('[SATIM] TEST MODE - Checking status:', transactionId)
      
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Simulate successful transaction for test IDs
      const isTestTxn = transactionId.startsWith('SATIM_')
      
      return {
        transactionId,
        orderId: `ORDER_${transactionId.substring(6, 12)}`,
        amount: 0, // Would be fetched from DB
        currency: 'DZD',
        status: isTestTxn ? 'COMPLETED' : 'FAILED',
        authCode: isTestTxn ? `AUTH${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined,
        rrn: isTestTxn ? `${Date.now().toString().slice(-9)}` : undefined,
        cardLast4: isTestTxn ? '1234' : undefined,
        cardType: isTestTxn ? 'VISA' : undefined,
        paidAt: isTestTxn ? new Date() : undefined,
      }
    }
    
    // Production: Call SATIM API
    const response = await fetchWithRetry(
      getEndpointUrl(satimEndpoints.checkStatus),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${satimConfig.apiKey}`,
        },
        body: JSON.stringify({ ...requestData, signature }),
        timeout: timeoutConfig.checkStatus,
      }
    )
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new SatimError('TRANSACTION_NOT_FOUND', 'Transaction not found', 404)
      }
      
      const errorData = await response.json().catch(() => ({}))
      throw new SatimError('API_ERROR', errorData.message || 'Status check failed', response.status)
    }
    
    const data = await response.json()
    
    // Map SATIM statuses to our internal statuses
    const statusMap: Record<string, SatimTransactionStatus['status']> = {
      'AUTHORIZED': 'COMPLETED',
      'CAPTURED': 'COMPLETED',
      'APPROVED': 'COMPLETED',
      'PENDING_AUTH': 'PROCESSING',
      'PENDING_CAPTURE': 'PROCESSING',
      'FAILED': 'FAILED',
      'DECLINED': 'FAILED',
      'CANCELLED': 'CANCELLED',
      'REFUNDED': 'REFUNDED',
      'PARTIALLY_REFUNDED': 'REFUNDED',
    }
    
    return {
      transactionId: data.transaction_id || transactionId,
      orderId: data.order_id,
      amount: typeof data.amount === 'number' ? data.amount / 100 : 0,
      currency: data.currency || 'DZD',
      status: statusMap[data.status] || 'PENDING',
      authCode: data.auth_code,
      rrn: data.rrn,
      cardLast4: data.card_last4,
      cardType: data.card_type?.toUpperCase(),
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      errorMessage: data.error_message,
    }
  } catch (error) {
    if (error instanceof SatimError) {
      throw error
    }
    
    console.error('[SATIM] checkPaymentStatus error:', error)
    throw new SatimError(
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Failed to check payment status',
      503
    )
  }
}

/**
 * Process a refund for a SATIM transaction
 * Supports both full and partial refunds
 * 
 * @param request - Refund request details
 * @returns Refund result with refund ID
 * @throws {SatimError} If refund fails
 * 
 * @example
 * ```ts
 * // Full refund
 * const result = await refundPayment({ transactionId: 'SATIM_123...' })
 * 
 * // Partial refund
 * const partial = await refundPayment({
 *   transactionId: 'SATIM_123...',
 *   amount: 2500,
 *   reason: 'Product returned'
 * })
 * ```
 */
export async function refundPayment(
  request: SatimRefundRequest
): Promise<SatimRefundResponse> {
  if (!request.transactionId) {
    throw new SatimError('TRANSACTION_NOT_FOUND', 'Transaction ID is required', 400)
  }
  
  // Prepare request data
  const requestData: Record<string, string | number> = {
    merchant_id: satimConfig.merchantId,
    transaction_id: request.transactionId,
    timestamp: Math.floor(Date.now() / 1000),
  }
  
  // Add optional refund amount (in centimes)
  if (request.amount && request.amount > 0) {
    requestData.refund_amount = Math.round(request.amount * 100)
  }
  
  if (request.reason) {
    requestData.reason = request.reason
  }
  
  const signature = generateSignature(requestData, satimConfig.apiSecret)
  
  try {
    // In test mode, simulate response
    if (satimConfig.environment === 'test') {
      console.log('[SATIM] TEST MODE - Processing refund:', request.transactionId)
      
      await new Promise(resolve => setTimeout(resolve, 600))
      
      return {
        success: true,
        refundId: `REFUND_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        refundedAmount: request.amount,
        remainingAmount: 0,
      }
    }
    
    // Production: Call SATIM API
    const response = await fetchWithRetry(
      getEndpointUrl(satimEndpoints.refund),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${satimConfig.apiKey}`,
        },
        body: JSON.stringify({ ...requestData, signature }),
        timeout: timeoutConfig.refund,
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Handle specific refund errors
      if (response.status === 409 || errorData.code === 'EXCEEDS_AMOUNT') {
        throw new SatimError('REFUND_EXCEEDS_AMOUNT', 'Refund amount exceeds available amount', 409)
      }
      
      throw new SatimError('REFUND_FAILED', errorData.message || 'Refund failed', response.status)
    }
    
    const data = await response.json()
    
    return {
      success: true,
      refundId: data.refund_id,
      refundedAmount: typeof data.refunded_amount === 'number' ? data.refunded_amount / 100 : request.amount,
      remainingAmount: typeof data.remaining_amount === 'number' ? data.remaining_amount / 100 : 0,
    }
  } catch (error) {
    if (error instanceof SatimError) {
      throw error
    }
    
    console.error('[SATIM] refundPayment error:', error)
    throw new SatimError(
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Failed to process refund',
      503
    )
  }
}

/**
 * Handle 3D Secure authentication flow
 * This manages the 3D Secure v2.0 authentication process
 * 
 * @param transactionId - Transaction ID requiring 3DS
 * @param callbackData - Callback data from 3DS page (if returning)
 * @returns 3D Secure authentication result
 * 
 * @example
 * ```ts
 * // Start 3DS flow
 * const result = await handle3DSecure('SATIM_123...')
 * if (result.required && !result.authenticated) {
 *   // Redirect user to 3DS page
 * }
 * ```
 */
export async function handle3DSecure(
  transactionId: string,
  callbackData?: Record<string, string>
): Promise<ThreeDSecureResult> {
  // Default result structure
  const defaultResult: ThreeDSecureResult = {
    required: threeDSecureConfig.enabled,
    authenticated: false,
    version: threeDSecureConfig.version,
  }
  
  // If we have callback data, verify the authentication
  if (callbackData) {
    const { trans_status, cres, ds_trans_id } = callbackData
    
    // Verify callback signature
    if (!validateCallback(callbackData, satimConfig.apiSecret)) {
      return {
        ...defaultResult,
        error: 'Invalid 3D Secure callback signature',
      }
    }
    
    // Check authentication status
    const isAuthenticated = trans_status === 'Y' || trans_status === 'A'
    
    return {
      required: true,
      authenticated: isAuthenticated,
      version: threeDSecureConfig.version,
      authenticationValue: cres,
      serverTransactionId: ds_trans_id,
      error: !isAuthenticated ? '3D Secure authentication failed' : undefined,
    }
  }
  
  // Check if 3DS is required for this transaction
  try {
    const status = await checkPaymentStatus(transactionId)
    
    // In test mode, always require 3DS
    if (satimConfig.environment === 'test') {
      return {
        required: true,
        authenticated: false,
        version: threeDSecureConfig.version,
        serverTransactionId: `3DS_${Date.now()}`,
      }
    }
    
    // In production, determine based on transaction data
    // Most transactions will require 3DS for amounts above threshold
    return {
      required: status.amount >= threeDSecureConfig.exemptionThreshold,
      authenticated: false,
      version: threeDSecureConfig.version,
    }
  } catch (error) {
    console.error('[SATIM] handle3DSecure error:', error)
    return {
      ...defaultResult,
      error: 'Failed to determine 3D Secure requirement',
    }
  }
}

// ============================================
// EXPORTS
// ============================================

/**
 * SATIM client instance with all methods
 */
export const satimClient = {
  initiatePayment,
  checkPaymentStatus,
  refundPayment,
  handle3DSecure,
  generateSignature,
  validateCallback,
  detectCardType,
  getCardTypeInfo,
}

export default satimClient

/**
 * SATIM (Système Algérien de Télécompensation Interbancaire et Monétique)
 * Configuration for CIB payment gateway integration
 * @module satim/config
 */

import type { SatimConfig } from './types'

/**
 * SATIM configuration with production-ready settings
 * Environment variables are loaded from .env files
 */
export const satimConfig: SatimConfig = {
  /** Merchant ID from SATIM/CIB portal */
  merchantId: process.env.SATIM_MERCHANT_ID || '001000000000001',
  
  /** API key for request authentication */
  apiKey: process.env.SATIM_API_KEY || '',
  
  /** API secret for HMAC-SHA256 signature generation */
  apiSecret: process.env.SATIM_API_SECRET || '',
  
  /** Current environment (test or production) */
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'test',
  
  /** Base URL for API endpoints based on environment */
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://payment.cib.dz/payment/rest'
    : 'https://payment.preprod.cib.dz/payment/rest',
}

/**
 * SATIM API endpoint paths
 */
export const satimEndpoints = {
  /** Initiate a new payment session */
  initiatePayment: '/initiatePayment',
  
  /** Check payment status by transaction ID */
  checkStatus: '/checkStatus',
  
  /** Process a refund */
  refund: '/refund',
  
  /** 3D Secure authentication endpoint */
  threeDSecure: '/3DSecure',
} as const

/**
 * Supported card types for SATIM payments
 */
export const supportedCards = ['VISA', 'MASTERCARD', 'CIB'] as const

/**
 * Supported languages for SATIM payment page
 */
export const supportedLanguages = ['ar', 'fr', 'en'] as const

/**
 * Callback URLs configuration
 * These are relative URLs that will be combined with base URL
 */
export const callbackUrls = {
  /** URL called on successful payment */
  success: '/api/payments/satim/callback/success',
  
  /** URL called when user cancels payment */
  cancel: '/api/payments/satim/callback/cancel',
  
  /** URL called on payment error */
  error: '/api/payments/satim/callback/error',
  
  /** Webhook notification URL (server-to-server) */
  notification: '/api/payments/satim/notification',
} as const

/**
 * 3D Secure configuration
 */
export const threeDSecureConfig = {
  /** Enable 3D Secure authentication */
  enabled: true,
  
  /** 3D Secure protocol version */
  version: '2.0',
  
  /** Challenge preference mode */
  challengeMode: 'PREFER_NO_CHALLENGE' as const,
  
  /** Exemption threshold in DZD (amounts below this may be exempted) */
  exemptionThreshold: 5000,
}

/**
 * Currency configuration
 * SATIM only supports Algerian Dinar (DZD)
 */
export const currencyConfig = {
  /** ISO currency code */
  code: 'DZD',
  
  /** Currency name in multiple languages */
  names: {
    fr: 'Dinar Algérien',
    ar: 'دينار جزائري',
    en: 'Algerian Dinar',
  },
  
  /** Decimal places */
  decimals: 2,
  
  /** Minimum payment amount in DZD */
  minAmount: 100,
  
  /** Maximum payment amount in DZD */
  maxAmount: 2000000,
}

/**
 * Timeout configurations for API calls (in milliseconds)
 */
export const timeoutConfig = {
  /** Payment initiation timeout */
  initiatePayment: 30000,
  
  /** Status check timeout */
  checkStatus: 15000,
  
  /** Refund processing timeout */
  refund: 30000,
  
  /** 3D Secure authentication timeout */
  threeDSecure: 120000,
}

/**
 * Retry configuration for failed requests
 */
export const retryConfig = {
  /** Maximum number of retry attempts */
  maxAttempts: 3,
  
  /** Initial delay in milliseconds */
  initialDelay: 1000,
  
  /** Multiplier for exponential backoff */
  backoffMultiplier: 2,
  
  /** HTTP status codes that trigger retry */
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
}

/**
 * Get the full URL for an endpoint
 * @param endpoint - The endpoint path
 * @returns Full URL including base URL
 */
export function getEndpointUrl(endpoint: string): string {
  return `${satimConfig.baseUrl}${endpoint}`
}

/**
 * Check if SATIM is properly configured
 * @returns True if all required credentials are present
 */
export function isSatimConfigured(): boolean {
  return !!(
    satimConfig.merchantId &&
    satimConfig.merchantId !== '001000000000001' &&
    satimConfig.apiKey &&
    satimConfig.apiSecret
  )
}

/**
 * Get current environment display name
 * @returns Human-readable environment name
 */
export function getEnvironmentName(): string {
  return satimConfig.environment === 'production' ? 'Production' : 'Test/Sandbox'
}

/**
 * Validate amount against constraints
 * @param amount - Amount to validate
 * @returns Validation result with error message if invalid
 */
export function validateAmount(amount: number): { valid: boolean; error?: string } {
  if (!Number.isFinite(amount)) {
    return { valid: false, error: 'Amount must be a valid number' }
  }
  
  if (amount < currencyConfig.minAmount) {
    return {
      valid: false,
      error: `Minimum amount is ${currencyConfig.minAmount} DZD`,
    }
  }
  
  if (amount > currencyConfig.maxAmount) {
    return {
      valid: false,
      error: `Maximum amount is ${currencyConfig.maxAmount.toLocaleString('fr-DZ')} DZD`,
    }
  }
  
  return { valid: true }
}

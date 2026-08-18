/**
 * SATIM (Système Algérien de Télécompensation Interbancaire et Monétique)
 * Type definitions for the CIB payment gateway integration
 * @module satim/types
 */

// ============================================
// BILLING ADDRESS TYPES
// ============================================

/**
 * Billing address information for SATIM payments
 */
export interface BillingAddress {
  /** Customer first name */
  firstName: string
  /** Customer last name */
  lastName: string
  /** Street address */
  address: string
  /** City */
  city: string
  /** Postal/ZIP code */
  zipCode: string
  /** ISO country code (e.g., 'DZ') */
  country: string
}

// ============================================
// PAYMENT REQUEST TYPES
// ============================================

/**
 * SATIM payment request payload
 */
export interface SatimPaymentRequest {
  /** Payment amount in DZD (minimum 100 DZD) */
  amount: number
  /** Unique order identifier from our system */
  orderId: string
  /** Customer/user ID in our system */
  customerId: string
  /** Customer email address (required for receipts) */
  customerEmail?: string
  /** Customer phone number (Algerian format preferred) */
  customerPhone?: string
  /** Payment description for statement */
  description?: string
  /** Billing address for 3D Secure verification */
  billingAddress?: BillingAddress
  /** Shipping address (optional, for physical goods) */
  shippingAddress?: BillingAddress
  /** Number of installments for DPA (Deferred Payment Authorization) */
  installments?: number
}

// ============================================
// PAYMENT RESPONSE TYPES
// ============================================

/**
 * SATIM payment initiation response
 */
export interface SatimPaymentResponse {
  /** Unique transaction identifier from SATIM */
  transactionId: string
  /** URL to redirect user for 3D Secure authentication */
  redirectUrl: string
  /** Current payment status */
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  /** Timestamp when the session was created */
  createdAt: Date
}

/**
 * SATIM transaction status details
 */
export interface SatimTransactionStatus {
  /** SATIM transaction identifier */
  transactionId: string
  /** Our order identifier */
  orderId: string
  /** Payment amount */
  amount: number
  /** Currency (always DZD for SATIM) */
  currency: string
  /** Current transaction status */
  status: SatimTransactionStatusType
  /** Authorization code (if approved) */
  authCode?: string
  /** Retrieval Reference Number for bank reconciliation */
  rrn?: string
  /** Last 4 digits of card number */
  cardLast4?: string
  /** Card type (VISA, MASTERCARD, CIB) */
  cardType?: string
  /** Timestamp when payment was completed */
  paidAt?: Date
  /** Error message if failed */
  errorMessage?: string
}

/**
 * Possible SATIM transaction statuses
 */
export type SatimTransactionStatusType = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

// ============================================
// WEBHOOK TYPES
// ============================================

/**
 * SATIM webhook notification payload
 */
export interface SatimWebhookPayload {
  /** Transaction identifier */
  transactionId: string
  /** Order identifier */
  orderId: string
  /** Payment amount */
  amount: number
  /** Currency code */
  currency: string
  /** Payment status from SATIM */
  status: SatimWebhookStatus
  /** Authorization code (if applicable) */
  authCode?: string
  /** Retrieval Reference Number */
  rrn?: string
  /** ISO timestamp of the event */
  timestamp: string
  /** HMAC-SHA256 signature for verification */
  signature: string
  /** Additional data from SATIM */
  [key: string]: unknown
}

/**
 * Webhook status values from SATIM
 */
export type SatimWebhookStatus = 
  | 'APPROVED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'ERROR'
  | 'PENDING'
  | 'REFUNDED'

// ============================================
// REFUND TYPES
// ============================================

/**
 * SATIM refund request
 */
export interface SatimRefundRequest {
  /** Original transaction ID to refund */
  transactionId: string
  /** Refund amount (omit for full refund) */
  amount?: number
  /** Reason for refund */
  reason?: string
  /** User initiating the refund */
  initiatedBy?: string
}

/**
 * SATIM refund response
 */
export interface SatimRefundResponse {
  /** Success flag */
  success: boolean
  /** Unique refund transaction ID */
  refundId?: string
  /** Refunded amount */
  refundedAmount?: number
  /** Remaining refundable amount */
  remainingAmount?: number
  /** Error message if failed */
  error?: string
  /** Error code for client handling */
  errorCode?: string
}

// ============================================
// 3D SECURE TYPES
// ============================================

/**
 * 3D Secure authentication request/response
 */
export interface ThreeDSecureResult {
  /** Whether 3D Secure was required */
  required: boolean
  /** Whether authentication was successful */
  authenticated: boolean
  /** 3DS version used ('2.0' or '1.0') */
  version: string
  /** Authentication value (AVV/CRes) */
  authenticationValue?: string
  /** Server Transaction ID */
  serverTransactionId?: string
  /** Error message if authentication failed */
  error?: string
}

// ============================================
// ERROR TYPES
// ============================================

/**
 * SATIM error codes and messages
 */
export interface SatimError {
  /** Machine-readable error code */
  code: SatimErrorCode
  /** Human-readable error message */
  message: string
  /** HTTP status code */
  httpStatus: number
  /** Additional details */
  details?: Record<string, unknown>
}

/**
 * Standard SATIM error codes
 */
export type SatimErrorCode =
  | 'INVALID_AMOUNT'
  | 'INVALID_CURRENCY'
  | 'MISSING_ORDER_ID'
  | 'MISSING_CUSTOMER_ID'
  | 'INVALID_CARD_NUMBER'
  | 'INVALID_EXPIRY_DATE'
  | 'TRANSACTION_NOT_FOUND'
  | 'TRANSACTION_ALREADY_PROCESSED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_DECLINED'
  | '3D_SECURE_FAILED'
  | 'REFUND_FAILED'
  | 'REFUND_EXCEEDS_AMOUNT'
  | 'SIGNATURE_MISMATCH'
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'INTERNAL_ERROR'
  | 'CONFIGURATION_ERROR'

// ============================================
// CONFIGURATION TYPES
// ============================================

/**
 * SATIM configuration options
 */
export interface SatimConfig {
  /** Merchant ID provided by SATIM/CIB */
  merchantId: string
  /** API key for authentication */
  apiKey: string
  /** API secret for signature generation */
  apiSecret: string
  /** Environment mode */
  environment: 'test' | 'production'
  /** Base URL for API endpoints */
  baseUrl: string
}

// ============================================
// CARD DETECTION TYPES
// ============================================

/**
 * Supported card types for SATIM
 */
export type CardType = 'VISA' | 'MASTERCARD' | 'CIB' | 'UNKNOWN'

/**
 * Card detection result
 */
export interface CardDetectionResult {
  /** Detected card type */
  type: CardType
  /** Display name for the card */
  displayName: string
  /** CSS class for styling */
  className: string
  /** Whether the card number is potentially valid */
  isValid: boolean
}

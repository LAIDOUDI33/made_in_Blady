/**
 * SATIM (Système Algérien de Télécompensation Interbancaire et Monétique)
 * Main entry point for CIB payment gateway integration
 * @module satim
 */

// Export types
export type {
  BillingAddress,
  SatimPaymentRequest,
  SatimPaymentResponse,
  SatimTransactionStatus,
  SatimTransactionStatusType,
  SatimWebhookPayload,
  SatimWebhookStatus,
  SatimRefundRequest,
  SatimRefundResponse,
  ThreeDSecureResult,
  SatimError as SatimErrorType,
  SatimConfig,
  CardType,
  CardDetectionResult,
} from './types'

// Export configuration
export {
  satimConfig,
  satimEndpoints,
  supportedCards,
  supportedLanguages,
  callbackUrls,
  threeDSecureConfig,
  currencyConfig,
  timeoutConfig,
  retryConfig,
  getEndpointUrl,
  isSatimConfigured,
  getEnvironmentName,
  validateAmount,
} from './config'

// Export client methods
export {
  satimClient,
  initiatePayment,
  checkPaymentStatus,
  refundPayment,
  handle3DSecure,
  generateSignature,
  validateCallback,
  detectCardType,
  getCardTypeInfo,
  SatimError,
  errorMessages,
  getErrorMessage,
} from './client'

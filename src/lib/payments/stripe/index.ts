// AlgeriaTrade.dz - Stripe International Cards Integration
// Main entry point for Stripe payment functionality

// Configuration
export {
  stripe,
  stripeConfig,
  currencyInfo,
  paymentMethodConfig,
  isCurrencySupported,
  getMinimumAmount,
  calculateStripeFees,
  formatCurrency,
  getAvailablePaymentMethods,
} from './config';

export type { SupportedCurrency, PaymentMethodType } from './config';

// Types
export type {
  StripePaymentRequest,
  StripePaymentResponse,
  StripeConfirmResponse,
  StripeCustomerRequest,
  StripeCustomerResponse,
  SavedPaymentMethod,
  StripeRefundRequest,
  StripeRefundResponse,
  ExchangeRate,
  ExchangeRateResponse,
  WebhookEventLog,
  StripeTransactionStatus,
  PaymentMethodType as StripePaymentMethodType,
  StripeError,
  ValidationError,
  ShippingAddress,
  PaginatedResponse,
} from './types';

export { paymentMessages } from './types';
export type { PaymentLocalization } from './types';

// Client operations
export {
  convertCurrency,
  createPaymentIntent,
  confirmPayment,
  retrievePaymentIntent,
  createCustomer,
  getCustomerPaymentMethods,
  attachPaymentMethod,
  detachPaymentMethod,
  setDefaultPaymentMethod,
  processRefund,
  handleWebhook,
  processWebhookEvent,
  calculateFeesForDisplay,
} from './client';

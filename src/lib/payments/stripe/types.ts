// AlgeriaTrade.dz - Stripe International Cards Types
// For Export Orders Payment Processing

// ============================================
// PAYMENT REQUEST TYPES
// ============================================

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2 (e.g., 'US', 'FR', 'GB')
}

export interface StripePaymentRequest {
  // Order information
  amount: number; // In DZD (Algerian Dinar) - will be converted
  currency: 'EUR' | 'USD' | 'GBP' | 'CHF' | 'CAD' | 'AUD';
  orderId: string;
  
  // Customer information
  customerId?: string; // Local user ID
  customerEmail: string;
  customerName: string;
  
  // Shipping for export orders
  shippingAddress?: ShippingAddress;
  
  // Payment details
  description?: string;
  metadata?: Record<string, string>;
  savePaymentMethod?: boolean;
  
  // Recurring payment setup (for subscriptions)
  setupFutureUsage?: 'off_session' | 'on_session';
}

// ============================================
// PAYMENT RESPONSE TYPES
// ============================================

export interface StripePaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
  publishableKey: string;
  
  // Amount details
  amount: number; // Original amount in DZD
  currency: string; // Target currency
  convertedAmount: number; // After conversion (in smallest unit/cents)
  exchangeRate: number; // Rate used for conversion
  
  // Fee breakdown
  estimatedFees: number; // Estimated Stripe fees in target currency
  
  // Status
  status: string;
  createdAt: string;
}

export interface StripeConfirmResponse {
  success: boolean;
  paymentIntentId?: string;
  status?: string;
  error?: string;
  errorCode?: string;
  nextAction?: {
    type: 'redirect_to_url' | 'use_stripe_sdk' | 'verify_with_microdeposits';
    url?: string;
  };
}

// ============================================
// CUSTOMER TYPES
// ============================================

export interface StripeCustomerRequest {
  userId: string;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface StripeCustomerResponse {
  success: boolean;
  stripeCustomerId?: string;
  customer?: {
    id: string;
    email: string;
    name: string | null;
    created: number;
  };
  error?: string;
}

export interface SavedPaymentMethod {
  id: string;
  type: string; // card, sepa_debit, ideal, etc.
  brand?: string; // visa, mastercard, etc. (for cards)
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
  createdAt: string;
}

// ============================================
// REFUND TYPES
// ============================================

export interface StripeRefundRequest {
  paymentIntentId: string;
  amount?: number; // If omitted, full refund (in cents)
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'expired_uncaptured_charge';
  metadata?: Record<string, string>;
}

export interface StripeRefundResponse {
  success: boolean;
  refundId?: string;
  status?: string; // pending, succeeded, failed, canceled
  amount?: number;
  currency?: string;
  error?: string;
}

// ============================================
// EXCHANGE RATE TYPES
// ============================================

export interface ExchangeRate {
  from: string; // Source currency (usually DZD)
  to: string;   // Target currency
  rate: number; // Exchange rate
  timestamp: number; // When rate was fetched
  source: string; // Provider name
}

export interface ExchangeRateResponse {
  base: string; // Base currency (DZD)
  rates: Record<string, ExchangeRate>;
  lastUpdated: string;
  nextUpdate: string;
  provider: string;
}

// ============================================
// WEBHOOK EVENT TYPES
// ============================================

export interface WebhookEventLog {
  id: string;
  eventType: string;
  eventId: string;
  processed: boolean;
  success: boolean;
  error?: string;
  processedAt: string;
  rawData?: unknown;
}

// ============================================
// TRANSACTION STATUS TYPES
// ============================================

export type StripeTransactionStatus = 
  | 'REQUIRES_PAYMENT_METHOD'
  | 'REQUIRES_CONFIRMATION'
  | 'REQUIRES_ACTION'
  | 'PROCESSING'
  | 'REQUIRES_CAPTURE'
  | 'CANCELED'
  | 'SUCCEEDED';

export type PaymentMethodType = 
  | 'card'
  | 'sepa_debit'
  | 'ideal'
  | 'bancontact'
  | 'sofort'
  | 'giropay'
  | 'eps'
  | 'p24'
  | 'alipay'
  | 'apple_pay'
  | 'google_pay'
  | 'link';

// ============================================
// ERROR TYPES
// ============================================

export interface StripeError {
  code: string;
  message: string;
  type: string;
  decline_code?: string;
  doc_url?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================
// LOCALIZATION TYPES
// ============================================

export interface PaymentLocalization {
  [key: string]: {
    fr: string;
    ar: string;
    en: string;
  };
}

export const paymentMessages: PaymentLocalization = {
  // General
  'payment.title': {
    fr: 'Paiement Sécurisé',
    ar: 'دفع آمن',
    en: 'Secure Payment',
  },
  'payment.processing': {
    fr: 'Traitement en cours...',
    ar: 'جارٍ المعالجة...',
    en: 'Processing...',
  },
  'payment.success': {
    fr: 'Paiement réussi !',
    ar: 'تم الدفع بنجاح!',
    en: 'Payment Successful!',
  },
  'payment.failed': {
    fr: 'Le paiement a échoué',
    ar: 'فشل الدفع',
    en: 'Payment Failed',
  },
  'payment.retry': {
    fr: 'Réessayer',
    ar: 'إعادة المحاولة',
    en: 'Retry',
  },
  
  // Card form
  'card.number': {
    fr: 'Numéro de carte',
    ar: 'رقم البطاقة',
    en: 'Card Number',
  },
  'card.expiry': {
    fr: "Date d'expiration",
    ar: 'تاريخ الانتهاء',
    en: 'Expiry Date',
  },
  'card.cvc': {
    fr: 'CVC/CVV',
    ar: 'رمز الأمان',
    en: 'CVC/CVV',
  },
  'card.name': {
    fr: 'Nom sur la carte',
    ar: 'الاسم على البطاقة',
    en: 'Name on Card',
  },
  
  // Currency
  'currency.select': {
    fr: 'Choisir la devise',
    ar: 'اختر العملة',
    en: 'Select Currency',
  },
  'currency.converted': {
    fr: 'Montant converti',
    ar: 'المبلغ المحول',
    en: 'Converted Amount',
  },
  'exchange.rate': {
    fr: 'Taux de change',
    ar: 'سعر الصرف',
    en: 'Exchange Rate',
  },
  
  // Fees
  'fees.processing': {
    fr: 'Frais de traitement',
    ar: 'رسوم المعالجة',
    en: 'Processing Fee',
  },
  'fees.total': {
    fr: 'Total à payer',
    ar: 'الإجمالي للدفع',
    en: 'Total to Pay',
  },
  
  // Save card
  'card.save': {
    fr: 'Enregistrer cette carte pour les prochains achats',
    ar: 'حفظ هذه البطاقة للمشتريات المستقبلية',
    en: 'Save this card for future purchases',
  },
  
  // Errors
  'error.card.declined': {
    fr: 'Carte refusée',
    ar: 'تم رفض البطاقة',
    en: 'Card Declined',
  },
  'error.insufficient.funds': {
    fr: 'Fonds insuffisants',
    ar: 'رصيد غير كافٍ',
    en: 'Insufficient Funds',
  },
  'error.expired.card': {
    fr: 'Carte expirée',
    ar: 'البطاقة منتهية الصلاحية',
    en: 'Expired Card',
  },
  'error.incorrect.cvc': {
    fr: 'CVC incorrect',
    ar: 'رمز التحقق غير صحيح',
    en: 'Incorrect CVC',
  },
  'error.3ds.required': {
    fr: 'Authentification 3D Secure requise',
    ar: 'مطلوب مصادقة آمنة ثلاثية الأبعاد',
    en: '3D Secure Authentication Required',
  },
};

// ============================================
// UTILITY TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

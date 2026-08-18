// Advanced Negotiation System Configuration
// إعدادات نظام التفاوض المتقدم

export const negotiationConfig = {
  // Rules
  maxCounterOffers: 10,
  offerValidityHours: 72, // 3 days
  minPriceDropPercent: 1, // At least 1% change required
  maxPriceDropPercent: 40, // Max 40% discount allowed
  autoAcceptThreshold: 5, // Auto-accept if within 5%
  
  // Types
  types: ['PRICE', 'QUANTITY', 'DELIVERY_DATE', 'PAYMENT_TERMS', 'BUNDLE'] as const,
  
  // Statuses
  statuses: [
    'PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED', 
    'EXPIRED', 'WITHDRAWN', 'ORDER_CREATED'
  ] as const,

  // Payment terms options
  paymentTerms: [
    { value: 'NET_30', label: 'Net 30 days', ar: 'صافي 30 يوم' },
    { value: 'NET_60', label: 'Net 60 days', ar: 'صافي 60 يوم' },
    { value: 'NET_90', label: 'Net 90 days', ar: 'صافي 90 يوم' },
    { value: 'COD', label: 'Cash on Delivery', ar: 'الدفع عند الاستلام' },
    { value: 'ADVANCE_50', label: '50% Advance', ar: 'دفعة مقدمة 50%' },
    { value: 'LC', label: 'Letter of Credit', ar: 'اعتماد مستندي' },
    { value: 'WIRE_TRANSFER', label: 'Wire Transfer', ar: 'تحويل بنكي' },
  ],

  // Currency settings (Algerian Dinar)
  currency: {
    code: 'DZD',
    symbol: 'د.ج',
    name: 'Algerian Dinar',
    locale: 'fr-DZ',
  },

  // AI Assistant settings
  ai: {
    enabled: true,
    maxSuggestions: 3,
    confidenceThreshold: 0.6,
  },
} as const;

export type NegotiationType = typeof negotiationConfig.types[number];
export type NegotiationStatus = typeof negotiationConfig.statuses[number];
export type PaymentTerm = typeof negotiationConfig.paymentTerms[number]['value'];

// Type definitions for the negotiation system
export interface NegotiationOfferData {
  price?: number;
  quantity?: number;
  deliveryDate?: string;
  paymentTerms?: PaymentTerm;
  message?: string;
}

export interface NegotiationCreateParams {
  productId: string;
  sellerId: string;
  buyerId: string;
  type: NegotiationType;
  originalPrice: number;
  proposedPrice: number;
  quantity?: number;
  deliveryDate?: string;
  paymentTerms?: PaymentTerm;
  message?: string;
}

export interface CounterOfferParams {
  negotiationId: string;
  offerId: string;
  price?: number;
  quantity?: number;
  deliveryDate?: string;
  paymentTerms?: PaymentTerm;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NegotiationSummary {
  id: string;
  status: NegotiationStatus;
  type: NegotiationType;
  currentPrice: number;
  originalPrice: number;
  savingsPercent: number;
  lastActivity: Date;
  expiresAt: Date;
  partyRole: 'buyer' | 'seller';
}

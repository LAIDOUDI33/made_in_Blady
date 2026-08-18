// AlgeriaTrade.dz - Stripe International Cards Configuration
// For Export Orders - Multi-Currency Support

import Stripe from 'stripe';

export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_for_development',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy_for_development',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy_for_development',
  
  // Supported currencies for export orders (international buyers)
  supportedCurrencies: ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD'] as const,
  
  // Minimum amounts per currency (in cents/smallest unit)
  minimumAmounts: {
    EUR: 100, // €1.00 minimum
    USD: 100, // $1.00 minimum
    GBP: 80,  // £0.80 minimum
    CHF: 100, // CHF 1.00 minimum
    CAD: 130, // C$1.30 minimum
    AUD: 150, // A$1.50 minimum
  } as Record<string, number>,
  
  // Feature flags for payment methods
  features: {
    applePay: true,
    googlePay: true,
    link: true,        // Stripe Link autofill
    ideal: true,       // European bank transfers (Netherlands)
    sepaDebit: true,   // Euro direct debit
    bancontact: true,  // Belgian payments
    sofort: true,      // German bank transfers
    giropay: true,     // German online banking
    eps: true,         // Austrian payments
    p24: true,         // Polish transfers
    alipay: true,      // Chinese payments
    wechatPay: false,  // WeChat Pay (requires additional setup)
  },
  
  // Stripe fee structure per currency (percentage + fixed fee in cents)
  feeStructure: {
    EUR: { percentage: 1.5, fixed: 25 },      // 1.5% + €0.25
    USD: { percentage: 2.9, fixed: 30 },      // 2.9% + $0.30
    GBP: { percentage: 2.5, fixed: 20 },      // 2.5% + £0.20
    CHF: { percentage: 2.5, fixed: 30 },      // 2.5% + CHF 0.30
    CAD: { percentage: 2.9, fixed: 30 },      // 2.9% + C$0.30
    AUD: { percentage: 2.9, fixed: 30 },      // 2.9% + A$0.30
  } as Record<string, { percentage: number; fixed: number }>,
  
  // API version
  apiVersion: '2024-06-20' as const,
};

// Currency display information
export const currencyInfo: Record<string, {
  name: string;
  symbol: string;
  flag: string;
  locale: string;
  decimalDigits: number;
}> = {
  EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺', locale: 'fr-FR', decimalDigits: 2 },
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸', locale: 'en-US', decimalDigits: 2 },
  GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧', locale: 'en-GB', decimalDigits: 2 },
  CHF: { name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', locale: 'de-CH', decimalDigits: 2 },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', locale: 'en-CA', decimalDigits: 2 },
  AUD: { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', locale: 'en-AU', decimalDigits: 2 },
};

// Payment method types and their configurations
export const paymentMethodConfig: Record<string, {
  name: string;
  icon: string;
  countries: string[];
  currencies: string[];
}> = {
  card: {
    name: 'Credit/Debit Card',
    icon: '💳',
    countries: [], // All countries
    currencies: [...stripeConfig.supportedCurrencies],
  },
  apple_pay: {
    name: 'Apple Pay',
    icon: '🍎',
    countries: ['US', 'CA', 'AU', 'GB', 'FR', 'DE', 'IT', 'ES', 'CH'],
    currencies: ['USD', 'CAD', 'AUD', 'GBP', 'EUR', 'CHF'],
  },
  google_pay: {
    name: 'Google Pay',
    icon: '🔵',
    countries: ['US', 'CA', 'AU', 'GB', 'FR', 'DE', 'CH'],
    currencies: ['USD', 'CAD', 'AUD', 'GBP', 'EUR', 'CHF'],
  },
  ideal: {
    name: 'iDEAL',
    icon: '🇳🇱',
    countries: ['NL'],
    currencies: ['EUR'],
  },
  sepa_debit: {
    name: 'SEPA Direct Debit',
    icon: '🏦',
    countries: ['AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'],
    currencies: ['EUR'],
  },
  bancontact: {
    name: 'Bancontact',
    icon: '🇧🇪',
    countries: ['BE'],
    currencies: ['EUR'],
  },
  sofort: {
    name: 'Sofort',
    icon: '🇩🇪',
    countries: ['DE', 'AT', 'BE', 'IT', 'NL', 'PL', 'ES', 'CH'],
    currencies: ['EUR', 'CHF'],
  },
  giropay: {
    name: 'giropay',
    icon: '🇩🇪',
    countries: ['DE'],
    currencies: ['EUR'],
  },
  eps: {
    name: 'EPS',
    icon: '🇦🇹',
    countries: ['AT'],
    currencies: ['EUR'],
  },
  p24: {
    name: 'Przelewy24',
    icon: '🇵🇱',
    countries: ['PL'],
    currencies: ['EUR', 'GBP', 'USD'],
  },
  alipay: {
    name: 'Alipay',
    icon: '💰',
    countries: ['CN', 'AU', 'FR', 'DE', 'GB', 'HK', 'SG', 'US'],
    currencies: ['EUR', 'USD', 'GBP', 'AUD', 'CAD'],
  },
};

// Create and export the Stripe instance
export const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: stripeConfig.apiVersion,
  typescript: true,
});

// Helper to check if a currency is supported
export function isCurrencySupported(currency: string): boolean {
  return stripeConfig.supportedCurrencies.includes(currency as any);
}

// Helper to get minimum amount for a currency
export function getMinimumAmount(currency: string): number {
  return stripeConfig.minimumAmounts[currency] || 100;
}

// Helper to calculate Stripe fees for an amount
export function calculateStripeFees(amountInCents: number, currency: string): {
  feeAmount: number;
  totalAmount: number;
  netAmount: number;
} {
  const fees = stripeConfig.feeStructure[currency] || { percentage: 2.9, fixed: 30 };
  const feeAmount = Math.round((amountInCents * fees.percentage / 100) + fees.fixed);
  
  return {
    feeAmount,
    totalAmount: amountInCents + feeAmount,
    netAmount: amountInCents - feeAmount,
  };
}

// Format currency amount for display
export function formatCurrency(amount: number, currency: string): string {
  const info = currencyInfo[currency];
  if (!info) {
    return `${currency} ${amount / 100}`;
  }
  
  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: info.decimalDigits,
  }).format(amount / Math.pow(10, info.decimalDigits));
}

// Get available payment methods for a country/currency combination
export function getAvailablePaymentMethods(
  countryCode?: string,
  currency?: string
): typeof paymentMethodConfig {
  const methods: typeof paymentMethodConfig = {};
  
  for (const [key, config] of Object.entries(paymentMethodConfig)) {
    // Check if feature is enabled
    const featureKey = key.replace(/_/g, '') as keyof typeof stripeConfig.features;
    if (!(featureKey in stripeConfig.features) || !stripeConfig.features[featureKey]) {
      continue;
    }
    
    // Check country restriction (if provided)
    if (countryCode && config.countries.length > 0 && !config.countries.includes(countryCode)) {
      continue;
    }
    
    // Check currency support (if provided)
    if (currency && !config.currencies.includes(currency)) {
      continue;
    }
    
    methods[key] = config;
  }
  
  return methods;
}

export type SupportedCurrency = typeof stripeConfig.supportedCurrencies[number];
export type PaymentMethodType = keyof typeof paymentMethodConfig;

// AlgeriaTrade.dz - Stripe International Cards Configuration
// For Export Orders - Multi-Currency Support

import Stripe from 'stripe';

/**
 * Validate that all required Stripe environment variables are present.
 * Throws a descriptive error if any are missing.
 * This is a security-critical function - NEVER fall back to hardcoded keys.
 */
function validateStripeConfig(): void {
  const requiredEnvVars = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value || value.trim() === '')
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `🔴 CRITICAL SECURITY ERROR: Missing required Stripe environment variables:\n` +
      `  - ${missingVars.join('\n  - ')}\n\n` +
      `To fix this:\n` +
      `1. Copy .env.example to .env.local\n` +
      `2. Add your Stripe API keys from https://dashboard.stripe.com/apikeys\n` +
      `3. Never commit real keys to version control!\n\n` +
      `Required variables:\n` +
      `  - STRIPE_SECRET_KEY: Your secret API key (sk_live_... or sk_test_...)\n` +
      `  - STRIPE_PUBLISHABLE_KEY: Your publishable key (pk_live_... or pk_test_...)\n` +
      `  - STRIPE_WEBHOOK_SECRET: Your webhook signing secret (whsec_...)`
    );
  }

  // Validate key formats to catch common mistakes
  const { STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET } = requiredEnvVars;

  if (!STRIPE_SECRET_KEY!.startsWith('sk_')) {
    console.warn(
      '⚠️ WARNING: STRIPE_SECRET_KEY does not start with "sk_". ' +
      'Please verify your Stripe secret key format.'
    );
  }

  if (!STRIPE_PUBLISHABLE_KEY!.startsWith('pk_')) {
    console.warn(
      '⚠️ WARNING: STRIPE_PUBLISHABLE_KEY does not start with "pk_". ' +
      'Please verify your Stripe publishable key format.'
    );
  }

  if (!STRIPE_WEBHOOK_SECRET!.startsWith('whsec_')) {
    console.warn(
      '⚠️ WARNING: STRIPE_WEBHOOK_SECRET does not start with "whsec_". ' +
      'Please verify your Stripe webhook secret format.'
    );
  }
}

// Validate configuration at module load time
// This ensures the application fails fast with a clear message
// rather than failing silently with dummy keys
validateStripeConfig();

export const stripeConfig = {
  // Keys come ONLY from environment variables - NO FALLBACKS for security
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  
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

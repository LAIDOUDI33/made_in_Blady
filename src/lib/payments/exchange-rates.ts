// AlgeriaTrade.dz - Exchange Rate Service
// Fetches and caches live exchange rates for DZD to international currencies

import type { ExchangeRate, ExchangeRateResponse } from './stripe/types';

// ============================================
// CONFIGURATION
// ============================================

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const BASE_CURRENCY = 'DZD';

interface CachedRates {
  data: Record<string, ExchangeRate>;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache (in production, use Redis)
let rateCache: CachedRates | null = null;

// Fallback rates (updated periodically from reliable sources)
const FALLBACK_RATES: Record<string, number> = {
  EUR: 0.00692,
  USD: 0.00748,
  GBP: 0.00593,
  CHF: 0.00718,
  CAD: 0.01008,
  AUD: 0.01127,
};

// ============================================
// RATE PROVIDERS
// ============================================

/**
 * Provider 1: ExchangeRate-API (free tier available)
 * Documentation: https://exchangerate-api.com
 */
async function fetchFromExchangeRateAPI(): Promise<Record<string, ExchangeRate> | null> {
  const apiKey = process.env.EXCHANGERATE_API_KEY;
  
  if (!apiKey) {
    console.log('[Exchange Rates] ExchangeRate-API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: CACHE_TTL / 1000 },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const targetCurrencies = Object.keys(FALLBACK_RATES);
    const rates: Record<string, ExchangeRate> = {};
    
    for (const currency of targetCurrencies) {
      if (data.rates[currency]) {
        rates[currency] = {
          from: BASE_CURRENCY,
          to: currency,
          rate: data.rates[currency],
          timestamp: Date.now(),
          source: 'ExchangeRate-API',
        };
      }
    }

    return rates;
  } catch (error) {
    console.error('[Exchange Rates] ExchangeRate-API error:', error);
    return null;
  }
}

/**
 * Provider 2: Frankfurter API (free, no key required)
 * Documentation: https://www.frankfurter.app
 */
async function fetchFromFrankfurter(): Promise<Record<string, ExchangeRate> | null> {
  try {
    const targetCurrencies = Object.keys(FALLBACK_RATES).join(',');
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${BASE_CURRENCY}&to=${targetCurrencies}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: CACHE_TTL / 1000 },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const rates: Record<string, ExchangeRate> = {};

    if (data.rates) {
      for (const [currency, rate] of Object.entries(data.rates)) {
        rates[currency] = {
          from: BASE_CURRENCY,
          to: currency,
          rate: rate as number,
          timestamp: Date.now(),
          source: 'Frankfurter API',
        };
      }
    }

    return rates;
  } catch (error) {
    console.error('[Exchange Rates] Frankfurter API error:', error);
    return null;
  }
}

/**
 * Provider 3: Alternative fallback using static rates with timestamp
 */
function getFallbackRates(): Record<string, ExchangeRate> {
  const rates: Record<string, ExchangeRate> = {};

  for (const [currency, rate] of Object.entries(FALLBACK_RATES)) {
    rates[currency] = {
      from: BASE_CURRENCY,
      to: currency,
      rate,
      timestamp: Date.now(),
      source: 'Fallback (static)',
    };
  }

  return rates;
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Get exchange rate for a specific currency pair
 * Uses cache first, then fetches from providers in order
 */
export async function getExchangeRate(
  fromCurrency: string = BASE_CURRENCY,
  toCurrency: string
): Promise<ExchangeRate> {
  // Check cache first
  if (rateCache && Date.now() < rateCache.expiresAt) {
    const cached = rateCache.data[`${fromCurrency}_${toCurrency}`];
    if (cached) {
      return cached;
    }
  }

  // Fetch fresh rates
  await refreshRates();

  // Try cache again after refresh
  if (rateCache) {
    const cached = rateCache.data[`${fromCurrency}_${toCurrency}`];
    if (cached) {
      return cached;
    }
  }

  // Return fallback rate
  return {
    from: fromCurrency,
    to: toCurrency,
    rate: FALLBACK_RATES[toCurrency] || 1,
    timestamp: Date.now(),
    source: 'Fallback (static)',
  };
}

/**
 * Get all supported exchange rates
 */
export async function getAllExchangeRates(): Promise<ExchangeRateResponse> {
  await refreshRates();

  const rates = rateCache?.data || getFallbackRates();
  const now = new Date();

  return {
    base: BASE_CURRENCY,
    rates,
    lastUpdated: rateCache ? new Date(rateCache.timestamp).toISOString() : now.toISOString(),
    nextUpdate: new Date(now.getTime() + CACHE_TTL).toISOString(),
    provider: Object.values(rates)[0]?.source || 'Fallback',
  };
}

/**
 * Convert amount between currencies
 */
export async function convertAmount(
  amount: number,
  fromCurrency: string = BASE_CURRENCY,
  toCurrency: string
): Promise<{
  originalAmount: number;
  convertedAmount: number;
  rate: ExchangeRate;
}> {
  const rate = await getExchangeRate(fromCurrency, toCurrency);

  // For DZD as base, multiply by rate; otherwise divide
  let convertedAmount: number;
  
  if (fromCurrency === BASE_CURRENCY) {
    convertedAmount = amount * rate.rate;
  } else {
    // Need inverse rate
    const inverseRate = await getExchangeRate(toCurrency, fromCurrency);
    convertedAmount = amount / inverseRate.rate;
  }

  return {
    originalAmount: amount,
    convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
    rate,
  };
}

/**
 * Refresh exchange rates from providers
 * Tries each provider in sequence until one succeeds
 */
async function refreshRates(): Promise<void> {
  // Check if cache is still valid
  if (rateCache && Date.now() < rateCache.expiresAt) {
    return;
  }

  // Try providers in order
  const providers = [
    { name: 'Frankfurter', fn: fetchFromFrankfurter },
    { name: 'ExchangeRate-API', fn: fetchFromExchangeRateAPI },
  ];

  let rates: Record<string, ExchangeRate> | null = null;

  for (const provider of providers) {
    try {
      rates = await provider.fn();
      if (rates && Object.keys(rates).length > 0) {
        console.log(`[Exchange Rates] Successfully fetched from ${provider.name}`);
        break;
      }
    } catch (error) {
      console.warn(`[Exchange Rates] ${provider.name} failed:`, error);
    }
  }

  // Use fallback if all providers failed
  if (!rates || Object.keys(rates).length === 0) {
    console.log('[Exchange Rates] Using fallback rates');
    rates = getFallbackRates();
  }

  // Update cache
  rateCache = {
    data: rates,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_TTL,
  };

  // Log rate update
  logRateUpdate(rates);
}

// ============================================
// LOGGING & HISTORY
// ============================================

/**
 * Log rate updates for audit trail
 */
function logRateUpdate(rates: Record<string, ExchangeRate>): void {
  const rateSummary = Object.entries(rates)
    .map(([key, value]) => `${key}: ${value.rate}`)
    .join(', ');
  
  console.log(`[Exchange Rates] Updated at ${new Date().toISOString()}: ${rateSummary}`);
}

/**
 * Store historical rate for invoice accuracy (optional)
 * In production, this would save to database
 */
export function storeHistoricalRate(
  orderId: string,
  currency: string,
  rate: number
): void {
  // This could be stored in the database for invoice accuracy
  // For now, just log it
  console.log(`[Exchange Rates] Stored historical rate for ${orderId}: ${BASE_CURRENCY} -> ${currency} = ${rate}`);
}

/**
 * Get historical rate for an order (for invoice accuracy)
 */
export async function getHistoricalRate(
  orderId: string,
  currency: string
): Promise<number | null> {
  // In production, this would query the database
  // For now, return current rate
  try {
    const rate = await getExchangeRate(BASE_CURRENCY, currency);
    return rate.rate;
  } catch {
    return null;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format exchange rate for display
 */
export function formatExchangeRate(rate: ExchangeRate): string {
  return `1 ${rate.from} = ${rate.rate.toFixed(4)} ${rate.to}`;
}

/**
 * Format converted amount for display
 */
export function formatConvertedAmount(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get list of supported currencies
 */
export function getSupportedCurrencies(): Array<{
  code: string;
  name: string;
  symbol: string;
  flag: string;
}> {
  return [
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  ];
}

/**
 * Clear the rate cache (useful for testing or force refresh)
 */
export function clearRateCache(): void {
  rateCache = null;
  console.log('[Exchange Rates] Cache cleared');
}

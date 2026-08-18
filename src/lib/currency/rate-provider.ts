// Exchange Rate Provider for AlgeriaTrade.dz
// Fetches rates from multiple sources with automatic fallback

import {
  CurrencyCode,
  exchangeRateConfig,
  getCurrencyCodes,
  isSupportedCurrency,
} from './config'

export interface RateSource {
  name: string
  priority: number
  isAvailable: boolean
  lastCheck: Date | null
  lastError?: string
}

export interface CachedRates {
  rates: Map<CurrencyCode, number>
  source: string
  fetchedAt: Date
  validUntil: Date
}

// In-memory cache for exchange rates
let cachedRates: CachedRates | null = null

// Rate source health status
const rateSources: Map<string, RateSource> = new Map([
  ['fixer', { name: 'Fixer.io', priority: 1, isAvailable: true, lastCheck: null }],
  ['ecb', { name: 'European Central Bank', priority: 2, isAvailable: true, lastCheck: null }],
  ['openexchangerates', { name: 'Open Exchange Rates', priority: 3, isAvailable: true, lastCheck: null }],
  ['custom', { name: 'Manual/Admin Rates', priority: 4, isAvailable: true, lastCheck: null }],
])

// Fallback rates when all APIs fail (approximate values)
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  DZD: 1,
  EUR: 146.85,     // ~1 EUR = 146.85 DZD
  USD: 135.02,     // ~1 USD = 135.02 DZD
  GBP: 170.45,     // ~1 GBP = 170.45 DZD
  CHF: 152.30,     // ~1 CHF = 152.30 DZD
  CAD: 99.82,      // ~1 CAD = 99.82 DZD
  TND: 43.72,      // ~1 TND = 43.72 DZD
  MAD: 13.42,      // ~1 MAD = 13.42 DZD
}

/**
 * Get current exchange rates (with caching)
 */
export async function getExchangeRates(): Promise<Map<CurrencyCode, number>> {
  const now = new Date()

  // Return cached rates if still valid
  if (cachedRates && now < cachedRates.validUntil) {
    return new Map(cachedRates.rates)
  }

  // Try to fetch fresh rates based on provider priority
  const providers = [...rateSources.entries()]
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([key]) => key)

  for (const provider of providers) {
    try {
      const rates = await fetchFromProvider(provider)
      if (rates && rates.size > 0) {
        // Cache the results
        cachedRates = {
          rates,
          source: provider,
          fetchedAt: now,
          validUntil: new Date(now.getTime() + exchangeRateConfig.cacheTTL * 1000),
        }

        // Update source health
        const source = rateSources.get(provider)
        if (source) {
          source.isAvailable = true
          source.lastCheck = now
          source.lastError = undefined
        }

        return new Map(rates)
      }
    } catch (error) {
      console.error(`Rate provider ${provider} failed:`, error)
      
      const source = rateSources.get(provider)
      if (source) {
        source.isAvailable = false
        source.lastCheck = now
        source.lastError = error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // All providers failed - use fallback rates
  console.warn('All rate providers failed, using fallback rates')
  
  cachedRates = {
    rates: new Map(Object.entries(FALLBACK_RATES) as [CurrencyCode, number][]),
    source: 'fallback',
    fetchedAt: now,
    validUntil: new Date(now.getTime() + 300000), // Cache fallbacks for 5 minutes
  }

  return new Map(cachedRates.rates)
}

/**
 * Fetch rates from a specific provider
 */
async function fetchFromProvider(provider: string): Promise<Map<CurrencyCode, number> | null> {
  switch (provider) {
    case 'fixer':
      return await fetchFromFixer()
    case 'ecb':
      return await fetchFromECB()
    case 'openexchangerates':
      return await fetchFromOpenExchangeRates()
    case 'custom':
      return await fetchCustomRates()
    default:
      throw new Error(`Unknown rate provider: ${provider}`)
  }
}

/**
 * Fetch from Fixer.io API (primary provider)
 */
async function fetchFromFixer(): Promise<Map<CurrencyCode, number> | null> {
  const apiKey = process.env.FIXER_API_KEY
  if (!apiKey) {
    console.log('Fixer.io API key not configured')
    return null
  }

  try {
    const response = await fetch(
      `http://data.fixer.io/api/latest?access_key=${apiKey}&base=EUR`,
      {
        next: { revalidate: exchangeRateConfig.cacheTTL },
        headers: { 'Accept': 'application/json' },
      }
    )

    if (!response.ok) {
      throw new Error(`Fixer.io API returned ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error?.info || 'Fixer.io API error')
    }

    // Fixer.io returns EUR-based rates, convert to DZD base
    return convertEurBasedToDzd(data.rates)
  } catch (error) {
    console.error('Fixer.io fetch error:', error)
    return null
  }
}

/**
 * Fetch from European Central Bank (free backup)
 */
export async function fetchFromECB(): Promise<Map<CurrencyCode, number> | null> {
  try {
    const response = await fetch(
      'https://api.ecb.europa.eu/eurofxref/eurofxref-daily.xml',
      {
        next: { revalidate: 3600 }, // ECB updates daily
        headers: { 'Accept': 'application/xml' },
      }
    )

    if (!response.ok) {
      throw new Error(`ECB API returned ${response.status}`)
    }

    const text = await response.text()
    const ecbRates = parseECBXML(text)

    if (ecbRates.size === 0) {
      throw new Error('No rates found in ECB response')
    }

    // ECB provides EUR-based rates, convert to DZD base
    return convertEurBasedToDzd(Object.fromEntries(ecbRates))
  } catch (error) {
    console.error('ECB fetch error:', error)
    return null
  }
}

/**
 * Parse ECB XML format
 */
function parseECBXML(xmlText: string): Map<string, number> {
  const rates = new Map<string, number>()
  
  // Regex to extract currency and rate from ECB XML format
  const regex = /currency='([A-Z]+)'\s+rate='([\d.]+)'/g
  let match

  while ((match = regex.exec(xmlText)) !== null) {
    rates.set(match[1], parseFloat(match[2]))
  }

  // Add EUR itself with rate 1
  rates.set('EUR', 1)

  return rates
}

/**
 * Fetch from Open Exchange Rates API (backup)
 */
async function fetchFromOpenExchangeRates(): Promise<Map<CurrencyCode, number> | null> {
  const apiKey = process.env.OPEN_EXCHANGE_RATES_API_KEY
  if (!apiKey) {
    console.log('Open Exchange Rates API key not configured')
    return null
  }

  try {
    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=USD`,
      {
        next: { revalidate: 3600 },
        headers: { 'Accept': 'application/json' },
      }
    )

    if (!response.ok) {
      throw new Error(`OER API returned ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.rates) {
      throw new Error('Invalid OER response format')
    }

    // OER returns USD-based rates, need to convert to DZD base
    const usdToDzd = data.rates.DZD || FALLBACK_RATES.USD
    const rates = new Map<CurrencyCode, number>()
    
    rates.set('DZD', 1)
    rates.set('USD', usdToDzd)

    // Convert other currencies via USD
    for (const [code, rate] of Object.entries(data.rates)) {
      if (isSupportedCurrency(code) && code !== 'DZD' && code !== 'USD') {
        // DZD -> USD -> Target currency
        const dzdRate = usdToDzd / (rate as number)
        rates.set(code as CurrencyCode, Math.round(dzdRate * 10000) / 10000)
      }
    }

    // Add EUR and GBP if not present
    if (!rates.has('EUR')) {
      rates.set('EUR', FALLBACK_RATES.EUR)
    }
    if (!rates.has('GBP')) {
      rates.set('GBP', FALLBACK_RATES.GBP)
    }

    return rates
  } catch (error) {
    console.error('Open Exchange Rates fetch error:', error)
    return null
  }
}

/**
 * Fetch custom/admin-configured rates from database
 */
async function fetchCustomRates(): Promise<Map<CurrencyCode, number> | null> {
  try {
    // Dynamic import to avoid circular dependencies
    const { db } = await import('@/lib/db')

    // Find latest manual/admin rates
    const dbRates = await db.exchangeRate.findMany({
      where: {
        fromCurrency: 'DZD',
        source: 'manual',
        validUntil: {
          gte: new Date(),
        },
      },
      orderBy: {
        fetchedAt: 'desc',
      },
    })

    if (dbRates.length === 0) {
      return null
    }

    const rates = new Map<CurrencyCode, number>()
    rates.set('DZD', 1)

    for (const rate of dbRates) {
      if (isSupportedCurrency(rate.toCurrency)) {
        rates.set(rate.toCurrency as CurrencyCode, Number(rate.rate))
      }
    }

    // Only return if we have most supported currencies
    if (rates.size >= getCurrencyCodes().length / 2) {
      return rates
    }

    return null
  } catch (error) {
    console.error('Custom rates fetch error:', error)
    return null
  }
}

/**
 * Convert EUR-based rates to DZD-based rates
 */
function convertEurBasedToDzd(eurRates: Record<string, number>): Map<CurrencyCode, number> {
  const rates = new Map<CurrencyCode, number>()
  
  // We need to know EUR to DZD rate - use fallback or calculate
  const eurToUsd = eurRates.USD || 1.08
  const usdToDzd = FALLBACK_RATES.USD
  
  // Approximate EUR to DZD rate
  const eurToDzd = eurToUsd * usdToDzd

  rates.set('DZD', 1)
  rates.set('EUR', Math.round(eurToDzd * 100) / 100)

  // Convert each currency rate to DZD base
  for (const [code, eurRate] of Object.entries(eurRates)) {
    if (isSupportedCurrency(code) && code !== 'EUR') {
      // If 1 EUR = X of this currency, then 1 DZD = X/eurToDzd of this currency
      // So 1 of this currency = eurToDzd/X DZD
      const dzdRate = eurToDzd / eurRate
      rates.set(code as CurrencyCode, Math.round(dzdRate * 10000) / 10000)
    }
  }

  // Fill in any missing currencies with fallback values
  for (const code of getCurrencyCodes()) {
    if (!rates.has(code)) {
      rates.set(code, FALLBACK_RATES[code])
    }
  }

  return rates
}

/**
 * Store rates in cache (can be called after manual update)
 */
export function cacheRates(rates: Map<CurrencyCode, number>, source: string): void {
  const now = new Date()
  cachedRates = {
    rates: new Map(rates),
    source,
    fetchedAt: now,
    validUntil: new Date(now.getTime() + exchangeRateConfig.cacheTTL * 1000),
  }
}

/**
 * Get currently cached rates without fetching
 */
export function getCachedRates(): Map<string, number> | null {
  if (!cachedRates) return null
  return new Map(cachedRates.rates)
}

/**
 * Invalidate cache to force refresh on next request
 */
export function invalidateCache(): void {
  cachedRates = null
}

/**
 * Check health of all rate providers
 */
export async function healthCheck(): Promise<Record<string, RateSource>> {
  // Quick check each provider
  for (const [key, source] of rateSources.entries()) {
    try {
      switch (key) {
        case 'fixer':
          if (process.env.FIXER_API_KEY) {
            const result = await fetchFromFixer()
            source.isAvailable = !!result
          } else {
            source.isAvailable = false
            source.lastError = 'API key not configured'
          }
          break
        case 'ecb':
          const ecbResult = await fetchFromECB()
          source.isAvailable = !!ecbResult
          break
        case 'openexchangerates':
          if (process.env.OPEN_EXCHANGE_RATES_API_KEY) {
            const oerResult = await fetchFromOpenExchangeRates()
            source.isAvailable = !!oerResult
          } else {
            source.isAvailable = false
            source.lastError = 'API key not configured'
          }
          break
        case 'custom':
          const customResult = await fetchCustomRates()
          source.isAvailable = !!customResult
          break
      }
      source.lastCheck = new Date()
    } catch (error) {
      source.isAvailable = false
      source.lastError = error instanceof Error ? error.message : 'Unknown error'
      source.lastCheck = new Date()
    }
  }

  return Object.fromEntries(rateSources)
}

/**
 * Get info about current rate source
 */
export function getCurrentRateSource(): { source: string; fetchedAt: Date | null; validUntil: Date | null } {
  if (!cachedRates) {
    return { source: 'none', fetchedAt: null, validUntil: null }
  }

  return {
    source: cachedRates.source,
    fetchedAt: cachedRates.fetchedAt,
    validUntil: cachedRates.validUntil,
  }
}

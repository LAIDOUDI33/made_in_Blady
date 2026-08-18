// Multi-Currency Support Service
// Supports: DZD, USD, EUR, GBP, CAD, TND, MAD

import { db } from '@/lib/db'

export type SupportedCurrency = 'DZD' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'TND' | 'MAD'

export interface CurrencyRate {
  from: SupportedCurrency
  to: SupportedCurrency
  rate: number
  updatedAt: Date
  source: string // 'central_bank_algeria' or 'open_exchange_rates'
}

export interface CurrencyInfo {
  code: SupportedCurrency
  name: string
  nameLocalized: { en: string; fr: string; ar: string }
  symbol: string // د.ج, $, €, etc.
  locale: string // fr-DZ, en-US, etc.
  decimalDigits: number
  flagEmoji: string // 🇩🇿, 🇺🇸, 🇪🇺
  symbolPosition: 'before' | 'after'
  spaceBetween: boolean
}

// Currency information for all supported currencies
export const CURRENCIES: Record<SupportedCurrency, CurrencyInfo> = {
  DZD: {
    code: 'DZD',
    name: 'Algerian Dinar',
    nameLocalized: {
      en: 'Algerian Dinar',
      fr: 'Dinar Algérien',
      ar: 'دينار جزائري',
    },
    symbol: 'د.ج',
    locale: 'fr-DZ',
    decimalDigits: 2,
    flagEmoji: '🇩🇿',
    symbolPosition: 'after',
    spaceBetween: true,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    nameLocalized: {
      en: 'US Dollar',
      fr: 'Dollar Américain',
      ar: 'دولار أمريكي',
    },
    symbol: '$',
    locale: 'en-US',
    decimalDigits: 2,
    flagEmoji: '🇺🇸',
    symbolPosition: 'before',
    spaceBetween: false,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    nameLocalized: {
      en: 'Euro',
      fr: 'Euro',
      ar: 'يورو',
    },
    symbol: '€',
    locale: 'fr-FR',
    decimalDigits: 2,
    flagEmoji: '🇪🇺',
    symbolPosition: 'before',
    spaceBetween: false,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    nameLocalized: {
      en: 'British Pound',
      fr: 'Livre Sterling',
      ar: 'جنيه إسترليني',
    },
    symbol: '£',
    locale: 'en-GB',
    decimalDigits: 2,
    flagEmoji: '🇬🇧',
    symbolPosition: 'before',
    spaceBetween: false,
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    nameLocalized: {
      en: 'Canadian Dollar',
      fr: 'Dollar Canadien',
      ar: 'دولار كندي',
    },
    symbol: '$',
    locale: 'en-CA',
    decimalDigits: 2,
    flagEmoji: '🇨🇦',
    symbolPosition: 'before',
    spaceBetween: true,
  },
  TND: {
    code: 'TND',
    name: 'Tunisian Dinar',
    nameLocalized: {
      en: 'Tunisian Dinar',
      fr: 'Dinar Tunisien',
      ar: 'دينار تونسي',
    },
    symbol: 'د.ت',
    locale: 'ar-TN',
    decimalDigits: 3,
    flagEmoji: '🇹🇳',
    symbolPosition: 'after',
    spaceBetween: true,
  },
  MAD: {
    code: 'MAD',
    name: 'Moroccan Dirham',
    nameLocalized: {
      en: 'Moroccan Dirham',
      fr: 'Dirham Marocain',
      ar: 'درهم مغربي',
    },
    symbol: 'MAD',
    locale: 'ar-MA',
    decimalDigits: 2,
    flagEmoji: '🇲🇦',
    symbolPosition: 'after',
    spaceBetween: true,
  },
}

// In-memory cache for exchange rates
let ratesCache: Map<string, number> | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Get all exchange rates (base currency: DZD)
 */
export async function getExchangeRates(): Promise<Map<SupportedCurrency, number>> {
  const now = Date.now()
  
  // Return cached rates if still valid
  if (ratesCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return ratesCache as Map<SupportedCurrency, number>
  }

  try {
    // Try to fetch from database first
    const dbRates = await db.exchangeRate.findMany({
      where: {
        fromCurrency: 'DZD',
        fetchedAt: {
          gte: new Date(now - CACHE_TTL_MS),
        },
      },
    })

    if (dbRates.length >= Object.keys(CURRENCIES).length - 1) {
      const rates = new Map<SupportedCurrency, number>()
      rates.set('DZD', 1) // Base currency
      
      for (const rate of dbRates) {
        if (rate.toCurrency in CURRENCIES) {
          rates.set(rate.toCurrency as SupportedCurrency, Number(rate.rate))
        }
      }

      ratesCache = rates as unknown as Map<string, number>
      cacheTimestamp = now
      return rates
    }

    // Fetch fresh rates from external API
    return await fetchFreshRates()
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    
    // Return cached rates even if expired
    if (ratesCache) {
      return ratesCache as Map<SupportedCurrency, number>
    }
    
    // Return fallback rates
    return getFallbackRates()
  }
}

/**
 * Fetch fresh rates from external APIs
 */
async function fetchFreshRates(): Promise<Map<SupportedCurrency, number>> {
  try {
    // Try European Central Bank API first (free, reliable)
    const ecbResponse = await fetch(
      'https://api.ecb.europa.eu/eurofxref/eurofxref-daily.xml',
      { next: { revalidate: CACHE_TTL_MS / 1000 } }
    )

    if (ecbResponse.ok) {
      const ecbRates = await parseECBRates(ecbResponse)
      
      if (ecbRates.size > 0) {
        // ECB provides rates relative to EUR, convert to DZD base
        const dzdToEur = getFallbackDZDRate('EUR')
        const rates = new Map<SupportedCurrency, number>()
        
        rates.set('DZD', 1)
        
        // Convert all rates to DZD base
        for (const [currency, eurRate] of ecbRates.entries()) {
          if (currency in CURRENCIES && currency !== 'DZD') {
            // Rate from DZD to this currency
            const dzdRate = dzdToEur / eurRate
            rates.set(currency as SupportedCurrency, Math.round(dzdRate * 10000) / 10000)
          }
        }

        // Save to database
        await saveRatesToDB(rates)
        
        ratesCache = rates as unknown as Map<string, number>
        cacheTimestamp = Date.now()
        
        return rates
      }
    }

    throw new Error('ECB API failed')
  } catch (error) {
    console.error('Error fetching from ECB:', error)
    
    // Try Open Exchange Rates as fallback (requires API key)
    if (process.env.OPEN_EXCHANGE_RATES_API_KEY) {
      try {
        const oerRates = await fetchOpenExchangeRates()
        if (oerRates) return oerRates
      } catch (oerError) {
        console.error('OER also failed:', oerError)
      }
    }

    return getFallbackRates()
  }
}

/**
 * Parse ECB XML response
 */
async function parseECBRates(response: Response): Promise<Map<string, number>> {
  const text = await response.text()
  const rates = new Map<string, number>()
  
  // Simple regex parsing of ECB XML format
  const regex = /currency='([A-Z]+)'\s+rate='([\d.]+)'/g
  let match
  
  while ((match = regex.exec(text)) !== null) {
    rates.set(match[1], parseFloat(match[2]))
  }
  
  // Add EUR itself with rate 1
  rates.set('EUR', 1)
  
  return rates
}

/**
 * Fetch from Open Exchange Rates API
 */
async function fetchOpenExchangeRates(): Promise<Map<SupportedCurrency, number> | null> {
  const apiKey = process.env.OPEN_EXCHANGE_RATES_API_KEY
  if (!apiKey) return null

  const response = await fetch(
    `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=USD`,
    { next: { revalidate: 3600 } }
  )

  if (!response.ok) return null

  const data = await response.json()
  if (!data.rates) return null

  const rates = new Map<SupportedCurrency, number>()
  rates.set('DZD', 1)

  // OER returns USD-based rates, we need DZD-based
  // Assuming we know DZD to USD rate
  const usdToDZD = data.rates.DZD || 135 // Fallback

  for (const [code, rate] of Object.entries(data.rates)) {
    if (code in CURRENCIES && code !== 'DZD') {
      // Convert: DZD -> USD -> Target
      const targetRate = usdToDZD / (rate as number)
      rates.set(code as SupportedCurrency, Math.round(targetRate * 10000) / 10000)
    }
  }

  await saveRatesToDB(rates)
  ratesCache = rates as unknown as Map<string, number>
  cacheTimestamp = Date.now()

  return rates
}

/**
 * Get fallback rates (when APIs are unavailable)
 */
function getFallbackRates(): Map<SupportedCurrency, number> {
  console.warn('Using fallback exchange rates')
  
  return new Map([
    ['DZD', 1],
    ['USD', 135.02],     // ~1 USD = 135 DZD
    ['EUR', 146.85],     // ~1 EUR = 147 DZD
    ['GBP', 170.45],     // ~1 GBP = 170 DZD
    ['CAD', 99.82],      // ~1 CAD = 100 DZD
    ['TND', 43.72],      // ~1 TND = 43.7 DZD
    ['MAD', 13.42],      // ~1 MAD = 13.4 DZD
  ])
}

/**
 * Get fallback DZD to specific currency rate
 */
function getFallbackDZDRate(currency: SupportedCurrency): number {
  const fallbacks: Record<SupportedCurrency, number> = {
    DZD: 1,
    USD: 0.0074,
    EUR: 0.0068,
    GBP: 0.0059,
    CAD: 0.0100,
    TND: 0.0229,
    MAD: 0.0745,
  }
  return fallbacks[currency]
}

/**
 * Save rates to database
 */
async function saveRatesToDB(rates: Map<SupportedCurrency, number>): Promise<void> {
  try {
    const operations = []
    
    for (const [toCurrency, rate] of rates.entries()) {
      if (toCurrency === 'DZD') continue
      
      operations.push(
        db.exchangeRate.upsert({
          where: {
            fromCurrency_toCurrency: {
              fromCurrency: 'DZD',
              toCurrency,
            },
          },
          update: {
            rate: rate.toString(),
            source: 'european_central_bank',
            fetchedAt: new Date(),
          },
          create: {
            fromCurrency: 'DZD',
            toCurrency,
            rate: rate.toString(),
            source: 'european_central_bank',
          },
        })
      )
    }
    
    await Promise.all(operations)
  } catch (error) {
    console.error('Error saving rates to DB:', error)
  }
}

/**
 * Convert amount between currencies
 */
export async function convertAmount(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency
): Promise<number> {
  if (from === to) return amount

  const rates = await getExchangeRates()
  const fromRate = rates.get(from) || 1
  const toRate = rates.get(to) || 1

  // Convert: amount in "from" -> DZD -> "to"
  const amountInDZD = amount / fromRate
  const convertedAmount = amountInDZD * toRate

  return Math.round(convertedAmount * 100) / 100
}

/**
 * Format currency amount according to locale conventions
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  options?: { showCode?: boolean; compact?: boolean }
): string {
  const info = CURRENCIES[currency]
  
  if (!info) {
    return `${amount.toFixed(2)} ${currency}`
  }

  const formatted = new Intl.NumberFormat(info.locale, {
    minimumFractionDigits: info.decimalDigits,
    maximumFractionDigits: options?.compact ? 0 : info.decimalDigits,
  }).format(amount)

  const symbol = info.symbol
  const space = info.spaceBetween ? ' ' : ''

  let result: string
  
  if (info.symbolPosition === 'before') {
    result = `${symbol}${space}${formatted}`
  } else {
    result = `${formatted}${space}${symbol}`
  }

  if (options?.showCode && currency !== 'DZD') {
    result += ` (${currency})`
  }

  return result
}

/**
 * Detect user's preferred currency from request
 */
export function detectUserCurrency(request: Request): SupportedCurrency {
  // Check for cookie first
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const match = cookieHeader.match(/preferred_currency=([^;]+)/)
    if (match && match[1] in CURRENCIES) {
      return match[1] as SupportedCurrency
    }
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || ''
  
  const languageMap: Array<{ pattern: RegExp; currency: SupportedCurrency }> = [
    { pattern: /\b(fr-DZ|ar-DZ)\b/i, currency: 'DZD' },
    { pattern: /\b(en-US)\b/i, currency: 'USD' },
    { pattern: /\b(en-GB)\b/i, currency: 'GBP' },
    { pattern: /\b(fr-FR|fr-BE|fr-CH)\b/i, currency: 'EUR' },
    { pattern: /\b(de-DE|it-ES|pt-PT|nl-NL)\b/i, currency: 'EUR' },
    { pattern: /\b(en-CA)\b/i, currency: 'CAD' },
    { pattern: /\b(ar-TN)\b/i, currency: 'TND' },
    { pattern: /\b(ar-MA|fr-MA)\b/i, currency: 'MAD' },
  ]

  for (const { pattern, currency } of languageMap) {
    if (pattern.test(acceptLanguage)) {
      return currency
    }
  }

  // Default to DZD for AlgeriaTrade platform
  return 'DZD'
}

/**
 * Get cached rates without fetching
 */
export function getCachedRates(): Map<SupportedCurrency, number> | null {
  if (!ratesCache) return null
  return ratesCache as Map<SupportedCurrency, number>
}

/**
 * Force refresh rates from sources
 */
export async function updateRates(): Promise<Map<SupportedCurrency, number>> {
  // Clear cache
  ratesCache = null
  cacheTimestamp = 0
  
  return getExchangeRates()
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code: SupportedCurrency): CurrencyInfo {
  return CURRENCIES[code]
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): CurrencyInfo[] {
  return Object.values(CURRENCIES)
}

/**
 * Format price range display
 */
export function formatPriceRange(
  min: number,
  max: number,
  currency: SupportedCurrency
): string {
  if (min === max) {
    return formatCurrency(min, currency)
  }
  
  return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`
}

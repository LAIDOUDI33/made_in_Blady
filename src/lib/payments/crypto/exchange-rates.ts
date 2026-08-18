// Exchange Rates Service for Cryptocurrency Payments
// Fetches rates from CoinGecko API with fallbacks to Binance and CoinMarketCap

import { cryptoConfig, SupportedCrypto } from './config'

export interface ExchangeRate {
  cryptocurrency: SupportedCrypto
  rateToDZD: number
  rateToUSD: number
  source: string
  fetchedAt: Date
  expiresAt: Date
}

export interface RateCacheEntry {
  id?: string
  cryptocurrency: string
  rateToDZD: number
  source: string
  fetchedAt: Date
  expiresAt: Date
}

// In-memory cache for exchange rates (fallback when DB unavailable)
const memoryCache = new Map<string, { rate: number; fetchedAt: Date; expiresAt: Date }>()

// CoinGecko API IDs for supported cryptocurrencies
const COINGECKO_IDS: Record<SupportedCrypto, string> = {
  USDT: 'tether',
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDC: 'usd-coin',
}

/**
 * Fetch current exchange rate from CoinGecko API (free tier)
 */
async function fetchFromCoinGecko(crypto: SupportedCrypto): Promise<{ dzdRate: number; usdRate: number } | null> {
  try {
    const coinId = COINGECKO_IDS[crypto]
    const apiKey = process.env.COINGECKO_API_KEY
    
    let url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=dzd,usd`
    
    // Add API key if available (for higher rate limits)
    if (apiKey) {
      url += `&x_cg_demo_api_key=${apiKey}`
    }
    
    const response = await fetch(url, {
      next: { revalidate: 30 }, // Cache for 30 seconds
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.warn(`CoinGecko API error for ${crypto}: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    
    if (!data[coinId]) {
      console.warn(`No data returned from CoinGecko for ${coinId}`)
      return null
    }
    
    return {
      dzdRate: data[coinId].dzd || 0,
      usdRate: data[coinId].usd || 0,
    }
  } catch (error) {
    console.error('Error fetching from CoinGecko:', error)
    return null
  }
}

/**
 * Fallback: Fetch rate from Binance API
 * Note: Binance doesn't directly support DZD, so we convert via USD
 */
async function fetchFromBinance(crypto: SupportedCrypto): Promise<{ dzdRate: number; usdRate: number } | null> {
  try {
    // Determine trading pair
    const tradingPairs: Record<SupportedCrypto, string> = {
      USDT: 'USDTUSDC', // Stablecoin pair (approximately 1:1)
      BTC: 'BTCUSDT',
      ETH: 'ETHUSDT',
      USDC: 'USDCUSDT', // Stablecoin pair (approximately 1:1)
    }
    
    const symbol = tradingPairs[crypto]
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
    
    if (!response.ok) {
      console.warn(`Binance API error for ${crypto}: ${response.status}`)
      return null null
    }
    
    const data = await response.json()
    const priceInUSD = parseFloat(data.price)
    
    // Approximate DZD to USD conversion (should be updated dynamically)
    // ~135 DZD = 1 USD (as of early 2024)
    const usdToDZD = 135
    
    if (crypto === 'USDT' || crypto === 'USDC') {
      // Stablecoins are approximately $1
      return {
        dzdRate: usdToDZD,
        usdRate: 1,
      }
    }
    
    return {
      dzdRate: priceInUSD * usdToDZD,
      usdRate: priceInUSD,
    }
  } catch (error) {
    console.error('Error fetching from Binance:', error)
    return null
  }
}

/**
 * Get cached rate from memory or database
 */
function getCachedRate(crypto: SupportedCrypto): { rate: number; source: string } | null {
  // Check memory cache first
  const cached = memoryCache.get(crypto)
  
  if (cached && new Date() < cached.expiresAt) {
    return {
      rate: cached.rate,
      source: 'memory_cache',
    }
  }
  
  // Remove expired entry
  if (cached) {
    memoryCache.delete(crypto)
  }
  
  return null
}

/**
 * Set rate in memory cache
 */
function setCachedRate(crypto: SupportedCrypto, rate: number): void {
  const ttlMs = cryptoConfig.cacheTTL * 1000
  
  memoryCache.set(crypto, {
    rate,
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + ttlMs),
  })
}

/**
 * Get exchange rate for a specific cryptocurrency
 * Tries CoinGecko first, then falls back to Binance, then uses fallback values
 */
export async function getExchangeRate(
  crypto: SupportedCrypto,
  forceRefresh = false
): Promise<ExchangeRate> {
  // Check cache first (unless forcing refresh)
  if (!forceRefresh) {
    const cached = getCachedRate(crypto)
    if (cached) {
      return {
        cryptocurrency: crypto,
        rateToDZD: cached.rate,
        rateToUSD: cached.rate / 135, // Approximate reverse conversion
        source: cached.source,
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + cryptoConfig.cacheTTL * 1000),
      }
    }
  }
  
  // Try CoinGecko first
  let rates = await fetchFromCoinGecko(crypto)
  let source = 'coingecko'
  
  // Fall back to Binance if CoinGecko fails
  if (!rates || rates.dzdRate === 0) {
    rates = await fetchFromBinance(crypto)
    source = 'binance'
  }
  
  // Use fallback rates if all APIs fail
  if (!rates || rates.dzdRate === 0) {
    rates = getFallbackRates(crypto)
    source = 'fallback'
  }
  
  // Cache the result
  setCachedRate(crypto, rates.dzdRate)
  
  return {
    cryptocurrency: crypto,
    rateToDZD: rates.dzdRate,
    rateToUSD: rates.usdRate,
    source,
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + cryptoConfig.cacheTTL * 1000),
  }
}

/**
 * Get all supported crypto exchange rates at once
 */
export async function getAllExchangeRates(forceRefresh = false): Promise<Map<SupportedCrypto, ExchangeRate>> {
  const rates = new Map<SupportedCrypto, ExchangeRate>()
  
  // Fetch all rates concurrently
  const promises = cryptoConfig.supportedCryptos.map(async (crypto) => {
    const rate = await getExchangeRate(crypto, forceRefresh)
    rates.set(crypto, rate)
  })
  
  await Promise.all(promises)
  
  return rates
}

/**
 * Convert DZD amount to crypto amount
 */
export async function convertDZDtoCrypto(
  amountDZD: number,
  crypto: SupportedCrypto
): Promise<{
  cryptoAmount: number
  exchangeRate: number
  formattedAmount: string
}> {
  const rate = await getExchangeRate(crypto)
  const cryptoAmount = amountDZD / rate.rateToDZD
  const decimals = getDecimalsForCrypto(crypto)
  
  return {
    cryptoAmount: Math.round(cryptoAmount * Math.pow(10, decimals)) / Math.pow(10, decimals),
    exchangeRate: rate.rateToDZD,
    formattedAmount: formatCryptoAmount(cryptoAmount, decimals),
  }
}

/**
 * Convert crypto amount to DZD
 */
export async function convertCryptoToDZD(
  amountCrypto: number,
  crypto: SupportedCrypto
): Promise<{
  dzdAmount: number
  exchangeRate: number
}> {
  const rate = await getExchangeRate(crypto)
  const dzdAmount = amountCrypto * rate.rateToDZD
  
  return {
    dzdAmount: Math.round(dzdAmount * 100) / 100,
    exchangeRate: rate.rateToDZD,
  }
}

/**
 * Get decimal places for a cryptocurrency
 */
function getDecimalsForCrypto(crypto: SupportedCrypto): number {
  switch (crypto) {
    case 'BTC': return 8
    case 'ETH': return 18
    case 'USDT':
    case 'USDC': return 6
    default: return 8
  }
}

/**
 * Format crypto amount with appropriate decimal places
 */
export function formatCryptoAmount(amount: number, decimals?: number): string {
  const d = decimals ?? 6
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: Math.min(d, 4),
    maximumFractionDigits: d,
  })
}

/**
 * Fallback rates when APIs are unavailable
 * These should be updated regularly!
 */
function getFallbackRates(crypto: SupportedCrypto): { dzdRate: number; usdRate: number } {
  // Approximate rates as of early 2024
  // These should NEVER be used in production without updating
  const fallbackRates: Record<SupportedCrypto, { dzdRate: number; usdRate: number }> = {
    USDT: { dzdRate: 134.5, usdRate: 1.0 },     // ~134.5 DZD per USDT
    BTC: { dzdRate: 0.000000129, usdRate: 65000 }, // ~$65,000 per BTC
    ETH: { dzdRate: 0.00000278, usdRate: 3500 },   // ~$3,500 per ETH
    USDC: { dzdRate: 134.5, usdRate: 1.0 },       // ~134.5 DZD per USDC
  }
  
  console.warn(`Using fallback exchange rate for ${crypto}. Update these values!`)
  return fallbackRates[crypto]
}

/**
 * Validate that an exchange rate is within acceptable bounds
 * Prevents using corrupted/stale rates
 */
export function validateExchangeRate(rate: number, crypto: SupportedCrypto): boolean {
  // Define reasonable bounds for each crypto vs DZD
  const bounds: Record<SupportedCrypto, { min: number; max: number }> = {
    USDT: { min: 120, max: 150 },   // Stablecoin should be around 130-140 DZD
    BTC: { min: 0.00000005, max: 0.0000003 }, // Bitcoin varies wildly
    ETH: { min: 0.000001, max: 0.000005 },     // Ethereum varies
    USDC: { min: 120, max: 150 },   // Stablecoin should be around 130-140 DZD
  }
  
  const boundsForCrypto = bounds[crypto]
  return rate >= boundsForCrypto.min && rate <= boundsForCrypto.max
}

/**
 * Clear all cached rates (useful for testing or forced refresh)
 */
export function clearRateCache(): void {
  memoryCache.clear()
}

/**
 * Get rate cache statistics (for monitoring)
 */
export function getRateCacheStats(): {
  size: number
  entries: Array<{ crypto: string; age: number; isExpired: boolean }>
} {
  const now = Date.now()
  const entries = Array.from(memoryCache.entries()).map(([crypto, data]) => ({
    crypto,
    age: now - data.fetchedAt.getTime(),
    isExpired: now > data.expiresAt.getTime(),
  }))
  
  return {
    size: memoryCache.size,
    entries,
  }
}

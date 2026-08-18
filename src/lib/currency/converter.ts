// Currency Conversion Engine for AlgeriaTrade.dz
// Core conversion functions with support for all supported currencies

import {
  CurrencyCode,
  BASE_CURRENCY,
  conversionRules,
  isSupportedCurrency,
} from './config'
import { getExchangeRates, getCachedRates } from './rate-provider'
import { formatCurrency } from './formatter'

export interface ConversionResult {
  fromAmount: number
  fromCurrency: CurrencyCode
  toAmount: number
  toCurrency: CurrencyCode
  rate: number
  formattedFrom: string
  formattedTo: string
  timestamp: Date
}

export interface BatchConversionItem {
  amount: number
  from: CurrencyCode
  targets: CurrencyCode[]
}

export interface BatchConversionResult {
  original: { amount: number; currency: CurrencyCode }
  conversions: Record<CurrencyCode, { amount: number; rate: number; formatted: string }>
}

/**
 * Apply rounding based on configured mode
 */
function roundValue(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  
  switch (conversionRules.roundingMode) {
    case 'HALF_UP':
      return Math.ceil((value * factor - 0.5)) / factor
    case 'HALF_DOWN':
      return Math.floor((value * factor + 0.5)) / factor
    case 'CEILING':
      return Math.ceil(value * factor) / factor
    case 'FLOOR':
      return Math.floor(value * factor) / factor
    case 'HALF_EVEN':
    default:
      // Banker's rounding (round half to even)
      const rounded = Math.round(value * factor) / factor
      return rounded
  }
}

/**
 * Apply spread to exchange rate (small markup for cost coverage)
 */
export function calculateSpread(amount: number, rate: number): number {
  if (amount <= 0 || rate <= 0) return rate
  
  // Apply spread percentage (reduces the effective rate slightly)
  const spreadFactor = 1 - (conversionRules.spreadPercent / 100)
  return rate * spreadFactor
}

/**
 * Main currency conversion function
 * Converts amount from one currency to another using current exchange rates
 */
export async function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<ConversionResult> {
  const timestamp = new Date()
  
  // Same currency - no conversion needed
  if (from === to) {
    return {
      fromAmount: amount,
      fromCurrency: from,
      toAmount: amount,
      toCurrency: to,
      rate: 1,
      formattedFrom: formatCurrency(amount, from),
      formattedTo: formatCurrency(amount, to),
      timestamp,
    }
  }

  // Validate currencies
  if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) {
    throw new Error(`Unsupported currency: ${!isSupportedCurrency(from) ? from : to}`)
  }

  // Validate amount constraints
  if (amount < conversionRules.minConversionAmount && from === BASE_CURRENCY) {
    console.warn(`Amount ${amount} is below minimum conversion threshold of ${conversionRules.minConversionAmount}`)
  }
  
  if (amount > conversionRules.maxConversionAmount) {
    throw new Error(`Amount exceeds maximum conversion limit of ${conversionRules.maxConversionAmount}`)
  }

  try {
    // Get current exchange rates
    const rates = await getExchangeRates()
    
    // Convert via base currency (DZD)
    const fromRate = rates.get(from) || 1
    const toRate = rates.get(to) || 1
    
    // Calculate: amount in "from" -> DZD -> "to"
    let rate = toRate / fromRate
    rate = calculateSpread(amount, rate)
    
    const amountInBase = amount * fromRate
    const convertedAmount = roundValue(amountInBase / toRate)

    return {
      fromAmount: amount,
      fromCurrency: from,
      toAmount: convertedAmount,
      toCurrency: to,
      rate: roundValue(rate, 6),
      formattedFrom: formatCurrency(amount, from),
      formattedTo: formatCurrency(convertedAmount, to),
      timestamp,
    }
  } catch (error) {
    console.error('Currency conversion error:', error)
    throw new Error(`Failed to convert ${amount} ${from} to ${to}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Convert any amount to base currency (DZD)
 */
export async function convertToBase(
  amount: number,
  from: CurrencyCode
): Promise<number> {
  if (from === BASE_CURRENCY) return amount

  const result = await convert(amount, from, BASE_CURRENCY)
  return result.toAmount
}

/**
 * Convert from base currency (DZD) to target currency
 */
export async function convertFromBase(
  amount: number,
  to: CurrencyCode
): Promise<number> {
  if (to === BASE_CURRENCY) return amount

  const result = await convert(amount, BASE_CURRENCY, to)
  return result.toAmount
}

/**
 * Batch convert amounts to multiple target currencies
 */
export async function batchConvert(
  amount: number,
  from: CurrencyCode,
  targets: CurrencyCode[]
): Promise<BatchConversionResult> {
  const rates = await getExchangeRates()
  const fromRate = rates.get(from) || 1
  const amountInBase = amount * fromRate

  const conversions: Record<CurrencyCode, { amount: number; rate: number; formatted: string }> = {}

  for (const target of targets) {
    if (target === from) {
      conversions[target] = {
        amount: amount,
        rate: 1,
        formatted: formatCurrency(amount, target),
      }
      continue
    }

    const toRate = rates.get(target) || 1
    let rate = toRate / fromRate
    rate = calculateSpread(amount, rate)
    
    const convertedAmount = roundValue(amountInBase / toRate)

    conversions[target] = {
      amount: convertedAmount,
      rate: roundValue(rate, 6),
      formatted: formatCurrency(convertedAmount, target),
    }
  }

  return {
    original: { amount, currency: from },
    conversions,
  }
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  if (from === to) return 1

  const rates = await getExchangeRates()
  const fromRate = rates.get(from) || 1
  const toRate = rates.get(to) || 1

  return roundValue(toRate / fromRate, 6)
}

/**
 * Get all exchange rates relative to a base currency
 */
export async function getAllRates(base?: CurrencyCode): Promise<Map<CurrencyCode, number>> {
  const rates = await getExchangeRates()
  
  if (!base || base === BASE_CURRENCY) {
    return rates
  }

  // Convert all rates to different base
  const baseRate = rates.get(base) || 1
  const convertedRates = new Map<CurrencyCode, number>()

  for (const [currency, rate] of rates.entries()) {
    convertedRates.set(currency as CurrencyCode, roundValue(rate / baseRate, 6))
  }

  return convertedRates
}

/**
 * Reverse calculation - find source amount needed for target amount
 */
export async function reverseCalculate(
  targetAmount: number,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<{ sourceAmount: number; rate: number }> {
  if (from === to) {
    return { sourceAmount: targetAmount, rate: 1 }
  }

  const rates = await getExchangeRates()
  const fromRate = rates.get(from) || 1
  const toRate = rates.get(to) || 1
  
  // Reverse the conversion formula
  const rate = fromRate / toRate
  const sourceAmount = roundValue(targetAmount * toRate / fromRate)

  return { sourceAmount, rate: roundValue(rate, 6) }
}

/**
 * Quick sync conversion using cached rates (no API call)
 */
export function quickConvert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  cachedRates?: Map<string, number>
): number | null {
  if (from === to) return amount

  const rates = cachedRates || getCachedRates()
  if (!rates) return null

  const fromRate = rates.get(from) || 1
  const toRate = rates.get(to) || 1

  return roundValue((amount * fromRate) / toRate)
}

// Currency Formatter for AlgeriaTrade.dz
// Internationalization-aware currency formatting

import {
  CurrencyCode,
  supportedCurrencies,
  isSupportedCurrency,
  getCurrencyConfig,
} from './config'

export interface FormatOptions {
  locale?: string
  compact?: boolean // Short format (€1.2K)
  showCode?: boolean // Show ISO code (100.00 EUR)
  hideSymbol?: boolean // Hide symbol, show only number
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export interface ParsedCurrency {
  amount: number
  currency: CurrencyCode
  original: string
}

/**
 * Main currency formatting function
 * Formats a number according to currency-specific conventions
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  options: FormatOptions = {}
): string {
  const config = getCurrencyConfig(currency)
  
  if (!config) {
    return `${formatNumber(amount)} ${currency}`
  }

  const {
    compact = false,
    showCode = false,
    hideSymbol = false,
    minimumFractionDigits,
    maximumFractionDigits,
    locale: overrideLocale,
  } = options

  const decimals = config.decimalDigits

  // Use Intl.NumberFormat for proper localization
  let formatted: string
  
  if (compact) {
    // Compact notation (1.2K, 1M, etc.)
    formatted = new Intl.NumberFormat(overrideLocale || config.locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(amount)
  } else {
    formatted = new Intl.NumberFormat(overrideLocale || config.locale, {
      minimumFractionDigits: minimumFractionDigits ?? decimals,
      maximumFractionDigits: maximumFractionDigits ?? (compact ? 0 : decimals),
    }).format(amount)
  }

  // Apply custom separators if needed (for currencies with non-standard formats)
  if (!overrideLocale) {
    formatted = applyCustomSeparators(formatted, config)
  }

  if (hideSymbol) {
    let result = formatted
    if (showCode && currency !== 'DZD') {
      result += ` ${currency}`
    }
    return result
  }

  // Add currency symbol in correct position
  const symbol = config.symbol
  let result: string

  if (config.symbolPosition === 'before') {
    result = `${symbol}${formatted}`
  } else {
    result = `${formatted}${symbol}`
  }

  // Optionally add ISO code
  if (showCode && currency !== 'DZD') {
    result += ` (${currency})`
  }

  return result
}

/**
 * Compact format for large amounts (e.g., €1.2K)
 */
export function formatCompact(
  amount: number,
  currency: CurrencyCode
): string {
  return formatCurrency(currency, { compact: true })
}

/**
 * Format with ISO code always visible
 */
export function formatWithCode(
  amount: number,
  currency: CurrencyCode
): string {
  return formatCurrency(amount, currency, { showCode: true })
}

/**
 * Format price range (min - max)
 */
export function formatRange(
  min: number,
  max: number,
  currency: CurrencyCode,
  options?: FormatOptions
): string {
  if (min === max) {
    return formatCurrency(min, currency, options)
  }

  return `${formatCurrency(min, currency, options)} – ${formatCurrency(max, currency, options)}`
}

/**
 * Format price difference/change
 */
export function formatDifference(
  oldAmount: number,
  newAmount: number,
  currency: CurrencyCode,
  options?: FormatOptions & { showPercent?: boolean }
): string {
  const diff = newAmount - oldAmount
  const sign = diff >= 0 ? '+' : ''
  const diffFormatted = formatCurrency(Math.abs(diff), currency, { ...options, hideSymbol: true })
  const symbol = getCurrencyConfig(currency)?.symbol || ''
  
  let result = `${sign}${diffFormatted}${symbol}`

  if (options?.showPercent && oldAmount !== 0) {
    const percentChange = ((diff / oldAmount) * 100).toFixed(2)
    result += ` (${sign}${percentChange}%)`
  }

  return result
}

/**
 * Parse a formatted currency string back to a number
 */
export function parseFormatted(
  formattedString: string,
  currency: CurrencyCode
): ParsedCurrency | null {
  const config = getCurrencyConfig(currency)
  
  if (!config) {
    return null
  }

  try {
    // Remove symbol and extra whitespace
    let cleaned = formattedString.trim()
    
    // Remove symbol based on position
    if (config.symbolPosition === 'before' && cleaned.startsWith(config.symbol)) {
      cleaned = cleaned.slice(config.symbol.length).trim()
    } else if (config.symbolPosition === 'after' && cleaned.endsWith(config.symbol)) {
      cleaned = cleaned.slice(0, -config.symbol.length).trim()
    }

    // Remove thousands separator and replace decimal separator
    cleaned = cleaned
      .split(config.thousandsSeparator)
      .join('')
      .replace(config.decimalSeparator, '.')

    // Remove any remaining non-numeric characters except minus, decimal point
    cleaned = cleaned.replace(/[^\d.\-]/g, '')

    const amount = parseFloat(cleaned)

    if (isNaN(amount)) {
      return null
    }

    return {
      amount,
      currency,
      original: formattedString,
    }
  } catch (error) {
    console.error('Error parsing formatted currency:', error)
    return null
  }
}

/**
 * Get Intl.NumberFormat instance configured for a specific currency
 */
export function getLocaleFormatter(
  currency: CurrencyCode,
  locale?: string,
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const config = getCurrencyConfig(currency)
  
  if (!config) {
    return new Intl.NumberFormat(locale || 'en-US', options)
  }

  return new Intl.NumberFormat(locale || config.locale, {
    minimumFractionDigits: config.decimalDigits,
    maximumFractionDigits: config.decimalDigits,
    ...options,
  })
}

/**
 * Format a plain number using locale conventions
 */
function formatNumber(amount: number, locale?: string): string {
  return new Intl.NumberFormat(locale || 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Apply custom separators for currencies that don't follow standard locale formats
 */
function applyCustomSeparators(formatted: string, config: ReturnType<typeof getCurrencyConfig>): string {
  if (!config) return formatted

  // For most cases, Intl.NumberFormat handles this correctly
  // This is mainly for edge cases or specific requirements
  
  // DZD uses space as thousands separator and comma as decimal
  if (config.code === 'DZD') {
    // Ensure proper formatting for Arabic context
    const parts = formatted.split(',')
    if (parts.length === 2) {
      return `${parts[0].replace(/\./g, ' ')},${parts[1]}`
    }
  }

  // CHF uses apostrophe as thousands separator
  if (config.code === 'CHF') {
    return formatted.replace(/'/g, "'").replace(/\./g, "'")
  }

  return formatted
}

/**
 * Get localized currency name
 */
export function getLocalizedName(
  currency: CurrencyCode,
  language: 'en' | 'fr' | 'ar' = 'en'
): string {
  const config = getCurrencyConfig(currency)
  
  if (!config) return currency

  switch (language) {
    case 'ar':
      return config.nameAr
    case 'fr':
      return config.nameFr
    default:
      return config.name
  }
}

/**
 * Check if currency should be displayed RTL (Arabic currencies)
 */
export function isRTLCurrency(currency: CurrencyCode): boolean {
  const rtlCurrencies: CurrencyCode[] = ['DZD', 'TND', 'MAD']
  return rtlCurrencies.includes(currency)
}

/**
 * Get display direction class for currency
 */
export function getCurrencyDirection(currency: CurrencyCode): 'rtl' | 'ltr' {
  return isRTLCurrency(currency) ? 'rtl' : 'ltr'
}

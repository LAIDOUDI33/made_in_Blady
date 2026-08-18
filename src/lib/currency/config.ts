// Currency Configuration for AlgeriaTrade.dz Multi-Currency Support
// Supports: DZD, EUR, USD, GBP, CHF, CAD, TND, MAD

export type CurrencyCode = 'DZD' | 'EUR' | 'USD' | 'GBP' | 'CHF' | 'CAD' | 'TND' | 'MAD'

export interface CurrencyConfig {
  code: CurrencyCode
  name: string
  nameAr: string
  nameFr: string
  symbol: string
  symbolPosition: 'before' | 'after'
  decimalDigits: number
  thousandsSeparator: string
  decimalSeparator: string
  locale: string
  flag: string
  isDefault?: boolean
}

export interface ExchangeRateConfig {
  provider: 'fixer' | 'openexchangerates' | 'ecb' | 'custom'
  cacheTTL: number // seconds
  refreshInterval: number // milliseconds
  fallbackProviders: string[]
  autoRefresh: boolean
}

export interface ConversionRuleConfig {
  roundingMode: 'HALF_UP' | 'HALF_DOWN' | 'HALF_EVEN' | 'CEILING' | 'FLOOR'
  spreadPercent: number
  minConversionAmount: number
  maxConversionAmount: number
}

export interface RegionalDefault {
  currency: CurrencyCode
  language: string
}

// Base currency (accounting currency)
export const BASE_CURRENCY: CurrencyCode = 'DZD'

// Supported currencies configuration
export const supportedCurrencies: Record<CurrencyCode, CurrencyConfig> = {
  DZD: {
    code: 'DZD',
    name: 'Algerian Dinar',
    nameAr: 'دينار جزائري',
    nameFr: 'Dinar Algérien',
    symbol: 'د.ج',
    symbolPosition: 'after', // 100 د.ج
    decimalDigits: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    locale: 'dz-DZ',
    flag: '🇩🇿',
    isDefault: true,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    nameAr: 'يورو',
    nameFr: 'Euro',
    symbol: '€',
    symbolPosition: 'before', // €100
    decimalDigits: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    locale: 'fr-FR',
    flag: '🇪🇺',
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    nameAr: 'دولار أمريكي',
    nameFr: 'Dollar Américain',
    symbol: '$',
    symbolPosition: 'before', // $100
    decimalDigits: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    locale: 'en-US',
    flag: '🇺🇸',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    nameAr: 'جنيه إسترليني',
    nameFr: 'Livre Sterling',
    symbol: '£',
    symbolPosition: 'before',
    decimalDigits: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    locale: 'en-GB',
    flag: '🇬🇧',
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    nameAr: 'فرنك سويسري',
    nameFr: 'Franc Suisse',
    symbol: 'CHF',
    symbolPosition: 'after', // 100 CHF
    decimalDigits: 2,
    thousandsSeparator: "'",
    decimalSeparator: '.',
    locale: 'de-CH',
    flag: '🇨🇭',
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    nameAr: 'دولار كندي',
    nameFr: 'Dollar Canadien',
    symbol: 'CA$',
    symbolPosition: 'before',
    decimalDigits: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    locale: 'en-CA',
    flag: '🇨🇦',
  },
  TND: {
    code: 'TND',
    name: 'Tunisian Dinar',
    nameAr: 'دينار تونسي',
    nameFr: 'Dinar Tunisien',
    symbol: 'د.ت',
    symbolPosition: 'after',
    decimalDigits: 3,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    locale: 'tn-TN',
    flag: '🇹🇳',
  },
  MAD: {
    code: 'MAD',
    name: 'Moroccan Dirham',
    nameAr: 'درهم مغربي',
    nameFr: 'Dirham Marocain',
    symbol: 'د.م.',
    symbolPosition: 'after',
    decimalDigits: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    locale: 'ma-MA',
    flag: '🇲🇦',
  },
}

// Exchange rate settings
export const exchangeRateConfig: ExchangeRateConfig = {
  provider: 'fixer',
  cacheTTL: 300, // 5 minutes
  refreshInterval: 3600000, // 1 hour
  fallbackProviders: ['ecb', 'custom'],
  autoRefresh: true,
}

// Conversion rules
export const conversionRules: ConversionRuleConfig = {
  roundingMode: 'HALF_EVEN', // Banker's rounding
  spreadPercent: 0.5, // Small spread to cover costs
  minConversionAmount: 100, // Minimum DZD for conversion
  maxConversionAmount: 100000000, // Maximum per transaction
}

// Display preferences by region
export const regionalDefaults: Record<string, RegionalDefault> = {
  DZ: { currency: 'DZD', language: 'ar' },
  FR: { currency: 'EUR', language: 'fr' },
  EU: { currency: 'EUR', language: 'en' },
  US: { currency: 'USD', language: 'en' },
  UK: { currency: 'GBP', language: 'en' },
  MA: { currency: 'MAD', language: 'ar' },
  TN: { currency: 'TND', language: 'ar' },
  CH: { currency: 'CHF', language: 'de' },
  CA: { currency: 'CAD', language: 'en' },
}

// Get all currency codes
export function getCurrencyCodes(): CurrencyCode[] {
  return Object.keys(supportedCurrencies) as CurrencyCode[]
}

// Get currency config by code
export function getCurrencyConfig(code: CurrencyCode): CurrencyConfig | undefined {
  return supportedCurrencies[code]
}

// Get default currency
export function getDefaultCurrency(): CurrencyCode {
  return BASE_CURRENCY
}

// Check if currency is supported
export function isSupportedCurrency(code: string): code is CurrencyCode {
  return code in supportedCurrencies
}

// Get currencies sorted by priority (default first, then major currencies)
export function getSortedCurrencies(): CurrencyConfig[] {
  const order: CurrencyCode[] = ['DZD', 'EUR', 'USD', 'GBP', 'CHF', 'CAD', 'TND', 'MAD']
  return order.map(code => supportedCurrencies[code]).filter(Boolean)
}

// Get regional default based on country code
export function getRegionalCurrency(countryCode: string): CurrencyCode {
  const region = regionalDefaults[countryCode.toUpperCase()]
  return region?.currency || BASE_CURRENCY
}

// Currency Detection Middleware
// Auto-detects user's preferred currency from IP, headers, or cookies

import { NextRequest, NextResponse } from 'next/server'
import { CurrencyCode, isSupportedCurrency, regionalDefaults, BASE_CURRENCY } from '@/lib/currency/config'

// Country code to currency mapping (for IP-based detection)
const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  DZ: 'DZD', // Algeria
  FR: 'EUR', // France
  DE: 'EUR', // Germany
  IT: 'EUR', // Italy
  ES: 'EUR', // Spain
  NL: 'EUR', // Netherlands
  BE: 'EUR', // Belgium
  AT: 'EUR', // Austria
  PT: 'EUR', // Portugal
  GR: 'EUR', // Greece
  FI: 'EUR', // Finland
  IE: 'EUR', // Ireland
  LU: 'EUR', // Luxembourg
  CY: 'EUR', // Cyprus
  MT: 'EUR', // Malta
  SK: 'EUR', // Slovakia
  SI: 'EUR', // Slovenia
  EE: 'EUR', // Estonia
  LV: 'EUR', // Latvia
  LT: 'EUR', // Lithuania
  US: 'USD', // United States
  GB: 'GBP', // United Kingdom
  CH: 'CHF', // Switzerland
  CA: 'CAD', // Canada
  MA: 'MAD', // Morocco
  TN: 'TND', // Tunisia
}

// Accept-Language header patterns to currency mapping
const LANGUAGE_CURRENCY_PATTERNS: Array<{ pattern: RegExp; currency: CurrencyCode }> = [
  { pattern: /\b(ar-DZ|dz)\b/i, currency: 'DZD' },
  { pattern: /\b(fr-DZ)\b/i, currency: 'DZD' },
  { pattern: /\b(en-US)\b/i, currency: 'USD' },
  { pattern: /\b(en-GB)\b/i, currency: 'GBP' },
  { pattern: /\b(fr-FR|fr-BE|fr-CH|fr-LU|fr-MC)\b/i, currency: 'EUR' },
  { pattern: /\b(de-DE|de-AT|de-LU|de-BE)\b/i, currency: 'EUR' },
  { pattern: /\b(it-IT|it-SM)\b/i, currency: 'EUR' },
  { pattern: /\b(es-ES|es-AD)\b/i, currency: 'EUR' },
  { pattern: /\b(nl-NL|nl-BE)\b/i, currency: 'EUR' },
  { pattern: /\b(pt-PT)\b/i, currency: 'EUR' },
  { pattern: /\b(en-CA)\b/i, currency: 'CAD' },
  { pattern: /\b(fr-CA)\b/i, currency: 'CAD' },
  { pattern: /\b(de-CH|it-CH|fr-CH)\b/i, currency: 'CHF' },
  { pattern: /\b(ar-MA|fr-MA)\b/i, currency: 'MAD' },
  { pattern: /\b(ar-TN|fr-TN)\b/i, currency: 'TND' },
]

export interface CurrencyDetectionResult {
  currency: CurrencyCode
  method: 'cookie' | 'header' | 'ip' | 'default'
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Detect user's preferred currency from request
 */
export function detectCurrency(request: NextRequest): CurrencyDetectionResult {
  // 1. Check cookie first (highest priority - explicit user choice)
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookieMatch = cookieHeader.match(/preferred_currency=([^;]+)/)
    if (cookieMatch && isSupportedCurrency(cookieMatch[1])) {
      return {
        currency: cookieMatch[1] as CurrencyCode,
        method: 'cookie',
        confidence: 'high',
      }
    }
  }

  // 2. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || ''
  for (const { pattern, currency } of LANGUAGE_CURRENCY_PATTERNS) {
    if (pattern.test(acceptLanguage)) {
      return {
        currency,
        method: 'header',
        confidence: 'medium',
      }
    }
  }

  // 3. Check country from Cloudflare/CDN headers or custom header
  const cfCountry = request.headers.get('cf-ipcountry')
  const xCountry = request.headers.get('x-country-code')
  const countryCode = (cfCountry || xCountry || '').toUpperCase()

  if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
    const detectedCurrency = COUNTRY_CURRENCY_MAP[countryCode]
    if (isSupportedCurrency(detectedCurrency)) {
      return {
        currency: detectedCurrency,
        method: 'ip',
        confidence: 'medium',
      }
    }
  }

  // 4. Default to base currency
  return {
    currency: BASE_CURRENCY,
    method: 'default',
    confidence: 'low',
  }
}

/**
 * Middleware function to add currency detection to requests
 * Can be used in Next.js middleware or as a helper
 */
export function addCurrencyHeaders(
  response: NextResponse,
  detection: CurrencyDetectionResult
): NextResponse {
  // Add detected currency to response headers for client-side use
  response.headers.set('x-detected-currency', detection.currency)
  response.headers.set('x-currency-detection-method', detection.method)

  return response
}

/**
 * Create a response with currency cookie set
 */
export function setCurrencyCookie(
  response: NextResponse,
  currency: CurrencyCode
): NextResponse {
  response.cookies.set('preferred_currency', currency, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })

  return response
}

/**
 * Get client-side currency detection info
 * Returns data that can be used by client components
 */
export function getClientCurrencyInfo(request: NextRequest): {
  detectedCurrency: CurrencyCode
  availableCurrencies: Array<{
    code: CurrencyCode
    name: string
    flag: string
  }>
} {
  const detection = detectCurrency(request)
  
  // Get list of available currencies from regional defaults
  const availableCurrencies = Object.entries(regionalDefaults).map(([region, config]) => ({
    code: config.currency,
    name: region,
    flag: getFlagForRegion(region),
  }))

  return {
    detectedCurrency: detection.currency,
    availableCurrencies,
  }
}

function getFlagForRegion(region: string): string {
  const flags: Record<string, string> = {
    DZ: '🇩🇿',
    FR: '🇫🇷',
    EU: '🇪🇺',
    US: '🇺🇸',
    UK: '🇬🇧',
    MA: '🇲🇦',
    TN: '🇹🇳',
    CH: '🇨🇭',
    CA: '🇨🇦',
  }
  return flags[region] || '🌍'
}

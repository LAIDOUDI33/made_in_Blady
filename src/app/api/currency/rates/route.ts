// GET /api/currency/rates - Get all exchange rates
// POST /api/currency/rates - Force refresh rates (admin)

import { NextRequest, NextResponse } from 'next/server'
import {
  getExchangeRates,
  invalidateCache,
  healthCheck,
  getCurrentRateSource,
} from '@/lib/currency/rate-provider'
import {
  getSortedCurrencies,
  getCurrencyCodes,
  CurrencyCode,
  isSupportedCurrency,
} from '@/lib/currency/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const baseParam = searchParams.get('base') as CurrencyCode | null
    const currenciesParam = searchParams.get('currencies') // Comma-separated list

    let rates = await getExchangeRates()
    
    // If a different base currency is requested, convert rates
    if (baseParam && baseParam !== 'DZD' && isSupportedCurrency(baseParam)) {
      const baseRate = rates.get(baseParam)
      if (baseRate) {
        const convertedRates = new Map<CurrencyCode, number>()
        for (const [code, rate] of rates.entries()) {
          convertedRates.set(code as CurrencyCode, Number((rate / baseRate).toFixed(6)))
        }
        rates = convertedRates
      }
    }

    // Filter currencies if specified
    let currencyList = getSortedCurrencies()
    if (currenciesParam) {
      const requestedCurrencies = currenciesParam.split(',').map(c => c.trim().toUpperCase())
      currencyList = currencyList.filter(c => requestedCurrencies.includes(c.code))
    }

    // Get rate source info
    const sourceInfo = getCurrentRateSource()

    return NextResponse.json({
      success: true,
      data: {
        baseCurrency: baseParam || 'DZD',
        rates: Object.fromEntries(rates),
        currencies: currencyList.map(c => ({
          code: c.code,
          name: c.name,
          nameAr: c.nameAr,
          nameFr: c.nameFr,
          symbol: c.symbol,
          flag: c.flag,
          locale: c.locale,
          decimalDigits: c.decimalDigits,
          rate: rates.get(c.code) || 1,
        })),
        source: sourceInfo.source,
        lastUpdated: sourceInfo.fetchedAt?.toISOString() || null,
        validUntil: sourceInfo.validUntil?.toISOString() || null,
        cacheTTLMinutes: 5,
      },
    })
  } catch (error) {
    console.error('Error fetching currency rates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch exchange rates' 
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // Force refresh rates
    invalidateCache()
    const rates = await getExchangeRates()
    const currencies = getSortedCurrencies()
    
    return NextResponse.json({
      success: true,
      data: {
        baseCurrency: 'DZD',
        rates: Object.fromEntries(rates),
        message: 'Exchange rates refreshed successfully',
        refreshedAt: new Date().toISOString(),
        currencyCount: rates.size,
      },
    })
  } catch (error) {
    console.error('Error refreshing currency rates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to refresh exchange rates' 
      },
      { status: 500 }
    )
  }
}

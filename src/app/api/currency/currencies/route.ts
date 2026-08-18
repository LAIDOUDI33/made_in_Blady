// GET /api/currency/currencies - List supported currencies with configuration

import { NextResponse } from 'next/server'
import {
  getSortedCurrencies,
  getCurrencyCodes,
  getCurrencyConfig,
  regionalDefaults,
  BASE_CURRENCY,
  CurrencyCode,
} from '@/lib/currency/config'

export async function GET() {
  try {
    const currencies = getSortedCurrencies()
    const codes = getCurrencyCodes()

    return NextResponse.json({
      success: true,
      data: {
        baseCurrency: BASE_CURRENCY,
        totalCurrencies: codes.length,
        currencies: currencies.map(c => ({
          code: c.code,
          name: c.name,
          nameAr: c.nameAr,
          nameFr: c.nameFr,
          symbol: c.symbol,
          symbolPosition: c.symbolPosition,
          decimalDigits: c.decimalDigits,
          thousandsSeparator: c.thousandsSeparator,
          decimalSeparator: c.decimalSeparator,
          locale: c.locale,
          flag: c.flag,
          isDefault: c.isDefault || false,
        })),
        regionalDefaults: Object.entries(regionalDefaults).map(([region, config]) => ({
          region,
          currency: config.currency,
          language: config.language,
        })),
        supportedCodes: codes,
      },
    })
  } catch (error) {
    console.error('Error fetching currencies:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch currency list' 
      },
      { status: 500 }
    )
  }
}

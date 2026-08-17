// GET /api/currency/rates - Get all exchange rates
// POST /api/currency/rates - Force refresh rates (admin)

import { NextRequest, NextResponse } from 'next/server'
import {
  getExchangeRates,
  updateRates,
  getSupportedCurrencies,
  SupportedCurrency,
} from '@/lib/currency'

export async function GET() {
  try {
    const rates = await getExchangeRates()
    const currencies = getSupportedCurrencies()

    return NextResponse.json({
      success: true,
      data: {
        baseCurrency: 'DZD',
        rates: Object.fromEntries(rates),
        currencies: currencies.map(c => ({
          code: c.code,
          name: c.name,
          nameLocalized: c.nameLocalized,
          symbol: c.symbol,
          flagEmoji: c.flagEmoji,
          rate: rates.get(c.code) || 1,
        })),
        lastUpdated: new Date().toISOString(),
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
    const rates = await updateRates()
    
    return NextResponse.json({
      success: true,
      data: {
        baseCurrency: 'DZD',
        rates: Object.fromEntries(rates),
        message: 'Exchange rates refreshed successfully',
        refreshedAt: new Date().toISOString(),
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

// GET /api/payments/crypto/rates - Get current crypto exchange rates

import { NextResponse } from 'next/server'
import { getAllCryptoRates, CRYPTO_INFO, CryptoCurrency } from '@/lib/payments/crypto'

// Cache for rates (in-memory, 30 second TTL)
let cachedRates: Record<CryptoCurrency, number> | null = null
let lastFetchTime = 0
const CACHE_TTL_MS = 30000 // 30 seconds

export async function GET() {
  try {
    const now = Date.now()
    
    // Return cached rates if still valid
    if (cachedRates && (now - lastFetchTime) < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        data: {
          rates: cachedRates,
          baseCurrency: 'DZD',
          cached: true,
          fetchedAt: new Date(lastFetchTime).toISOString(),
        },
      })
    }

    // Fetch fresh rates
    const rates = await getAllCryptoRates()
    
    // Update cache
    cachedRates = rates
    lastFetchTime = now

    return NextResponse.json({
      success: true,
      data: {
        rates,
        baseCurrency: 'DZD',
        cached: false,
        fetchedAt: new Date().toISOString(),
        currencies: Object.entries(CRYPTO_INFO).map(([code, info]) => ({
          code: code as CryptoCurrency,
          ...info,
          rate: rates[code as CryptoCurrency],
          // Calculate example: 1000 DZD in this crypto
          exampleConversion: {
            fromAmount: 1000,
            toAmount: Math.round((1000 / rates[code as CryptoCurrency]) * 100000000) / 100000000,
            unit: info.symbol,
          },
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching crypto rates:', error)
    
    // Return cached rates even if expired, if available
    if (cachedRates) {
      return NextResponse.json({
        success: true,
        data: {
          rates: cachedRates,
          baseCurrency: 'DZD',
          cached: true,
          stale: true,
          warning: 'Using stale exchange rates. Real-time rates unavailable.',
          fetchedAt: new Date(lastFetchTime).toISOString(),
        },
      })
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch exchange rates' 
      },
      { status: 500 }
    )
  }
}

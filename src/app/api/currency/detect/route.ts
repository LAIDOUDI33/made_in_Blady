// GET /api/currency/detect - Detect user's preferred currency

import { NextRequest, NextResponse } from 'next/server'
import { detectUserCurrency, getCurrencyInfo, CURRENCIES, SupportedCurrency } from '@/lib/currency'

export async function GET(request: NextRequest) {
  try {
    // Detect user's preferred currency
    const detectedCurrency = detectUserCurrency(request)
    const currencyInfo = getCurrencyInfo(detectedCurrency)

    return NextResponse.json({
      success: true,
      data: {
        detected: detectedCurrency,
        info: currencyInfo,
        allCurrencies: Object.values(CURRENCIES).map(c => ({
          code: c.code,
          name: c.name,
          nameLocalized: c.nameLocalized,
          symbol: c.symbol,
          flagEmoji: c.flagEmoji,
        })),
        detectionMethod: 'accept-language-header',
      },
    })
  } catch (error) {
    console.error('Error detecting currency:', error)
    
    // Return default (DZD) on error
    return NextResponse.json({
      success: true,
      data: {
        detected: 'DZD',
        info: CURRENCIES.DZD,
        warning: 'Detection failed, using default currency',
      },
    })
  }
}

// POST to set user's preferred currency (sets cookie)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currency } = body

    if (!currency || !(currency in CURRENCIES)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid currency. Supported: ${Object.keys(CURRENCIES).join(', ')}` 
        },
        { status: 400 }
      )
    }

    const response = NextResponse.json({
      success: true,
      data: {
        preferredCurrency: currency,
        info: CURRENCIES[currency as SupportedCurrency],
        message: `Preferred currency set to ${CURRENCIES[currency as SupportedCurrency].name}`,
      },
    })

    // Set cookie for future requests
    response.cookies.set('preferred_currency', currency, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error setting preferred currency:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to set preferred currency' 
      },
      { status: 500 }
    )
  }
}

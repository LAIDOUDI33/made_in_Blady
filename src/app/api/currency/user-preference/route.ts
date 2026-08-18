// GET /api/currency/user-preference - Get user's preferred currency
// PUT /api/currency/user-preference - Set user's preferred currency

import { NextRequest, NextResponse } from 'next/server'
import { isSupportedCurrency, CurrencyCode, BASE_CURRENCY } from '@/lib/currency/config'
import { detectUserCurrency } from '@/lib/currency' // Using existing detection

// GET - Retrieve user's currency preference
export async function GET(request: NextRequest) {
  try {
    // Check cookie first
    const cookieHeader = request.headers.get('cookie')
    let preferredCurrency: string | null = null
    
    if (cookieHeader) {
      const match = cookieHeader.match(/preferred_currency=([^;]+)/)
      if (match) {
        preferredCurrency = match[1]
      }
    }

    // If no cookie, detect from request
    if (!preferredCurrency || !isSupportedCurrency(preferredCurrency)) {
      preferredCurrency = detectUserCurrency(request)
    }

    return NextResponse.json({
      success: true,
      data: {
        preferredCurrency,
        method: cookieHeader?.includes('preferred_currency') ? 'cookie' : 'detected',
        baseCurrency: BASE_CURRENCY,
      },
    })
  } catch (error) {
    console.error('Error getting user preference:', error)
    
    // Return default on error
    return NextResponse.json({
      success: true,
      data: {
        preferredCurrency: BASE_CURRENCY,
        method: 'default',
        baseCurrency: BASE_CURRENCY,
        warning: 'Detection failed, using default',
      },
    })
  }
}

// SET - Save user's currency preference
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { currency, autoDetect } = body

    if (!currency || !isSupportedCurrency(currency)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid currency. Supported currencies available at /api/currency/currencies` 
        },
        { status: 400 }
      )
    }

    // Create response with preference
    const response = NextResponse.json({
      success: true,
      data: {
        preferredCurrency: currency as CurrencyCode,
        autoDetect: autoDetect !== false, // Default to true
        message: `Preferred currency set to ${currency}`,
        savedAt: new Date().toISOString(),
      },
    })

    // Set cookie for persistence
    response.cookies.set('preferred_currency', currency, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error setting user preference:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save currency preference' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Clear user's currency preference (reset to auto-detect)
export async function DELETE() {
  try {
    const response = NextResponse.json({
      success: true,
      data: {
        message: 'Currency preference cleared, will use auto-detection',
        clearedAt: new Date().toISOString(),
      },
    })

    // Remove cookie
    response.cookies.set('preferred_currency', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error clearing user preference:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear currency preference' 
      },
      { status: 500 }
    )
  }
}

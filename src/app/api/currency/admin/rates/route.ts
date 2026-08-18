// GET /api/currency/admin/rates - Admin: View/manage exchange rates
// PUT /api/currency/admin/rates - Admin: Override/set manual rates

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getExchangeRates,
  cacheRates,
  invalidateCache,
  healthCheck,
} from '@/lib/currency/rate-provider'
import {
  isSupportedCurrency,
  getCurrencyCodes,
  CurrencyCode,
} from '@/lib/currency/config'

// GET - Get admin view of rates (including source info and health)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeHealth = searchParams.get('health') === 'true'
    const includeDb = searchParams.get('db') === 'true'

    // Get current rates
    const rates = await getExchangeRates()
    
    let rateSourceInfo = null
    let dbRates = null
    let providerHealth = null

    if (includeHealth) {
      const { getCurrentRateSource } = await import('@/lib/currency/rate-provider')
      rateSourceInfo = getCurrentRateSource()
      providerHealth = await healthCheck()
    }

    if (includeDb) {
      try {
        dbRates = await db.exchangeRate.findMany({
          orderBy: { fetchedAt: 'desc' },
          take: 100,
        })
      } catch (error) {
        console.error('Error fetching DB rates:', error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        currentRates: Object.fromEntries(rates),
        supportedCurrencies: getCurrencyCodes(),
        ...(rateSourceInfo && { rateSource: rateSourceInfo }),
        ...(providerHealth && { providerHealth }),
        ...(dbRates && { databaseRates: dbRates.map(r => ({
          id: r.id,
          fromCurrency: r.fromCurrency,
          toCurrency: r.toCurrency,
          rate: Number(r.rate),
          source: r.source,
          fetchedAt: r.fetchedAt,
          validUntil: r.validUntil,
        })) }),
      },
    })
  } catch (error) {
    console.error('Error fetching admin rates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch admin rate data' 
      },
      { status: 500 }
    )
  }
}

// PUT - Set/override manual rates (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { rates, source, validForHours } = body

    // Validate input
    if (!rates || typeof rates !== 'object' || Array.isArray(rates)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'rates must be an object with currency codes as keys' 
        },
        { status: 400 }
      )
    }

    // Validate each currency and rate
    const validatedRates: Record<string, number> = {}
    for (const [currency, rate] of Object.entries(rates)) {
      if (!isSupportedCurrency(currency)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Unsupported currency: ${currency}` 
          },
          { status: 400 }
        )
      }

      const numericRate = Number(rate)
      if (isNaN(numericRate) || numericRate <= 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid rate for ${currency}: must be a positive number` 
          },
          { status: 400 }
        )
      }

      validatedRates[currency] = numericRate
    }

    // Calculate validity period
    const validHours = validForHours || 24
    const validUntil = new Date()
    validUntil.setHours(validUntil.getHours() + validHours)

    const rateSource = source || 'manual'

    // Save to database
    const savedRates = []
    for (const [currency, rate] of Object.entries(validatedRates)) {
      try {
        const saved = await db.exchangeRate.upsert({
          where: {
            fromCurrency_toCurrency: {
              fromCurrency: 'DZD',
              toCurrency: currency,
            },
          },
          update: {
            rate: rate.toString(),
            source: rateSource,
            fetchedAt: new Date(),
            validUntil,
          },
          create: {
            fromCurrency: 'DZD',
            toCurrency: currency,
            rate: rate.toString(),
            source: rateSource,
            validUntil,
          },
        })
        savedRates.push(saved)
      } catch (error) {
        console.error(`Error saving rate for ${currency}:`, error)
      }
    }

    // Update in-memory cache
    const rateMap = new Map<CurrencyCode, number>()
    rateMap.set('DZD', 1)
    for (const [currency, rate] of Object.entries(validatedRates)) {
      rateMap.set(currency as CurrencyCode, rate)
    }
    cacheRates(rateMap, rateSource)

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully updated ${savedRates.length} exchange rates`,
        savedCount: savedRates.length,
        rates: validatedRates,
        source: rateSource,
        validUntil: validUntil.toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error setting admin rates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update exchange rates' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Clear manual/admin rates (revert to automatic)
export async function DELETE() {
  try {
    // Delete all manual rates from database
    const deleted = await db.exchangeRate.deleteMany({
      where: {
        source: 'manual',
      },
    })

    // Invalidate cache to force refresh from API
    invalidateCache()

    return NextResponse.json({
      success: true,
      data: {
        message: `Deleted ${deleted.count} manual rates, reverting to automatic`,
        deletedCount: deleted.count,
        clearedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error clearing admin rates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear manual rates' 
      },
      { status: 500 }
    )
  }
}

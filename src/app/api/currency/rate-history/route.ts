// GET /api/currency/rate-history - Get historical exchange rates

import { NextRequest, NextResponse } from 'next/server'
import { CurrencyCode, isSupportedCurrency } from '@/lib/currency/config'

interface HistoricalRate {
  date: string
  rate: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const from = searchParams.get('from') as CurrencyCode | null || 'DZD'
    const to = searchParams.get('to') as CurrencyCode | null || 'EUR'
    const days = parseInt(searchParams.get('days') || '30', 10)
    const format = searchParams.get('format') || 'json' // json or chart

    // Validate currencies
    if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid currency. Supported currencies available at /api/currency/currencies` 
        },
        { status: 400 }
      )
    }

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Days parameter must be between 1 and 365' 
        },
        { status: 400 }
      )
    }

    // Generate simulated historical data for demo
    // In production, this would query a database or external API
    const historicalRates = generateHistoricalRates(from!, to!, days)

    // Calculate statistics
    const rates = historicalRates.map(r => r.rate)
    const stats = calculateStats(rates)

    // Format response based on requested format
    if (format === 'chart') {
      // Return data formatted for chart libraries (Chart.js, Recharts, etc.)
      return NextResponse.json({
        success: true,
        data: {
          labels: historicalRates.map(r => r.date),
          datasets: [{
            label: `${from}/${to} Exchange Rate`,
            data: rates,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
          }],
          statistics: stats,
          period: {
            from: historicalRates[0]?.date,
            to: historicalRates[historicalRates.length - 1]?.date,
            days,
          },
        },
      })
    }

    // Default JSON format
    return NextResponse.json({
      success: true,
      data: {
        pair: `${from}/${to}`,
        period: {
          days,
          startDate: historicalRates[0]?.date,
          endDate: historicalRates[historicalRates.length - 1]?.date,
        },
        rates: historicalRates,
        statistics: stats,
        note: 'This is simulated data for demonstration. In production, connect to a real rate history API.',
      },
    })
  } catch (error) {
    console.error('Error fetching rate history:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch rate history' 
      },
      { status: 500 }
    )
  }
}

/**
 * Generate simulated historical rate data
 * In production, replace with actual database queries or API calls
 */
function generateHistoricalRates(from: CurrencyCode, to: CurrencyCode, days: number): HistoricalRate[] {
  const rates: HistoricalRate[] = []
  
  // Base rates (approximate current values)
  const baseRates: Record<string, number> = {
    'DZD-EUR': 0.0068,
    'DZD-USD': 0.0074,
    'DZD-GBP': 0.0059,
    'DZD-CHF': 0.0066,
    'DZD-CAD': 0.0100,
    'DZD-TND': 0.0229,
    'DZD-MAD': 0.0745,
    'EUR-DZD': 146.85,
    'EUR-USD': 1.08,
    'EUR-GBP': 0.86,
    'EUR-CHF': 0.96,
    'USD-DZD': 135.02,
    'USD-EUR': 0.92,
    'USD-GBP': 0.79,
  }

  const key = `${from}-${to}`
  let baseRate = baseRates[key] || 1

  // If reverse pair not found, try to calculate
  if (!baseRate || baseRate === 1 && from !== to) {
    const reverseKey = `${to}-${from}`
    if (baseRates[reverseKey]) {
      baseRate = 1 / baseRates[reverseKey]
    }
  }

  // Generate daily rates with random walk
  let currentRate = baseRate
  
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    // Random fluctuation (-0.5% to +0.5% per day)
    const change = (Math.random() - 0.5) * 0.01
    currentRate = currentRate * (1 + change)
    
    rates.push({
      date: date.toISOString().split('T')[0],
      rate: Math.round(currentRate * 1000000) / 1000000, // 6 decimal places
    })
  }

  return rates
}

/**
 * Calculate statistics for rate data
 */
function calculateStats(rates: number[]) {
  if (rates.length === 0) {
    return null
  }

  const sorted = [...rates].sort((a, b) => a - b)
  const sum = rates.reduce((a, b) => a + b, 0)
  const mean = sum / rates.length
  
  // Standard deviation
  const squaredDiffs = rates.map(rate => Math.pow(rate - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / rates.length
  const stdDev = Math.sqrt(avgSquaredDiff)

  // Min/Max
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  // Change over period
  const startRate = rates[0]
  const endRate = rates[rates.length - 1]
  const totalChange = ((endRate - startRate) / startRate) * 100
  const volatility = stdDev / mean * 100 // Coefficient of variation

  return {
    current: endRate,
    average: Math.round(mean * 1000000) / 1000000,
    min,
    max,
    range: max - min,
    standardDeviation: Math.round(stdDev * 1000000) / 1000000,
    totalChangePercent: Math.round(totalChange * 100) / 100,
    volatilityPercent: Math.round(volatility * 100) / 100,
    dataPoints: rates.length,
  }
}

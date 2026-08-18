// POST /api/currency/convert - Convert amount between currencies
// Supports single and batch conversion

import { NextRequest, NextResponse } from 'next/server'
import {
  convert,
  batchConvert,
  getExchangeRate,
} from '@/lib/currency/converter'
import { formatCurrency } from '@/lib/currency/formatter'
import { CurrencyCode, isSupportedCurrency, getCurrencyCodes } from '@/lib/currency/config'

// POST for single or batch conversion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, from, to, targets, batch } = body

    // Batch conversion mode
    if (batch && targets && Array.isArray(targets)) {
      return await handleBatchConversion(amount, from, targets)
    }

    // Single conversion mode
    if (amount === undefined || !from || !to) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: amount, from, to' 
        },
        { status: 400 }
      )
    }

    // Validate currencies
    if (!isSupportedCurrency(from)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid "from" currency. Supported: ${getCurrencyCodes().join(', ')}` 
        },
        { status: 400 }
      )
    }

    if (!isSupportedCurrency(to)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid "to" currency. Supported: ${getCurrencyCodes().join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Validate amount
    const numericAmount = Number(amount)
    if (isNaN(numericAmount) || numericAmount < 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Amount must be a non-negative number' 
        },
        { status: 400 }
      )
    }

    // Perform conversion
    const result = await convert(numericAmount, from as CurrencyCode, to as CurrencyCode)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error converting currency:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to convert currency' 
      },
      { status: 500 }
    )
  }
}

// GET for simple conversions (query params)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const amount = searchParams.get('amount')
    const from = searchParams.get('from') as CurrencyCode | null
    const to = searchParams.get('to') as CurrencyCode | null

    if (!amount || !from || !to) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing query parameters: amount, from, to',
          usage: 'GET /api/currency/convert?amount=100&from=DZD&to=USD'
        },
        { status: 400 }
      )
    }

    if (!isSupportedCurrency(from!) || !isSupportedCurrency(to!)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid currency. Supported: ${getCurrencyCodes().join(', ')}` 
        },
        { status: 400 }
      )
    }

    const numericAmount = Number(amount)
    
    if (isNaN(numericAmount) || numericAmount < 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Amount must be a non-negative number' 
        },
        { status: 400 }
      )
    }

    const result = await convert(numericAmount, from!, to!)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error converting currency:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to convert currency' 
      },
      { status: 500 }
    )
  }
}

// Handle batch conversion
async function handleBatchConversion(
  amount: number,
  from: string,
  targets: string[]
) {
  if (!isSupportedCurrency(from as CurrencyCode)) {
    return NextResponse.json(
      { 
        success: false, 
        error: `Invalid "from" currency: ${from}` 
      },
      { status: 400 }
    )
  }

  // Validate all target currencies
  const validTargets: CurrencyCode[] = []
  for (const target of targets) {
    if (isSupportedCurrency(target)) {
      validTargets.push(target as CurrencyCode)
    } else {
      console.warn(`Skipping invalid target currency: ${target}`)
    }
  }

  if (validTargets.length === 0) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'No valid target currencies provided' 
      },
      { status: 400 }
    )
  }

  const numericAmount = Number(amount)
  
  if (isNaN(numericAmount) || numericAmount < 0) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Amount must be a non-negative number' 
      },
      { status: 400 }
    )
  }

  try {
    const result = await batchConvert(numericAmount, from as CurrencyCode, validTargets)

    return NextResponse.json({
      success: true,
      data: {
        original: result.original,
        conversions: Object.fromEntries(
          Object.entries(result.conversions).map(([code, conv]) => [
            code,
            conv,
          ])
        ),
        targetCount: validTargets.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    throw error
  }
}

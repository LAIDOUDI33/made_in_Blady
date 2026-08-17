// POST /api/currency/convert - Convert amount between currencies

import { NextRequest, NextResponse } from 'next/server'
import { convertAmount, formatCurrency, SupportedCurrency } from '@/lib/currency'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, from, to } = body

    // Validate required fields
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
    const validCurrencies: SupportedCurrency[] = ['DZD', 'USD', 'EUR', 'GBP', 'CAD', 'TND', 'MAD']
    
    if (!validCurrencies.includes(from)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid "from" currency. Supported: ${validCurrencies.join(', ')}` 
        },
        { status: 400 }
      )
    }

    if (!validCurrencies.includes(to)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid "to" currency. Supported: ${validCurrencies.join(', ')}` 
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
    const convertedAmount = await convertAmount(numericAmount, from, to)

    // Format both amounts for display
    const formattedFrom = formatCurrency(numericAmount, from)
    const formattedTo = formatCurrency(convertedAmount, to)

    return NextResponse.json({
      success: true,
      data: {
        original: {
          amount: numericAmount,
          currency: from,
          formatted: formattedFrom,
        },
        converted: {
          amount: convertedAmount,
          currency: to,
          formatted: formattedTo,
        },
        rate: convertedAmount / numericAmount, // Exchange rate used
        timestamp: new Date().toISOString(),
      },
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

// Also support GET for simple conversions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const amount = searchParams.get('amount')
    const from = searchParams.get('from') as SupportedCurrency | null
    const to = searchParams.get('to') as SupportedCurrency | null

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

    // Reuse POST logic
    const numericAmount = Number(amount)
    const convertedAmount = await convertAmount(numericAmount, from!, to!)

    return NextResponse.json({
      success: true,
      data: {
        original: { amount: numericAmount, currency: from },
        converted: { 
          amount: convertedAmount, 
          currency: to,
          formatted: formatCurrency(convertedAmount, to!),
        },
      },
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

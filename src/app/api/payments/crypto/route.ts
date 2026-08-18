// POST /api/payments/crypto/create - Create new crypto payment
// GET /api/payments/crypto - Get all crypto payments (admin)

import { NextRequest, NextResponse } from 'next/server'
import {
  initializeCryptoPayment,
  CryptoCurrency,
  validateCryptoAddress,
  CRYPTO_INFO,
} from '@/lib/payments/crypto'
import { startMonitoring } from '@/lib/payments/blockchain-monitor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      orderId,
      amount,
      currency,
      buyerWalletAddress,
      network = 'mainnet',
    } = body

    // Validate required fields
    if (!orderId || !amount || !currency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, amount, currency' },
        { status: 400 }
      )
    }

    // Validate currency
    if (!Object.keys(CRYPTO_INFO).includes(currency)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid currency. Supported: ${Object.keys(CRYPTO_INFO).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Validate buyer wallet address if provided
    if (buyerWalletAddress && !validateCryptoAddress(buyerWalletAddress, currency as CryptoCurrency)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format for selected cryptocurrency' },
        { status: 400 }
      )
    }

    // Initialize payment
    const paymentResult = await initializeCryptoPayment({
      orderId,
      amount,
      currency: currency as CryptoCurrency,
      buyerWalletAddress,
      network,
    })

    // Start blockchain monitoring
    startMonitoring(
      paymentResult.paymentId,
      paymentResult.depositAddress,
      paymentResult.cryptoCurrency,
      paymentResult.expectedAmount
    )

    return NextResponse.json({
      success: true,
      data: paymentResult,
      message: 'Crypto payment initialized. Send funds to the provided address.',
    })
  } catch (error) {
    console.error('Error creating crypto payment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create crypto payment' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Return supported cryptocurrencies info
    return NextResponse.json({
      success: true,
      data: {
        supportedCurrencies: Object.entries(CRYPTO_INFO).map(([code, info]) => ({
          code,
          ...info,
        })),
        features: [
          'Real-time exchange rates',
          'QR code scanning',
          '15-minute payment window',
          'Automatic confirmation monitoring',
          'Refund support',
        ],
      },
    })
  } catch (error) {
    console.error('Error fetching crypto info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch crypto information' },
      { status: 500 }
    )
  }
}

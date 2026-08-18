// POST /api/payments/crypto/create-order
// Create a new cryptocurrency payment order

import { NextRequest, NextResponse } from 'next/server'
import {
  createCryptoPaymentOrder,
  getSupportedCryptos,
  SupportedCrypto,
} from '@/lib/payments/crypto/client'
import { startMonitoring } from '@/lib/payments/crypto/blockchain-monitor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      orderId,
      userId,
      amountInDZD,
      cryptocurrency,
      network,
      buyerWalletAddress,
    } = body

    // Validate required fields
    if (!orderId || !userId || !amountInDZD || !cryptocurrency) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: orderId, userId, amountInDZD, cryptocurrency' 
        },
        { status: 400 }
      )
    }

    // Validate cryptocurrency
    const supportedCryptos = getSupportedCryptos()
    const isValidCrypto = supportedCryptos.some(c => c.code === cryptocurrency)
    
    if (!isValidCrypto) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid cryptocurrency. Supported: ${supportedCryptos.map(c => c.code).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Validate amount
    const amount = Number(amountInDZD)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    if (amount < 1000) {
      return NextResponse.json(
        { success: false, error: 'Minimum order amount is 1,000 DZD' },
        { status: 400 }
      )
    }

    // Create the payment order
    const paymentOrder = await createCryptoPaymentOrder({
      orderId,
      userId,
      amountInDZD: amount,
      cryptocurrency: cryptocurrency as SupportedCrypto,
      network,
      buyerWalletAddress,
    })

    // Start blockchain monitoring for this payment
    startMonitoring(
      paymentOrder.paymentId,
      paymentOrder.receivingAddress,
      paymentOrder.cryptocurrency,
      paymentOrder.expectedAmount,
      paymentOrder.network
    )

    return NextResponse.json({
      success: true,
      data: paymentOrder,
      message: 'Crypto payment order created successfully. Send funds to the provided address.',
    })
  } catch (error) {
    console.error('Error creating crypto payment order:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create crypto payment order'
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    )
  }
}

// GET /api/payments/crypto/create-order - Get supported cryptos info
export async function GET() {
  try {
    const supportedCryptos = getSupportedCryptos()
    
    return NextResponse.json({
      success: true,
      data: {
        supportedCryptos,
        features: [
          'Real-time exchange rates via CoinGecko',
          'Multi-network support (TRC20, ERC20, BEP20)',
          'QR code scanning for easy mobile payments',
          '15-minute price lock window',
          'Automatic transaction monitoring',
          'Email notifications on confirmation',
        ],
        security: {
          maxPaymentWindowHours: 2,
          priceValidityMinutes: 15,
          allowedSlippagePercent: 1,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching crypto info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cryptocurrency information' },
      { status: 500 }
    )
  }
}

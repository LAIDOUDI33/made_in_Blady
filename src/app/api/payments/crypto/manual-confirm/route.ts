// POST /api/payments/crypto/manual-confirm
// Allow users to submit transaction hash for manual verification

import { NextRequest, NextResponse } from 'next/server'
import { submitManualConfirmation, validateTransaction } from '@/lib/payments/crypto/client'
import { getTransactionDetails } from '@/lib/payments/crypto/blockchain-monitor'
import { db } from '@/lib/db'

interface ManualConfirmRequest {
  paymentId: string
  txHash: string
  userId: string
}

// Rate limiting storage (in production, use Redis)
const recentSubmissions = new Map<string, number>()
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const MAX_SUBMISSIONS_PER_WINDOW = 3

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const submissions = recentSubmissions.get(userId) || 0
  
  if (submissions >= MAX_SUBMISSIONS_PER_WINDOW) {
    return false // Rate limited
  }
  
  recentSubmissions.set(userId, submissions + 1)
  
  // Clean up old entries periodically
  setTimeout(() => {
    const current = recentSubmissions.get(userId) || 0
    if (current > 0) {
      recentSubmissions.set(userId, current - 1)
    }
  }, RATE_LIMIT_WINDOW_MS)
  
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body: ManualConfirmRequest = await request.json()
    
    const { paymentId, txHash, userId } = body

    // Validate required fields
    if (!paymentId || !txHash || !userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: paymentId, txHash, userId' 
        },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedPaymentId = paymentId.replace(/[^a-zA-Z0-9-]/g, '')
    const sanitizedTxHash = txHash.replace(/[^a-fA-F0-9x]/g, '') // Allow hex chars
    
    if (sanitizedPaymentId !== paymentId || sanitizedTxHash !== txHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid input format' },
        { status: 400 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many submission attempts. Please try again later.' 
        },
        { status: 429 }
      )
    }

    // Check if payment exists
    const payment = await db.cryptoPayment.findUnique({
      where: { paymentId: sanitizedPaymentId },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if user owns this payment
    if (payment.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check payment status
    if (payment.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Payment is already completed' },
        { status: 400 }
      )
    }

    if (payment.status === 'EXPIRED') {
      return NextResponse.json(
        { success: false, error: 'Payment has expired' },
        { status: 400 }
      )
    }

    if (payment.txHash) {
      return NextResponse.json(
        { success: false, error: 'Transaction already recorded for this payment' },
        { status: 400 }
      )
    }

    // Verify transaction on blockchain (async - don't block response)
    verifyTransactionOnBlockchain(sanitizedPaymentId, sanitizedTxHash, payment.cryptocurrency)

    // Submit for manual confirmation
    const result = await submitManualConfirmation(
      sanitizedPaymentId,
      sanitizedTxHash,
      userId
    )

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        newStatus: result.newStatus,
        txHash: sanitizedTxHash,
        explorerUrl: getExplorerUrl(sanitizedTxHash, payment.cryptocurrency),
      },
    })
  } catch (error) {
    console.error('Error in manual confirmation:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process manual confirmation' 
      },
      { status: 500 }
    )
  }
}

// Async blockchain verification (doesn't block response)
async function verifyTransactionOnBlockchain(
  paymentId: string,
  txHash: string,
  cryptocurrency: string
): Promise<void> {
  try {
    console.log(`Verifying transaction ${txHash} on blockchain...`)
    
    // Get transaction details from blockchain
    const txDetails = await getTransactionDetails(
      txHash,
      cryptocurrency as any
    )

    if (txDetails) {
      // Update payment with verified details
      await db.cryptoPayment.update({
        where: { paymentId },
        data: {
          confirmations: txDetails.confirmations,
          senderAddress: txDetails.fromAddress,
          blockchainResponse: JSON.stringify({
            manualVerification: true,
            verifiedAt: new Date().toISOString(),
            transaction: txDetails,
          }),
        },
      })
      
      console.log(`Transaction ${txHash} verified on blockchain`)
    }
  } catch (error) {
    console.error('Blockchain verification failed:', error)
    // Don't fail the submission - just log the error
  }
}

// Get explorer URL for a transaction
function getExplorerUrl(txHash: string, cryptocurrency: string): string {
  switch (cryptocurrency.toUpperCase()) {
    case 'BTC':
      return `https://blockchain.info/tx/${txHash}`
    case 'ETH':
      return `https://etherscan.io/tx/${txHash}`
    case 'USDT':
    case 'USDC':
      // Default to Etherscan for ERC-20 tokens
      return `https://etherscan.io/tx/${txHash}`
    default:
      return '#'
  }
}

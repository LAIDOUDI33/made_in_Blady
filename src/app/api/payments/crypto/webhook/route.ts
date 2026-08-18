// POST /api/payments/crypto/webhook
// Receive blockchain notifications and update payment status

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cryptoConfig } from '@/lib/payments/crypto/config'
import { validateTransaction, completePayment } from '@/lib/payments/crypto/client'

interface WebhookPayload {
  event: string
  data: {
    txHash?: string
    paymentId?: string
    address?: string
    amount?: number
    confirmations?: number
    cryptocurrency?: string
    timestamp?: string
  }
}

// Simple signature verification (in production, use proper HMAC)
function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = cryptoConfig.webhooks.secret
  
  // In production, use HMAC-SHA256 verification:
  // const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  // return timingSafeEqual(signature, expectedSig)
  
  // For now, just check if signature exists (implement proper verification in production!)
  if (!signature || signature.length < 10) {
    return false
  }
  
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Get signature from headers
    const signature = request.headers.get('x-crypto-signature') || 
                      request.headers.get('x-signature') ||
                      ''
    
    // Read raw body for signature verification
    const payload = await request.text()
    
    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.warn('Invalid webhook signature received')
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }

    let body: WebhookPayload
    
    try {
      body = JSON.parse(payload)
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const { event, data } = body
    
    if (!event || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing event or data in payload' },
        { status: 400 }
      )
    }

    console.log(`Crypto webhook received: ${event}`, data)

    // Handle different event types
    switch (event) {
      case 'transaction.detected':
        await handleTransactionDetected(data)
        break
        
      case 'transaction.confirmed':
        await handleTransactionConfirmed(data)
        break
        
      case 'payment.completed':
        await handlePaymentCompleted(data)
        break
        
      case 'payment.expired':
        await handlePaymentExpired(data)
        break
        
      default:
        console.warn(`Unknown webhook event type: ${event}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    })
  } catch (error) {
    console.error('Error processing crypto webhook:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process webhook' 
      },
      { status: 500 }
    )
  }
}

// Handle new transaction detection
async function handleTransactionDetected(data: any): Promise<void> {
  if (!data.txHash || !data.paymentId) return
  
  const payment = await db.cryptoPayment.findUnique({
    where: { paymentId: data.paymentId },
  })
  
  if (!payment || payment.status !== 'PENDING') return
  
  // Update status to AWAITING_CONFIRMATION
  await db.cryptoPayment.update({
    where: { id: payment.id },
    data: {
      status: 'AWAITING_CONFIRMATION',
      txHash: data.txHash,
      senderAddress: data.fromAddress,
      confirmations: data.confirmations || 1,
      blockchainResponse: JSON.stringify({
        event: 'transaction.detected',
        detectedAt: new Date().toISOString(),
        ...data,
      }),
    },
  })
  
  console.log(`Transaction detected for payment ${data.paymentId}: ${data.txHash}`)
  
  // TODO: Send notification to user about transaction detection
}

// Handle transaction confirmation update
async function handleTransactionConfirmed(data: any): Promise<void> {
  if (!data.txHash) return
  
  // Find payment by txHash
  const payment = await db.cryptoPayment.findFirst({
    where: {
      txHash: data.txHash,
      status: { in: ['AWAITING_CONFIRMATION', 'CONFIRMING'] },
    },
  })
  
  if (!payment) return
  
  const requiredConfirms = payment.requiredConfirmations
  const currentConfirms = data.confirmations || 0
  
  // Update confirmation count
  await db.cryptoPayment.update({
    where: { id: payment.id },
    data: {
      confirmations: currentConfirms,
      status: currentConfirms >= requiredConfirms ? 'COMPLETED' : 'CONFIRMING',
      ...(currentConfirms >= requiredConfirms ? { confirmedAt: new Date() } : {}),
      blockchainResponse: JSON.stringify({
        event: 'transaction.confirmed',
        updatedAt: new Date().toISOString(),
        confirmations: currentConfirms,
        requiredConfirmations: requiredConfirms,
      }),
    },
  })
  
  if (currentConfirms >= requiredConfirms) {
    console.log(`Payment ${payment.paymentId} COMPLETED with ${currentConfirms} confirmations`)
    // TODO: Trigger order fulfillment
  }
}

// Handle payment completion
async function handlePaymentCompleted(data: any): Promise<void> {
  if (!data.paymentId && !data.txHash) return
  
  // Find payment
  let payment
  
  if (data.paymentId) {
    payment = await db.cryptoPayment.findUnique({
      where: { paymentId: data.paymentId },
    })
  } else if (data.txHash) {
    payment = await db.cryptoPayment.findFirst({
      where: { txHash: data.txHash },
    })
  }
  
  if (!payment) return
  
  if (payment.status === 'COMPLETED') return // Already completed
  
  // Mark as completed
  await db.cryptoPayment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      confirmedAt: new Date(),
      blockchainResponse: JSON.stringify({
        event: 'payment.completed',
        completedAt: new Date().toISOString(),
        ...data,
      }),
    },
  })
  
  console.log(`Payment ${payment.paymentId} marked as completed via webhook`)
  
  // TODO: 
  // 1. Update order status
  // 2. Send confirmation email
  // 3. Notify seller
  // 4. Create invoice
}

// Handle payment expiration
async function handlePaymentExpired(data: any): Promise<void> {
  if (!data.paymentId) return
  
  const payment = await db.cryptoPayment.findUnique({
    where: { paymentId: data.paymentId },
  })
  
  if (!payment || payment.status !== 'PENDING') return
  
  // Mark as expired
  await db.cryptoPayment.update({
    where: { id: payment.id },
    data: {
      status: 'EXPIRED',
      blockchainResponse: JSON.stringify({
        event: 'payment.expired',
        expiredAt: new Date().toISOString(),
      }),
    },
  })
  
  console.log(`Payment ${data.paymentId} marked as expired via webhook`)
}

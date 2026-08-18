/**
 * SATIM Payment Creation API Route
 * POST /api/payments/satim/create
 * 
 * Creates a new SATIM payment session and returns redirect URL for 3D Secure
 * @module api/payments/satim/create
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { initiatePayment, SatimError } from '@/lib/payments/satim/client'
import type { SatimPaymentRequest } from '@/lib/payments/satim/types'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * POST handler - Create a new SATIM payment session
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================
    // AUTHENTICATION (CRITICAL)
    // ========================================
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // Parse request body
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body', code: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    const {
      orderId,
      amount,
      customerEmail,
      customerPhone,
      cardNumber,
      expiryDate,
      cvv,
      cardholderName,
      saveCard,
      description,
    } = body as {
      orderId?: string
      amount?: number
      customerEmail?: string
      customerPhone?: string
      cardNumber?: string
      expiryDate?: string
      cvv?: string
      cardholderName?: string
      saveCard?: boolean
      description?: string
    }

    // ========================================
    // VALIDATION
    // ========================================
    
    // Order ID is required
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required', code: 'MISSING_ORDER_ID' },
        { status: 400 }
      )
    }

    // Check if order exists and user owns it
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { 
        payment: true,
        buyer: { select: { id: true, email: true, name: true } }
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Verify user is the buyer
    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only pay for your own orders', code: 'UNAUTHORIZED' },
        { status: 403 }
      )
    }

    // Check for existing completed payment
    if (order.payment && !['FAILED', 'CANCELLED'].includes(order.payment.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment already exists for this order',
          code: 'PAYMENT_EXISTS',
          paymentStatus: order.payment.status,
          paymentId: order.payment.id,
        },
        { status: 409 }
      )
    }

    // Use order amount if not provided
    const paymentAmount = amount || order.totalAmount

    // Build base URLs for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`

    // ========================================
    // CREATE SATIM PAYMENT SESSION
    // ========================================
    
    const paymentRequest: SatimPaymentRequest = {
      amount: paymentAmount,
      orderId: order.orderNumber || orderId,
      customerId: session.user.id,
      customerEmail: customerEmail || order.buyer.email || session.user.email || undefined,
      customerPhone: customerPhone || undefined,
      description: description || `Payment for order ${order.orderNumber}`,
      billingAddress: cardholderName ? {
        firstName: cardholderName.split(' ')[0] || '',
        lastName: cardholderName.split(' ').slice(1).join(' ') || '',
        address: '',
        city: '',
        zipCode: '',
        country: 'DZ',
      } : undefined,
    }

    // Initiate payment with SATIM
    const satimResult = await initiatePayment(paymentRequest)

    // ========================================
    // SAVE TO DATABASE
    // ========================================

    // Create or update payment record
    let payment
    
    if (order.payment && ['FAILED', 'CANCELLED'].includes(order.payment.status)) {
      // Update existing failed/cancelled payment
      payment = await db.payment.update({
        where: { id: order.payment.id },
        data: {
          method: 'SATIM',
          status: 'PROCESSING',
          transactionId: satimResult.transactionId,
          amount: paymentAmount,
          currency: order.currency || 'DZD',
          metadata: JSON.stringify({
            satimTransactionId: satimResult.transactionId,
            satimRedirectUrl: satimResult.redirectUrl,
            cardType: detectCardTypeFromNumber(cardNumber),
            cardLast4: cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : null,
            saveCard: saveCard || false,
            createdAt: new Date().toISOString(),
          }),
          failureReason: null,
        }
      })
    } else {
      // Create new payment record
      payment = await db.payment.create({
        data: {
          orderId: order.id,
          amount: paymentAmount,
          currency: order.currency || 'DZD',
          method: 'SATIM',
          status: 'PROCESSING',
          transactionId: satimResult.transactionId,
          referenceNumber: `SATIM-${Date.now()}`,
          metadata: JSON.stringify({
            satimTransactionId: satimResult.transactionId,
            satimRedirectUrl: satimResult.redirectUrl,
            cardType: detectCardTypeFromNumber(cardNumber),
            cardLast4: cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : null,
            saveCard: saveCard || false,
            createdAt: new Date().toISOString(),
          }),
        }
      })
    }

    // Create SATIM transaction record
    try {
      await db.satimTransaction.create({
        data: {
          transactionId: satimResult.transactionId,
          orderId: order.id,
          userId: session.user.id,
          amount: paymentAmount,
          currency: 'DZD',
          status: 'PENDING',
          cardType: detectCardTypeFromNumber(cardNumber),
          cardLast4: cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : null,
          rawResponse: JSON.stringify(satimResult),
        }
      })
    } catch (dbError) {
      console.error('[SATIM Create] Failed to create SatimTransaction record:', dbError)
      // Continue even if this fails - main payment was created
    }

    // Log transaction creation
    try {
      await db.transactionLog.create({
        data: {
          paymentId: payment.id,
          action: 'satim_payment_created',
          details: JSON.stringify({
            satimTransactionId: satimResult.transactionId,
            orderId: order.orderNumber || orderId,
            amount: paymentAmount,
            currency: 'DZD',
            redirectUrl: satimResult.redirectUrl,
          }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          userId: session.user.id,
        }
      })
    } catch (logError) {
      console.error('[SATIM Create] Failed to create transaction log:', logError)
    }

    // ========================================
    // RETURN SUCCESS RESPONSE
    // ========================================
    
    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        transactionId: satimResult.transactionId,
        redirectUrl: satimResult.redirectUrl,
        status: payment.status,
        amount: paymentAmount,
        currency: 'DZD',
      },
      message: 'Payment session created successfully. Redirect to complete 3D Secure authentication.',
    })

  } catch (error) {
    console.error('[SATIM Create] Error:', error)

    // Handle known SATIM errors
    if (error instanceof SatimError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.httpStatus }
      )
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during payment creation',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Detect card type from card number string
 */
function detectCardTypeFromNumber(cardNumber?: string): string | null {
  if (!cardNumber) return null
  
  const cleaned = cardNumber.replace(/\s/g, '').replace(/\D/g, '')
  
  if (/^4/.test(cleaned)) return 'VISA'
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'MASTERCARD'
  if (/^6/.test(cleaned)) return 'CIB'
  
  return null
}

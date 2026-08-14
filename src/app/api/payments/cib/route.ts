import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  validateCardNumber, 
  validateExpiryDate, 
  validateCVV, 
  detectCardType,
  generateTransactionId,
  simulateProcessingDelay 
} from '@/lib/payments/utils'

interface CIBPaymentRequest {
  paymentId: string
  cardNumber: string
  expiryDate: string
  cvv: string
  cardholderName: string
  saveCard?: boolean
}

// POST: Process CIB card payment (mock implementation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      paymentId, 
      cardNumber, 
      expiryDate, 
      cvv, 
      cardholderName,
      saveCard 
    }: CIBPaymentRequest = body

    // Validate required fields
    if (!paymentId || !cardNumber || !expiryDate || !cvv || !cardholderName) {
      return NextResponse.json(
        { error: 'Tous les champs de la carte sont requis' },
        { status: 400 }
      )
    }

    // Validate card number
    if (!validateCardNumber(cardNumber)) {
      return NextResponse.json(
        { error: 'Numéro de carte invalide' },
        { status: 400 }
      )
    }

    // Validate expiry date
    if (!validateExpiryDate(expiryDate)) {
      return NextResponse.json(
        { error: 'Date d\'expiration invalide ou expirée' },
        { status: 400 }
      )
    }

    // Validate CVV
    if (!validateCVV(cvv)) {
      return NextResponse.json(
        { error: 'CVV invalide (3-4 chiffres requis)' },
        { status: 400 }
      )
    }

    // Get payment record
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { order: true }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Paiement non trouvé' },
        { status: 404 }
      )
    }

    if (payment.method !== 'CIB') {
      return NextResponse.json(
        { error: 'Cette méthode de paiement n\'est pas CIB' },
        { status: 400 }
      )
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Ce paiement est déjà ${payment.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Log processing start
    await db.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: 'processing',
        details: JSON.stringify({ step: 'card_validation_start' }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    // Update status to processing
    await db.payment.update({
      where: { id: paymentId },
      data: { status: 'PROCESSING' }
    })

    // Simulate processing delay (mock 3D Secure)
    await simulateProcessingDelay(2000)

    // Detect card type
    const cardType = detectCardType(cardNumber)
    
    // Get last 4 digits
    const cardLast4 = cardNumber.replace(/\s/g, '').slice(-4)

    // Generate transaction ID
    const transactionId = generateTransactionId()

    // Mock success (90% success rate for demo)
    const isSuccess = Math.random() > 0.1

    if (isSuccess) {
      // Update payment as completed
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          cardLast4,
          cardType,
          transactionId,
          paidAt: new Date(),
        }
      })

      // Update order status
      await db.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED' }
      })

      // Log success
      await db.transactionLog.create({
        data: {
          paymentId: payment.id,
          action: 'success',
          details: JSON.stringify({
            transactionId,
            cardLast4,
            cardType,
            maskedCard: `****${cardLast4}`,
          }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Paiement effectué avec succès',
        payment: {
          id: updatedPayment.id,
          status: updatedPayment.status,
          transactionId: updatedPayment.transactionId,
          cardLast4: updatedPayment.cardLast4,
          paidAt: updatedPayment.paidAt,
        },
        orderId: payment.orderId,
        orderNumber: payment.order?.orderNumber,
      })
    } else {
      // Mock failure
      const failureReasons = [
        'Fonds insuffisants',
        'Carte refusée par la banque',
        'Erreur 3D Secure - authentification échouée',
        'Transaction dépassant la limite autorisée',
        'Carte signalée comme perdue ou volée',
      ]
      
      const failureReason = failureReasons[Math.floor(Math.random() * failureReasons.length)]

      // Update payment as failed
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          cardLast4,
          cardType,
          failureReason,
        }
      })

      // Log failure
      await db.transactionLog.create({
        data: {
          paymentId: payment.id,
          action: 'failure',
          details: JSON.stringify({
            failureReason,
            cardLast4,
          }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        }
      })

      return NextResponse.json(
        {
          success: false,
          error: failureReason,
          payment: {
            id: updatedPayment.id,
            status: updatedPayment.status,
            failureReason: updatedPayment.failureReason,
          }
        },
        { status: 402 }
      )
    }
  } catch (error) {
    console.error('CIB Payment error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du paiement CIB' },
      { status: 500 }
    )
  }
}

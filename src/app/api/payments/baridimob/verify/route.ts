import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateTransactionId, simulateProcessingDelay } from '@/lib/payments/utils'
import { otpStore } from '../baridimob/route'

interface BaridiMobVerifyRequest {
  paymentId: string
  otp: string
}

// POST: Verify OTP and complete BaridiMob payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, otp }: BaridiMobVerifyRequest = body

    // Validate required fields
    if (!paymentId || !otp) {
      return NextResponse.json(
        { error: 'ID du paiement et code OTP requis' },
        { status: 400 }
      )
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'Format OTP invalide (6 chiffres requis)' },
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

    if (payment.method !== 'BARIDIMOB') {
      return NextResponse.json(
        { error: 'Cette méthode de paiement n\'est pas BaridiMob' },
        { status: 400 }
      )
    }

    if (payment.status !== 'PROCESSING') {
      return NextResponse.json(
        { error: `Ce paiement ne peut pas être vérifié (statut: ${payment.status})` },
        { status: 400 }
      )
    }

    // Verify OTP
    const storedOtp = otpStore.get(payment.phoneNumber || '')
    
    if (!storedOtp) {
      return NextResponse.json(
        { error: 'Aucun OTP trouvé pour ce numéro. Veuillez redemander un code.' },
        { status: 400 }
      )
    }

    if (storedOtp.paymentId !== paymentId) {
      return NextResponse.json(
        { error: 'OTP non valide pour ce paiement' },
        { status: 400 }
      )
    }

    if (new Date() > storedOtp.expiresAt) {
      otpStore.delete(payment.phoneNumber || '')
      return NextResponse.json(
        { error: 'OTP expiré. Veuillez demander un nouveau code.' },
        { status: 400 }
      )
    }

    if (storedOtp.otp !== otp) {
      // Log failed attempt
      await db.transactionLog.create({
        data: {
          paymentId: payment.id,
          action: 'failure',
          details: JSON.stringify({
            reason: 'invalid_otp',
            attempt: 'otp_verification',
          }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        }
      })

      return NextResponse.json(
        { error: 'Code OTP incorrect' },
        { status: 400 }
      )
    }

    // Clear used OTP
    otpStore.delete(payment.phoneNumber || '')

    // Simulate processing delay
    await simulateProcessingDelay(1500)

    // Generate transaction ID
    const transactionId = generateTransactionId()

    // Mock balance check (in production, check with BaridiMob API)
    const hasSufficientBalance = Math.random() > 0.15

    if (!hasSufficientBalance) {
      // Update payment as failed
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          failureReason: 'Solde BaridiMob insuffisant',
        }
      })

      // Log failure
      await db.transactionLog.create({
        data: {
          paymentId: payment.id,
          action: 'failure',
          details: JSON.stringify({
            transactionId,
            failureReason: 'insufficient_balance',
          }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        }
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Solde BaridiMob insuffisant',
          payment: {
            id: updatedPayment.id,
            status: updatedPayment.status,
            failureReason: updatedPayment.failureReason,
          }
        },
        { status: 402 }
      )
    }

    // Update payment as completed
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
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
          phoneNumber: payment.phoneNumber?.replace(/(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5'),
          method: 'baridimob_otp_verified',
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Paiement BaridiMob effectué avec succès',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        transactionId: updatedPayment.transactionId,
        paidAt: updatedPayment.paidAt,
      },
      orderId: payment.orderId,
      orderNumber: payment.order?.orderNumber,
    })
  } catch (error) {
    console.error('BaridiMob Verify error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du paiement BaridiMob' },
      { status: 500 }
    )
  }
}

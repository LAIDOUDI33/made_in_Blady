import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateAlgerianPhone, normalizePhoneNumber, generateOTP } from '@/lib/payments/utils'

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: Date; paymentId: string }>()

interface BaridiMobInitiateRequest {
  paymentId: string
  phoneNumber: string
}

// POST: Initiate BaridiMob payment - send OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, phoneNumber }: BaridiMobInitiateRequest = body

    // Validate required fields
    if (!paymentId || !phoneNumber) {
      return NextResponse.json(
        { error: 'ID du paiement et numéro de téléphone requis' },
        { status: 400 }
      )
    }

    // Validate phone number
    if (!validateAlgerianPhone(phoneNumber)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone algérien invalide (format: +213XXXXXXXXX)' },
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

    if (payment.status !== 'PENDING' && payment.status !== 'FAILED') {
      return NextResponse.json(
        { error: `Ce paiement est déjà ${payment.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber)

    // Generate OTP
    const otp = generateOTP()
    
    // Store OTP (expires in 5 minutes)
    otpStore.set(normalizedPhone, {
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      paymentId,
    })

    // Update payment with phone number
    await db.payment.update({
      where: { id: paymentId },
      data: {
        phoneNumber: normalizedPhone,
        status: 'PROCESSING',
      }
    })

    // Log transaction
    await db.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: 'processing',
        details: JSON.stringify({
          phoneNumber: normalizedPhone.replace(/(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5'),
          step: 'otp_sent',
          otpMasked: `***${otp.slice(-2)}`,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    // In production, send SMS via BaridiMob API
    console.log(`[BaridiMob Mock] OTP for ${normalizedPhone}: ${otp}`)

    return NextResponse.json({
      success: true,
      message: 'Code OTP envoyé avec succès',
      payment: {
        id: payment.id,
        referenceNumber: payment.referenceNumber,
        amount: payment.amount,
        currency: payment.currency,
        status: 'PROCESSING',
      },
      maskedPhone: normalizedPhone.replace(/(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5'),
      otpInfo: {
        sent: true,
        expiresIn: 300, // 5 minutes in seconds
        maskedCode: `***${otp.slice(-2)}`, // For demo only!
      },
      nextSteps: [
        'Entrez le code OTP reçu par SMS',
        'Le code expire dans 5 minutes',
        'Confirmez le paiement après validation',
      ],
      // For demo purposes - show OTP (REMOVE IN PRODUCTION)
      _demoOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
    })
  } catch (error) {
    console.error('BaridiMob Initiate error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation du paiement BaridiMob' },
      { status: 500 }
    )
  }
}

// Export OTP store for verification route
export { otpStore }

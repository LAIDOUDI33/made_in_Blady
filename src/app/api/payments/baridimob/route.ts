import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
    // SECURITY: Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

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

    // Get payment record with ownership verification
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { buyerId: true, orderNumber: true } } }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Paiement non trouvé' },
        { status: 404 }
      )
    }

    // SECURITY: Verify payment belongs to authenticated user (IDOR protection)
    if (payment.order?.buyerId !== session.user.id) {
      await db.securityEvent.create({
        data: {
          eventType: 'UNAUTHORIZED_PAYMENT_ATTEMPT',
          userId: session.user.id,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          details: JSON.stringify({ paymentId, action: 'baridimob_initiate_attempt' }),
        }
      }).catch(() => {})
      
      return NextResponse.json(
        { error: 'Non autorisé à accéder à ce paiement' },
        { status: 403 }
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

    // Log transaction (NEVER log actual OTP)
    await db.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: 'processing',
        details: JSON.stringify({
          phoneNumber: normalizedPhone.replace(/(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5'),
          step: 'otp_sent',
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    // In production, send SMS via BaridiMob API
    // SECURITY: Never log OTP in production - use structured logging service instead
    if (process.env.NODE_ENV === 'development') {
      console.log(`[BaridiMob Mock] OTP generated for ${normalizedPhone}`)
    }

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
        // SECURITY: Never expose OTP or partial OTP in response
      },
      nextSteps: [
        'Entrez le code OTP reçu par SMS',
        'Le code expire dans 5 minutes',
        'Confirmez le paiement après validation',
      ],
      // SECURITY REMOVED: _demoOtp field removed - never expose OTP even in development
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

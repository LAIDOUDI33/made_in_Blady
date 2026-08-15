import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateCCPReference, PLATFORM_BANK_DETAILS, validateCCPAccount } from '@/lib/payments/utils'

interface CCPInitiateRequest {
  paymentId: string
  ccpAccount: string
  holderName?: string
}

// POST: Initiate CCP payment - generate reference and instructions
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
    const { paymentId, ccpAccount, holderName }: CCPInitiateRequest = body

    // Validate required fields
    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID du paiement requis' },
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
          details: JSON.stringify({ paymentId, action: 'ccp_initiate_attempt' }),
        }
      }).catch(() => {})
      
      return NextResponse.json(
        { error: 'Non autorisé à accéder à ce paiement' },
        { status: 403 }
      )
    }

    if (payment.method !== 'CCP') {
      return NextResponse.json(
        { error: 'Cette méthode de paiement n\'est pas CCP' },
        { status: 400 }
      )
    }

    if (payment.status !== 'PENDING' && payment.status !== 'FAILED') {
      return NextResponse.json(
        { error: `Ce paiement est déjà ${payment.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Validate CCP account format if provided
    if (ccpAccount && !validateCCPAccount(ccpAccount)) {
      return NextResponse.json(
        { error: 'Format de compte CCP invalide (format attendu: XXXXXXXXXX-XX)' },
        { status: 400 }
      )
    }

    // Generate CCP reference
    const ccpReference = generateCCPReference()

    // Update payment record
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        ccpReference,
        ccpAccount: ccpAccount || null,
        ccpHolderName: holderName || null,
        status: 'PROCESSING',
      }
    })

    // Log transaction
    await db.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: 'processing',
        details: JSON.stringify({
          ccpReference,
          ccpAccount,
          step: 'ccp_initiated',
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Paiement CCP initié avec succès',
      payment: {
        id: updatedPayment.id,
        referenceNumber: updatedPayment.referenceNumber,
        ccpReference: updatedPayment.ccpReference,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        status: updatedPayment.status,
      },
      paymentInstructions: {
        beneficiaryName: PLATFORM_BANK_DETAILS.accountName,
        ccpAccount: PLATFORM_BANK_DETAILS.ccpAccount,
        ccpKey: PLATFORM_BANK_DETAILS.ccpKey,
        amount: payment.amount,
        currency: payment.currency,
        reference: ccpReference,
        notes: `Veuillez inclure la référence ${ccpReference} dans votre virement`,
      },
      nextSteps: [
        'Effectuez un virement vers notre compte CCP',
        `Montant à transférer: ${payment.amount.toLocaleString('fr-DZ')} ${payment.currency}`,
        `Référence obligatoire: ${ccpReference}`,
        'Conservez le reçu de virement',
        'Téléchargez la preuve de paiement ci-dessous pour validation'
      ],
    })
  } catch (error) {
    console.error('CCP Initiate error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation du paiement CCP' },
      { status: 500 }
    )
  }
}

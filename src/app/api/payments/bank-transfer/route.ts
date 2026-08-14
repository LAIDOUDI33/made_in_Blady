import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReferenceNumber, ALGERIAN_BANKS, PLATFORM_BANK_DETAILS, validateRIB } from '@/lib/payments/utils'
import type { PaymentMethodType } from '@/lib/payments/utils'

interface BankTransferInitiateRequest {
  paymentId: string
  bankName?: string
  rib?: string
  accountHolderName?: string
}

// POST: Initiate Bank Transfer - return RIB info and instructions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, bankName, rib, accountHolderName }: BankTransferInitiateRequest = body

    // Validate required fields
    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID du paiement requis' },
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

    if (payment.method !== 'BANK_TRANSFER') {
      return NextResponse.json(
        { error: 'Cette méthode de paiement n\'est pas un virement bancaire' },
        { status: 400 }
      )
    }

    if (payment.status !== 'PENDING' && payment.status !== 'FAILED') {
      return NextResponse.json(
        { error: `Ce paiement est déjà ${payment.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Validate RIB if provided
    if (rib && !validateRIB(rib)) {
      return NextResponse.json(
        { error: 'RIB invalide (20 chiffres requis)' },
        { status: 400 }
      )
    }

    // Generate unique reference for this transfer
    const transferReference = generateReferenceNumber('BANK_TRANSFER')

    // Update payment record
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        referenceNumber: transferReference,
        bankName: bankName || null,
        rib: rib || null,
        status: 'PROCESSING',
        metadata: JSON.stringify({
          accountHolderName,
          initiatedAt: new Date().toISOString(),
        }),
      }
    })

    // Log transaction
    await db.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: 'processing',
        details: JSON.stringify({
          transferReference,
          bankName,
          rib: rib ? `${rib.slice(0, 5)}...${rib.slice(-3)}` : null,
          step: 'bank_transfer_initiated',
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Virement bancaire initié avec succès',
      payment: {
        id: updatedPayment.id,
        referenceNumber: updatedPayment.referenceNumber,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        status: updatedPayment.status,
      },
      beneficiaryDetails: {
        bankName: PLATFORM_BANK_DETAILS.bankName,
        accountName: PLATFORM_BANK_DETAILS.accountName,
        rib: PLATFORM_BANK_DETAILS.rib,
        formattedRIB: formatRIB(PLATFORM_BANK_DETAILS.rib),
      },
      transferInstructions: {
        reference: transferReference,
        amount: payment.amount,
        currency: payment.currency,
        importantNotes: [
          `Inclure impérativement la référence: ${transferReference}`,
          'Le virement doit provenir d\'un compte au nom de votre entreprise',
          'Les frais bancaires sont à votre charge',
          'Délai de traitement: 1-3 jours ouvrables après réception du virement',
        ],
      },
      availableBanks: ALGERIAN_BANKS.map(bank => ({
        code: bank.code,
        name: bank.name,
      })),
      nextSteps: [
        'Effectuez le virement vers notre compte BNA',
        `Montant exact: ${payment.amount.toLocaleString('fr-DZ')} DZD`,
        `Référence obligatoire: ${transferReference}`,
        'Conservez l\'ordre de virement (bordereau)',
        'Téléchargez le reçu ci-dessous pour accélérer la validation',
      ],
    })
  } catch (error) {
    console.error('Bank Transfer Initiate error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation du virement bancaire' },
      { status: 500 }
    )
  }
}

// Format RIB for display (XXXX XXXX XXXX XXXX XXXX)
function formatRIB(rib: string): string {
  const cleaned = rib.replace(/\s/g, '')
  return cleaned.replace(/(.{5})/g, '$1 ').trim()
}

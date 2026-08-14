import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReferenceNumber, getPaymentMethodInfo } from '@/lib/payments/utils'
import type { PaymentMethodType } from '@/lib/payments/utils'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST: Create new payment for an order
// SECURITY: Requires authentication and buyer ownership verification
export async function POST(request: NextRequest) {
  // ========================================
  // AUTHENTICATION (CRITICAL)
  // ========================================
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Authentication required. Please login to continue.' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { orderId, method } = body as { orderId: string; method: PaymentMethodType }

    // Validate required fields
    if (!orderId || !method) {
      return NextResponse.json(
        { success: false, error: 'orderId et méthode de paiement sont requis' },
        { status: 400 }
      )
    }

    // Validate payment method
    const validMethods: PaymentMethodType[] = ['CIB', 'CCP', 'BARIDIMOB', 'BANK_TRANSFER', 'COD']
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { success: false, error: 'Méthode de paiement invalide' },
        { status: 400 }
      )
    }

    // Check if order exists
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        buyer: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // ========================================
    // AUTHORIZATION (CRITICAL)
    // Verify authenticated user is the order's buyer
    // ========================================
    if (order.buyerId !== session.user.id) {
      // Log unauthorized attempt for security monitoring
      await db.securityEvent.create({
        data: {
          eventType: 'UNAUTHORIZED_PAYMENT_ATTEMPT',
          severity: 'HIGH',
          description: `User ${session.user.id} attempted payment for order belonging to ${order.buyerId}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userId: session.user.id,
        }
      }).catch(() => {}); // Don't fail if logging fails

      return NextResponse.json(
        { 
          success: false, 
          error: 'Forbidden: You can only create payments for your own orders' 
        },
        { status: 403 }
      )
    }

    // Check if payment already exists for this order
    const existingPayment = await db.payment.findUnique({
      where: { orderId }
    })

    if (existingPayment && existingPayment.status !== 'FAILED' && existingPayment.status !== 'CANCELLED') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Un paiement existe déjà pour cette commande',
          paymentId: existingPayment.id,
          status: existingPayment.status
        },
        { status: 409 }
      )
    }

    // Generate reference number
    const referenceNumber = generateReferenceNumber(method)

    // Create or update payment record
    let payment
    if (existingPayment) {
      payment = await db.payment.update({
        where: { orderId },
        data: {
          amount: order.totalAmount,
          currency: order.currency,
          method,
          status: 'PENDING',
          referenceNumber,
          failureReason: null,
        }
      })
    } else {
      payment = await db.payment.create({
        data: {
          orderId,
          amount: order.totalAmount,
          currency: order.currency || 'DZD',
          method,
          status: 'PENDING',
          referenceNumber,
        }
      })
    }

    // Log transaction for audit trail
    await db.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: 'created',
        details: JSON.stringify({
          orderId,
          method,
          amount: order.totalAmount,
          referenceNumber,
          userId: session.user.id, // Track who created this payment
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    // Get payment method info
    const methodInfo = getPaymentMethodInfo(method)

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        referenceNumber: payment.referenceNumber,
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
      },
      methodInfo,
      nextSteps: getNextSteps(method),
    })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}

function getNextSteps(method: PaymentMethodType): string[] {
  switch (method) {
    case 'CIB':
      return [
        'Entrez les informations de votre carte bancaire',
        'Validez le paiement via 3D Secure',
        'Recevez la confirmation immédiate'
      ]
    case 'CCP':
      return [
        'Notez le référence de paiement CCP',
        'Effectuez le virement vers notre compte postal',
        'Téléchargez la preuve de virement'
      ]
    case 'BARIDIMOB':
      return [
        'Entrez votre numéro BaridiMob',
        'Recevez et saisissez le code OTP',
        'Confirmez le paiement instantané'
      ]
    case 'BANK_TRANSFER':
      return [
        'Copiez nos coordonnées bancaires (RIB)',
        'Effectuez le virement depuis votre banque',
        'Téléchargez le reçu bancaire'
      ]
    case 'COD':
      return [
        'Confirmez votre commande',
        'Préparez le montant exact en espèces',
        'Payez à la livraison'
      ]
    default:
      return []
  }
}

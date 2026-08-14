import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Check payment status
export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID du paiement requis' },
        { status: 400 }
      )
    }

    // Get payment with order details
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            items: true,
            company: {
              select: { id: true, name: true }
            },
            buyer: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Paiement non trouvé' },
        { status: 404 }
      )
    }

    // Format response based on payment method
    let paymentDetails = {}

    switch (payment.method) {
      case 'CIB':
        paymentDetails = {
          cardLast4: payment.cardLast4,
          cardType: payment.cardType,
          transactionId: payment.transactionId,
        }
        break
      case 'CCP':
        paymentDetails = {
          ccpReference: payment.ccpReference,
          ccpAccount: payment.ccpAccount?.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3'),
          receiptUrl: payment.receiptUrl,
        }
        break
      case 'BARIDIMOB':
        paymentDetails = {
          phoneNumber: payment.phoneNumber?.replace(/(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5'),
          transactionId: payment.transactionId,
        }
        break
      case 'BANK_TRANSFER':
        paymentDetails = {
          bankName: payment.bankName,
          rib: payment.rib ? `${payment.rib.slice(0, 5)}...${payment.rib.slice(-3)}` : null,
          receiptUrl: payment.receiptUrl,
          referenceNumber: payment.referenceNumber,
        }
        break
      case 'COD':
        paymentDetails = {
          deliveryWilaya: payment.deliveryWilaya,
          codFee: payment.codFee,
        }
        break
    }

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
        paidAt: payment.paidAt,
        failureReason: payment.failureReason,
        notes: payment.notes,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        ...paymentDetails,
      },
      order: payment.order ? {
        id: payment.order.id,
        orderNumber: payment.order.orderNumber,
        status: payment.order.status,
        totalAmount: payment.order.totalAmount,
        itemCount: payment.order.items.length,
        companyName: payment.order.company.name,
      } : null,
      recentLogs: payment.logs.map(log => ({
        id: log.id,
        action: log.action,
        details: log.details ? JSON.parse(log.details) : null,
        createdAt: log.createdAt,
      })),
      statusTimeline: getStatusTimeline(payment.status, payment.createdAt, payment.paidAt),
    })
  } catch (error) {
    console.error('Payment Status error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut du paiement' },
      { status: 500 }
    )
  }
}

function getStatusTimeline(
  status: string, 
  createdAt: Date | null, 
  paidAt: Date | null
): Array<{ step: string; label: string; completed: boolean; date?: Date }> {
  const timeline = [
    { step: 'created', label: 'Créé', completed: true, date: createdAt || undefined },
    { step: 'processing', label: 'En traitement', completed: ['PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PENDING_VERIFICATION'].includes(status) },
    { step: 'completed', label: 'Complété', completed: status === 'COMPLETED', date: paidAt || undefined },
  ]

  if (status === 'FAILED') {
    timeline.push({ step: 'failed', label: 'Échec', completed: true })
  }

  if (status === 'REFUNDED') {
    timeline.push({ step: 'refunded', label: 'Remboursé', completed: true })
  }

  return timeline
}

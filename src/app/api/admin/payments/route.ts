import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List all payments with filters (Admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (method && method !== 'all') {
      where.method = method
    }

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search } },
        { order: { orderNumber: { contains: search } } },
      ]
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        (where.createdAt as Record<string, unknown>).lte = new Date(dateTo + 'T23:59:59.999Z')
      }
    }

    // Get payments with pagination
    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              buyerId: true,
              company: {
                select: { name: true }
              },
              buyer: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          },
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where })
    ])

    // Calculate statistics
    const stats = await getPaymentStats()

    return NextResponse.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment.id,
        orderId: payment.orderId,
        orderNumber: payment.order?.orderNumber,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        referenceNumber: payment.referenceNumber,
        paidAt: payment.paidAt,
        failureReason: payment.failureReason,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        buyerName: payment.order?.buyer 
          ? `${payment.order.buyer.firstName} ${payment.order.buyer.lastName}`
          : null,
        buyerEmail: payment.order?.buyer?.email,
        companyName: payment.order?.company?.name,
        lastAction: payment.logs[0]?.action,
        receiptUrl: payment.receiptUrl,
        needsVerification: payment.status === 'PENDING_VERIFICATION',
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    })
  } catch (error) {
    console.error('Admin Payments GET error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paiements' },
      { status: 500 }
    )
  }
}

// PATCH: Update payment status (Admin - verify/reject)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, action, notes, rejectionReason } = body

    if (!paymentId || !action) {
      return NextResponse.json(
        { error: 'ID du paiement et action requis' },
        { status: 400 }
      )
    }

    // Valid actions
    const validActions = ['verify', 'reject', 'refund', 'cancel']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide. Actions possibles: verify, reject, refund, cancel' },
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

    let updateData: Record<string, unknown> = {}
    let logAction = ''
    let logDetails: Record<string, unknown> = {}

    switch (action) {
      case 'verify':
        if (payment.status !== 'PENDING_VERIFICATION') {
          return NextResponse.json(
            { error: 'Ce paiement n\'est pas en attente de vérification' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'COMPLETED',
          paidAt: new Date(),
          notes: notes || payment.notes,
        }
        logAction = 'verified'
        logDetails = { verifiedBy: 'admin', verifiedAt: new Date().toISOString() }
        
        // Update order status
        await db.order.update({
          where: { id: payment.orderId },
          data: { status: 'CONFIRMED' }
        })
        break

      case 'reject':
        if (payment.status !== 'PENDING_VERIFICATION' && payment.status !== 'PROCESSING') {
          return NextResponse.json(
            { error: 'Ce paiement ne peut pas être rejeté' },
            { status: 400 }
          )
        }
        if (!rejectionReason) {
          return NextResponse.json(
            { error: 'Motif de rejet requis' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'FAILED',
          failureReason: rejectionReason,
          notes: notes || payment.notes,
        }
        logAction = 'rejected'
        logDetails = { 
          rejectedBy: 'admin', 
          reason: rejectionReason,
          rejectedAt: new Date().toISOString()
        }
        break

      case 'refund':
        if (payment.status !== 'COMPLETED') {
          return NextResponse.json(
            { error: 'Seuls les paiements complétés peuvent être remboursés' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'REFUNDED',
          notes: notes || payment.notes,
        }
        logAction = 'refund'
        logDetails = { 
          refundedBy: 'admin', 
          refundedAt: new Date().toISOString()
        }
        break

      case 'cancel':
        if (!['PENDING', 'PROCESSING'].includes(payment.status)) {
          return NextResponse.json(
            { error: 'Ce paiement ne peut pas être annulé' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'CANCELLED',
          notes: notes || payment.notes,
        }
        logAction = 'cancelled'
        logDetails = { cancelledBy: 'admin', cancelledAt: new Date().toISOString() }
        break
    }

    // Update payment
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: updateData
    })

    // Log action
    await db.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: logAction,
        details: JSON.stringify(logDetails),
        ipAddress: request.headers.get('x-forwarded-for') || 'admin',
        userAgent: request.headers.get('user-agent') || 'admin-panel',
      }
    })

    return NextResponse.json({
      success: true,
      message: `Paiement ${getActionMessage(action)} avec succès`,
      payment: updatedPayment,
    })
  } catch (error) {
    console.error('Admin Payments PATCH error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du paiement' },
      { status: 500 }
    )
  }
}

async function getPaymentStats() {
  const [
    totalCount,
    pendingCount,
    processingCount,
    completedCount,
    failedCount,
    verificationCount,
    totalAmount,
    completedAmount
  ] = await Promise.all([
    db.payment.count(),
    db.payment.count({ where: { status: 'PENDING' } }),
    db.payment.count({ where: { status: 'PROCESSING' } }),
    db.payment.count({ where: { status: 'COMPLETED' } }),
    db.payment.count({ where: { status: 'FAILED' } }),
    db.payment.count({ where: { status: 'PENDING_VERIFICATION' } }),
    db.payment.aggregate({ _sum: { amount: true } }),
    db.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
  ])

  return {
    total: totalCount,
    byStatus: {
      PENDING: pendingCount,
      PROCESSING: processingCount,
      COMPLETED: completedCount,
      FAILED: failedCount,
      PENDING_VERIFICATION: verificationCount,
    },
    amounts: {
      total: totalAmount._sum.amount || 0,
      completed: completedAmount._sum.amount || 0,
    },
  }
}

function getActionMessage(action: string): string {
  switch (action) {
    case 'verify': return 'vérifié et approuvé'
    case 'reject': return 'rejeté'
    case 'refund': return 'remboursé'
    case 'cancel': return 'annulé'
    default: return 'mis à jour'
  }
}

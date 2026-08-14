import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// POST: Upload bank receipt for bank transfer payment
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const paymentId = formData.get('paymentId') as string
    const notes = formData.get('notes') as string
    const receiptFile = formData.get('receipt') as File | null

    // Validate required fields
    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID du paiement requis' },
        { status: 400 }
      )
    }

    if (!receiptFile) {
      return NextResponse.json(
        { error: 'Reçu bancaire requis (image ou PDF)' },
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

    if (payment.status !== 'PROCESSING') {
      return NextResponse.json(
        { error: `Ce paiement ne peut pas recevoir de reçu (statut: ${payment.status})` },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(receiptFile.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF, WebP ou PDF' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB for bank receipts)
    if (receiptFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10 Mo)' },
        { status: 400 }
      )
    }

    // Create uploads directory if not exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'payments', 'bank-transfers')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = receiptFile.name.split('.').pop() || 'jpg'
    const fileName = `bank_receipt_${paymentId}_${timestamp}.${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // Save file
    const bytes = await receiptFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update payment record
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        receiptUrl: `/uploads/payments/bank-transfers/${fileName}`,
        status: 'PENDING_VERIFICATION',
        notes: notes || payment.notes,
      }
    })

    // Log transaction
    await db.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: 'pending_verification',
        details: JSON.stringify({
          receiptUrl: updatedPayment.receiptUrl,
          notes,
          step: 'receipt_uploaded',
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Reçu bancaire téléchargé avec succès. En attente de validation.',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        receiptUrl: updatedPayment.receiptUrl,
        referenceNumber: updatedPayment.referenceNumber,
      },
      nextSteps: [
        'Votre reçu a été reçu et est en cours de vérification',
        'Un administrateur validera le virement',
        'Vous recevrez une notification après validation',
        'Délai estimé: 1-2 jours ouvrables',
      ],
    })
  } catch (error) {
    console.error('Bank Upload error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement du reçu bancaire' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// POST: Confirm CCP payment with proof upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const paymentId = formData.get('paymentId') as string
    const notes = formData.get('notes') as string
    const proofFile = formData.get('proof') as File | null

    // Validate required fields
    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID du paiement requis' },
        { status: 400 }
      )
    }

    if (!proofFile) {
      return NextResponse.json(
        { error: 'Preuve de paiement requise (image ou PDF)' },
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

    if (payment.method !== 'CCP') {
      return NextResponse.json(
        { error: 'Cette méthode de paiement n\'est pas CCP' },
        { status: 400 }
      )
    }

    if (payment.status !== 'PROCESSING') {
      return NextResponse.json(
        { error: `Ce paiement ne peut pas être confirmé (statut: ${payment.status})` },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(proofFile.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou PDF' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (proofFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 5 Mo)' },
        { status: 400 }
      )
    }

    // Create uploads directory if not exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'payments', 'ccp')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = proofFile.name.split('.').pop() || 'jpg'
    const fileName = `ccp_proof_${paymentId}_${timestamp}.${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // Save file
    const bytes = await proofFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update payment record
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        receiptUrl: `/uploads/payments/ccp/${fileName}`,
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
          step: 'proof_uploaded',
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Preuve de paiement téléchargée avec succès. En attente de validation.',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        receiptUrl: updatedPayment.receiptUrl,
        ccpReference: updatedPayment.ccpReference,
      },
      nextSteps: [
        'Votre preuve a été reçue et est en cours de validation',
        'Vous recevrez une notification une fois validée',
        'Délai de validation: 1-2 jours ouvrables',
      ],
    })
  } catch (error) {
    console.error('CCP Confirm error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la confirmation du paiement CCP' },
      { status: 500 }
    )
  }
}

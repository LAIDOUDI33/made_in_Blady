// POST /api/payments/stripe/refund - Process a refund for a Stripe payment

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processRefund } from '@/lib/payments/stripe/client';
import type { StripeRefundRequest } from '@/lib/payments/stripe/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (must be admin or order owner)
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: StripeRefundRequest = await request.json();
    
    // Validate required fields
    if (!body.paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'paymentIntentId is required', errorCode: 'MISSING_PAYMENT_INTENT_ID' },
        { status: 400 }
      );
    }

    // Find the Stripe transaction
    const stripeTransaction = await db.stripeTransaction.findUnique({
      where: { paymentIntentId: body.paymentIntentId },
      include: {
        user: true,
        order: true,
      },
    });

    if (!stripeTransaction) {
      return NextResponse.json(
        { success: false, error: 'Stripe transaction not found', errorCode: 'TRANSACTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authorization check - only admin or transaction owner can refund
    const isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN';
    const isOwner = stripeTransaction.userId === session.user.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to process refund for this transaction', errorCode: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Check if transaction is eligible for refund
    if (stripeTransaction.status !== 'SUCCEEDED') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot refund transaction with status: ${stripeTransaction.status}. Only succeeded payments can be refunded.`,
          errorCode: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Check if already fully refunded
    if (stripeTransaction.refundedAt && !stripeTransaction.refundAmount) {
      // This shouldn't happen with proper logic, but just in case
      return NextResponse.json(
        { success: false, error: 'This transaction has already been fully refunded', errorCode: 'ALREADY_REFUNDED' },
        { status: 409 }
      );
    }

    // Process the refund through Stripe
    const refundResult = await processRefund({
      paymentIntentId: body.paymentIntentId,
      amount: body.amount, // If undefined, full refund
      reason: body.reason || 'requested_by_customer',
      metadata: {
        ...body.metadata,
        refundedBy: session.user.id,
        refundedByEmail: session.user.email || '',
        originalTransactionId: stripeTransaction.id,
      },
    });

    if (!refundResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: refundResult.error || 'Refund processing failed',
          errorCode: 'REFUND_FAILED' 
        },
        { status: 400 }
      );
    }

    // Update database record
    const updateData: Record<string, unknown> = {
      refundId: refundResult.refundId,
      rawEvent: JSON.stringify({
        ...JSON.parse(stripeTransaction.rawEvent || '{}'),
        refund: refundResult,
      }),
    };

    // Determine if full or partial refund
    const isFullRefund = !body.amount || body.amount >= stripeTransaction.convertedAmount;
    
    if (isFullRefund) {
      updateData.refundedAt = new Date();
      updateData.refundAmount = stripeTransaction.convertedAmount;
      updateData.refundReason = body.reason || 'requested_by_customer';
    } else {
      // For partial refunds, accumulate
      const currentRefundAmount = stripeTransaction.refundAmount || 0;
      updateData.refundAmount = currentRefundAmount + (refundResult.amount || 0);
      
      // If total refund amount equals or exceeds original, mark as fully refunded
      if (updateData.refundAmount >= stripeTransaction.convertedAmount) {
        updateData.refundedAt = new Date();
      }
    }

    await db.stripeTransaction.update({
      where: { id: stripeTransaction.id },
      data: updateData,
    });

    // Log the refund
    await db.transactionLog.create({
      data: {
        paymentId: stripeTransaction.id,
        action: 'stripe_refund_processed',
        details: JSON.stringify({
          refundId: refundResult.refundId,
          paymentIntentId: body.paymentIntentId,
          refundAmount: refundResult.amount,
          isFullRefund,
          reason: body.reason,
          processedBy: session.user.id,
        }),
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Create notification for the user
    if (!isOwner) {
      // Notify the original payer if someone else processed the refund
      await db.notification.create({
        data: {
          userId: stripeTransaction.userId,
          type: 'REFUND_PROCESSED',
          category: 'ORDER',
          title: isFullRefund ? 'Remboursement effectué' : 'Remboursement partiel',
          message: isFullRefund
            ? `Un remboursement complet de ${stripeTransaction.convertedAmount} ${stripeTransaction.targetCurrency} a été effectué pour votre commande.`
            : `Un remboursement partiel de ${refundResult.amount} ${refundResult.currency} a été effectué pour votre commande.`,
          data: JSON.stringify({
            transactionId: stripeTransaction.id,
            refundId: refundResult.refundId,
            orderId: stripeTransaction.orderId,
            amount: refundResult.amount,
            currency: refundResult.currency,
          }),
          actionUrl: `/orders/${stripeTransaction.orderId}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refundResult.refundId,
        status: refundResult.status,
        amount: refundResult.amount,
        currency: refundResult.currency,
        isFullRefund,
      },
      message: isFullRefund ? 'Full refund processed successfully' : 'Partial refund processed successfully',
    });

  } catch (error) {
    console.error('[Stripe Refund] Error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to process refund', errorCode: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// GET /api/payments/stripe/refund?transactionId=xxx - Get refund status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!transactionId && !paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'transactionId or paymentIntentId query parameter is required' },
        { status: 400 }
      );
    }

    // Find the transaction
    const whereClause: Record<string, string> = {};
    if (transactionId) whereClause.id = transactionId;
    if (paymentIntentId) whereClause.paymentIntentId = paymentIntentId;

    const stripeTransaction = await db.stripeTransaction.findFirst({
      where: whereClause,
    });

    if (!stripeTransaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: stripeTransaction.id,
        paymentIntentId: stripeTransaction.paymentIntentId,
        status: stripeTransaction.status,
        currency: stripeTransaction.targetCurrency,
        convertedAmount: stripeTransaction.convertedAmount,
        hasRefund: !!stripeTransaction.refundedAt,
        refundAmount: stripeTransaction.refundAmount,
        refundId: stripeTransaction.refundId,
        refundReason: stripeTransaction.refundReason,
        refundedAt: stripeTransaction.refundedAt?.toISOString(),
      },
    });

  } catch (error) {
    console.error('[Stripe Refund GET] Error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve refund information' },
      { status: 500 }
    );
  }
}

// Negotiation API Routes
// مسارات API للمفاوضات

import { NextRequest, NextResponse } from 'next/server';
import { 
  createOffer, 
  getNegotiationHistory,
  calculateBestDeal,
  type NegotiationType,
  type NegotiationStatus,
} from '@/lib/negotiation/engine';

/**
 * POST /api/negotiations - Create new negotiation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      productId,
      sellerId,
      buyerId,
      type,
      originalPrice,
      proposedPrice,
      quantity,
      deliveryDate,
      paymentTerms,
      message,
      orderId,
    } = body;

    // Validate required fields
    if (!productId || !sellerId || !buyerId || !type || !originalPrice || !proposedPrice) {
      return NextResponse.json(
        { success: false, errors: ['Missing required fields'] },
        { status: 400 }
      );
    }

    const result = await createOffer({
      productId,
      sellerId,
      buyerId,
      type: type as NegotiationType,
      originalPrice: Number(originalPrice),
      proposedPrice: Number(proposedPrice),
      quantity: quantity ? Number(quantity) : undefined,
      deliveryDate,
      paymentTerms,
      message,
      orderId,
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          errors: result.errors,
          warnings: result.warnings,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        negotiation: result.negotiation,
        offer: result.offer,
        autoAccepted: result.autoAccepted,
      },
      warnings: result.warnings,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating negotiation:', error);
    return NextResponse.json(
      { success: false, errors: ['Internal server error'] },
      { status: 500 }
    );
  }
}

/**
 * GET /api/negotiations - List negotiations with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') as NegotiationStatus | null;
    const type = searchParams.get('type') as NegotiationType | null;
    const page = parseInt(searchParams.get('page') ?? '1');
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

    if (!userId) {
      return NextResponse.json(
        { success: false, errors: ['userId is required'] },
        { status: 400 }
      );
    }

    const result = await getNegotiationHistory(userId, {
      status: status ?? undefined,
      type: type ?? undefined,
      page,
      pageSize,
    });

    // Calculate best deal from active negotiations
    const activeNegotiations = result.data.filter(n => 
      n.status === 'PENDING' || n.status === 'COUNTERED'
    );
    const bestDeal = calculateBestDeal(activeNegotiations);

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        bestDeal: bestDeal.bestNegotiation ? {
          negotiationId: bestDeal.bestNegotiation.id,
          savings: bestDeal.savings,
          savingsPercent: bestDeal.savingsPercent,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching negotiations:', error);
    return NextResponse.json(
      { success: false, errors: ['Internal server error'] },
      { status: 500 }
    );
  }
}

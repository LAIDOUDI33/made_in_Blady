// Counter-Offer API Route
// مسار API للعرض المضاد

import { NextRequest, NextResponse } from 'next/server';
import { createCounterOffer } from '@/lib/negotiation/engine';

/**
 * POST /api/negotiations/[id]/counter - Submit counter-offer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: negotiationId } = await params;
    const body = await request.json();
    
    const {
      offerId,
      fromUserId,
      price,
      quantity,
      deliveryDate,
      paymentTerms,
      message,
    } = body;

    // Validate required fields
    if (!offerId || !fromUserId) {
      return NextResponse.json(
        { success: false, errors: ['offerId and fromUserId are required'] },
        { status: 400 }
      );
    }

    const result = await createCounterOffer({
      negotiationId,
      offerId,
      fromUserId,
      price: price !== undefined ? Number(price) : undefined,
      quantity: quantity ? Number(quantity) : undefined,
      deliveryDate,
      paymentTerms,
      message,
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
        offer: result.offer,
        negotiation: result.negotiation,
      },
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Error creating counter-offer:', error);
    return NextResponse.json(
      { success: false, errors: ['Internal server error'] },
      { status: 500 }
    );
  }
}

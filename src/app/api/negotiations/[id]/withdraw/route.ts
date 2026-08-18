// Withdraw Offer API Route
// مسار API لسحب العرض

import { NextRequest, NextResponse } from 'next/server';
import { withdrawOffer } from '@/lib/negotiation/engine';

/**
 * POST /api/negotiations/[id]/withdraw - Withdraw an offer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: negotiationId } = await params;
    const body = await request.json();
    
    const { offerId, userId } = body;

    // Validate required fields
    if (!offerId || !userId) {
      return NextResponse.json(
        { success: false, errors: ['offerId and userId are required'] },
        { status: 400 }
      );
    }

    const result = await withdrawOffer(negotiationId, offerId, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Offer withdrawn successfully - تم سحب العرض بنجاح',
    });
  } catch (error) {
    console.error('Error withdrawing offer:', error);
    return NextResponse.json(
      { success: false, errors: ['Internal server error'] },
      { status: 500 }
    );
  }
}

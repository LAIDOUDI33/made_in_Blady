// Accept Offer API Route
// مسار API لقبول العرض

import { NextRequest, NextResponse } from 'next/server';
import { acceptOffer } from '@/lib/negotiation/engine';

/**
 * POST /api/negotiations/[id]/accept - Accept an offer
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

    const result = await acceptOffer(negotiationId, offerId, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        negotiation: result.negotiation,
        message: 'Offer accepted successfully - تم قبول العرض بنجاح',
      },
    });
  } catch (error) {
    console.error('Error accepting offer:', error);
    return NextResponse.json(
      { success: false, errors: ['Internal server error'] },
      { status: 500 }
    );
  }
}

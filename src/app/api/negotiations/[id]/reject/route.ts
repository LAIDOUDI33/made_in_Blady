// Reject Offer API Route
// مسار API لرفض العرض

import { NextRequest, NextResponse } from 'next/server';
import { rejectOffer } from '@/lib/negotiation/engine';

/**
 * POST /api/negotiations/[id]/reject - Reject an offer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: negotiationId } = await params;
    const body = await request.json();
    
    const { offerId, userId, reason } = body;

    // Validate required fields
    if (!offerId || !userId) {
      return NextResponse.json(
        { success: false, errors: ['offerId and userId are required'] },
        { status: 400 }
      );
    }

    const result = await rejectOffer(negotiationId, offerId, userId, reason);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Offer rejected successfully - تم رفض العرض بنجاح',
    });
  } catch (error) {
    console.error('Error rejecting offer:', error);
    return NextResponse.json(
      { success: false, errors: ['Internal server error'] },
      { status: 500 }
    );
  }
}

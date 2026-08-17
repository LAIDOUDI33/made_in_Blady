import { NextRequest, NextResponse } from 'next/server';
import {
  submitOffer,
  getNegotiationOffers,
} from '@/lib/negotiation';
import type { SubmitOfferParams } from '@/lib/negotiation';

// GET /api/negotiations/[id]/offers - Get all offers for a negotiation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const offers = await getNegotiationOffers(id);

    return NextResponse.json({
      success: true,
      data: offers,
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

// POST /api/negotiations/[id]/offers - Submit new offer/counter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: negotiationId } = await params;
    const body = await request.json();
    
    const offerParams: SubmitOfferParams = {
      fromUserId: body.fromUserId || 'demo-user-id',
      toUserId: body.toUserId || 'demo-other-user-id',
      fromRole: body.fromRole || 'BUYER',
      type: body.type || 'PRICE',
      originalPrice: body.originalPrice,
      offeredPrice: body.offeredPrice,
      quantity: body.quantity,
      deliveryDays: body.deliveryDays,
      paymentTerms: body.paymentTerms,
      specifications: body.specifications,
      notes: body.notes,
      validUntilHours: body.validUntilHours || 72,
    };

    const offer = await submitOffer(negotiationId, offerParams);

    return NextResponse.json({
      success: true,
      data: offer,
      message: 'Offer submitted successfully - تم تقديم العرض بنجاح',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting offer:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to submit offer - فشل في تقديم العرض' 
      },
      { status: 400 }
    );
  }
}

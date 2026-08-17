import { NextRequest, NextResponse } from 'next/server';
import {
  acceptOffer,
  rejectOffer,
  counterOffer,
} from '@/lib/negotiation';
import type { CounterOfferParams } from '@/lib/negotiation';

// POST /api/negotiations/[id]/offers/[offerId]/respond - Accept/Reject/Counter an offer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  try {
    const { id: negotiationId, offerId } = await params;
    const body = await request.json();
    const action = body.action; // 'accept', 'reject', 'counter'

    switch (action) {
      case 'accept': {
        const negotiation = await acceptOffer(negotiationId, offerId);
        return NextResponse.json({
          success: true,
          data: negotiation,
          message: 'Offer accepted! Negotiation complete. - تم قبول العرض! اكتملت المفاوضات.',
        });
      }

      case 'reject': {
        await rejectOffer(negotiationId, offerId, body.reason);
        return NextResponse.json({
          success: true,
          message: 'Offer rejected - تم رفض العرض',
        });
      }

      case 'counter': {
        const counterParams: CounterOfferParams = {
          fromUserId: body.fromUserId || 'demo-user-id',
          type: body.type || 'PRICE',
          originalPrice: body.originalPrice,
          offeredPrice: body.offeredPrice,
          quantity: body.quantity,
          deliveryDays: body.deliveryDays,
          paymentTerms: body.paymentTerms,
          specifications: body.specifications,
          notes: body.notes,
        };
        
        const newOffer = await counterOffer(negotiationId, offerId, counterParams);
        return NextResponse.json({
          success: true,
          data: newOffer,
          message: 'Counter-offer submitted - تم تقديم العرض المضاد',
        }, { status: 201 });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "accept", "reject", or "counter"' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error responding to offer:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process response' 
      },
      { status: 400 }
    );
  }
}

// Negotiation Detail API Route
// مسار API لتفاصيل المفاوضات

import { NextRequest, NextResponse } from 'next/server';
import { getNegotiationById } from '@/lib/negotiation/engine';

/**
 * GET /api/negotiations/[id] - Get negotiation details with history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const negotiation = await getNegotiationById(id);

    if (!negotiation) {
      return NextResponse.json(
        { success: false, errors: ['Negotiation not found'] },
        { status: 404 }
      );
    }

    // Calculate statistics
    const priceDrop = negotiation.originalPrice - negotiation.currentPrice;
    const savingsPercent = (priceDrop / negotiation.originalPrice) * 100;

    return NextResponse.json({
      success: true,
      data: {
        ...negotiation,
        statistics: {
          totalOffers: negotiation.offers.length,
          priceDrop,
          savingsPercent,
          daysActive: Math.ceil(
            (Date.now() - new Date(negotiation.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          ),
          timeRemaining: new Date(negotiation.expiresAt).getTime() - Date.now(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching negotiation:', error);
    return NextResponse.json(
      { success: false, errors: ['Internal server error'] },
      { status: 500 }
    );
  }
}

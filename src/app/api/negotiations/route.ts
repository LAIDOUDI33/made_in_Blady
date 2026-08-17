import { NextRequest, NextResponse } from 'next/server';
import {
  createNegotiation,
  getNegotiationHistory,
  checkExpiringNegotiations,
} from '@/lib/negotiation';
import type { CreateNegotiationParams } from '@/lib/negotiation';

// GET /api/negotiations - List user's negotiations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // For demo purposes, using a mock user ID
    // In production, get from auth session
    const userId = searchParams.get('userId') || 'demo-user-id';
    
    const filters = {
      status: searchParams.get('status') as any || undefined,
      type: searchParams.get('type') as any || undefined,
      productId: searchParams.get('productId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    };

    const result = await getNegotiationHistory(userId, filters);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching negotiations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch negotiations' },
      { status: 500 }
    );
  }
}

// POST /api/negotiations - Start new negotiation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const params: CreateNegotiationParams = {
      productId: body.productId,
      orderId: body.orderId,
      rfqId: body.rfqId,
      buyerId: body.buyerId || 'demo-buyer-id',
      sellerId: body.sellerId || 'demo-seller-id',
      initiatorId: body.initiatorId || 'demo-user-id',
      type: body.type || 'PRICE',
      initialOffer: body.initialOffer ? {
        originalPrice: body.initialOffer.originalPrice,
        offeredPrice: body.initialOffer.offeredPrice,
        quantity: body.initialOffer.quantity,
        deliveryDays: body.initialOffer.deliveryDays,
        paymentTerms: body.initialOffer.paymentTerms,
        specifications: body.initialOffer.specifications,
        notes: body.initialOffer.notes,
      } : undefined,
      settings: body.settings ? {
        maxDuration: body.settings.maxDuration,
        autoAcceptThreshold: body.settings.autoAcceptThreshold,
        isPrivate: body.settings.isPrivate,
        allowCounterOffer: body.settings.allowCounterOffer,
      } : undefined,
    };

    const negotiation = await createNegotiation(params);

    return NextResponse.json({
      success: true,
      data: negotiation,
      message: 'Negotiation created successfully - تم إنشاء المفاوضات بنجاح',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating negotiation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create negotiation - فشل في إنشاء المفاوضات' 
      },
      { status: 400 }
    );
  }
}

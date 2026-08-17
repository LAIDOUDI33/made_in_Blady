import { NextRequest, NextResponse } from 'next/server';
import {
  getNegotiationById,
  withdrawNegotiation,
} from '@/lib/negotiation';

// GET /api/negotiations/[id] - Get negotiation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const negotiation = await getNegotiationById(id);

    if (!negotiation) {
      return NextResponse.json(
        { success: false, error: 'Negotiation not found - المفاوضات غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: negotiation,
    });
  } catch (error) {
    console.error('Error fetching negotiation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch negotiation' },
      { status: 500 }
    );
  }
}

// POST /api/negotiations/[id]/withdraw - Withdraw/End negotiation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (body.action === 'withdraw') {
      await withdrawNegotiation(id);
      
      return NextResponse.json({
        success: true,
        message: 'Negotiation withdrawn successfully - تم سحب المفاوضات بنجاح',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating negotiation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update negotiation' 
      },
      { status: 400 }
    );
  }
}

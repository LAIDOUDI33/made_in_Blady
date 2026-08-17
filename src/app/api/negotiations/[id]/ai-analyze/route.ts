import { NextRequest, NextResponse } from 'next/server';
import {
  getAIOfferAnalysis,
  getAICounterSuggestion,
} from '@/lib/negotiation';

// POST /api/negotiations/[id]/ai-analyze - Get AI analysis for negotiation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: negotiationId } = await params;
    const body = await request.json();
    const type = body.type; // 'offer' | 'suggestion' | 'tips' | 'risk'

    switch (type) {
      case 'offer': {
        // Analyze a specific offer
        if (!body.offerId) {
          return NextResponse.json(
            { success: false, error: 'offerId is required for offer analysis' },
            { status: 400 }
          );
        }
        
        const analysis = await getAIOfferAnalysis(body.offerId);
        return NextResponse.json({
          success: true,
          data: analysis,
          message: 'AI analysis completed - اكتمل التحليل بالذكاء الاصطناعي',
        });
      }

      case 'suggestion': {
        // Get counter-offer suggestion for entire negotiation
        const suggestion = await getAICounterSuggestion(negotiationId);
        return NextResponse.json({
          success: true,
          data: suggestion,
          message: 'AI suggestion generated - تم توليد اقتراح الذكاء الاصطناعي',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid analysis type. Use "offer" or "suggestion"' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to perform AI analysis - فشل في إجراء تحليل الذكاء الاصطناعي' 
      },
      { status: 500 }
    );
  }
}

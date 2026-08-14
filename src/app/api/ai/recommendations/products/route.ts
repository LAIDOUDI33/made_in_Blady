// API Route: Get product recommendations for current user
import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '@/lib/ai/recommendations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get user ID from query (in real app, would come from session/auth)
    const userId = searchParams.get('userId') || undefined;
    const context = (searchParams.get('context') as any) || 'homepage';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const itemId = searchParams.get('itemId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    // Validate context
    const validContexts = ['homepage', 'product_detail', 'category', 'search', 'cart', 'checkout'];
    if (!validContexts.includes(context)) {
      return NextResponse.json(
        { error: 'Invalid context. Must be one of: ' + validContexts.join(', ') },
        { status: 400 }
      );
    }

    // Validate limit
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    const recommendations = await recommendationEngine.getRecommendations({
      userId,
      type: 'products',
      limit,
      context,
      itemId,
      categoryId,
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
        context,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

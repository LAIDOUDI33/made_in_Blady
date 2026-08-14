// API Route: Get trending items (public endpoint - no auth required)
import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '@/lib/ai/recommendations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const type = (searchParams.get('type') as 'products' | 'suppliers' | 'categories') || 'products';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const period = parseInt(searchParams.get('period') || '24', 10); // hours

    // Validate type
    const validTypes = ['products', 'suppliers', 'categories'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: ' + validTypes.join(', ') },
        { status: 400 }
      );
    }

    // Validate period
    if (period < 1 || period > 168) { // Max 7 days
      return NextResponse.json(
        { error: 'Period must be between 1 and 168 hours' },
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

    const trending = await recommendationEngine.getTrending(type, limit);

    return NextResponse.json({
      success: true,
      data: {
        trending,
        count: trending.length,
        type,
        periodHours: period,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting trending items:', error);
    return NextResponse.json(
      { error: 'Failed to get trending items' },
      { status: 500 }
    );
  }
}

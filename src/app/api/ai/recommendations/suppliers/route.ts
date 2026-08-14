// API Route: Get supplier recommendations for current user
import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '@/lib/ai/recommendations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get user ID from query
    const userId = searchParams.get('userId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Validate limit
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    const recommendations = await recommendationEngine.getRecommendations({
      userId,
      type: 'suppliers',
      limit,
      context: 'homepage',
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting supplier recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get supplier recommendations' },
      { status: 500 }
    );
  }
}

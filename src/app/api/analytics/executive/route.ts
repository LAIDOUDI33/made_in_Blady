import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine } from '@/lib/analytics/engine';

/**
 * GET /api/analytics/executive
 * Executive KPIs endpoint - returns key performance indicators for the dashboard
 * 
 * Query params:
 * - forceRefresh: boolean - bypass cache and regenerate data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    const kpiData = await analyticsEngine.getExecutiveKPIs(forceRefresh);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: kpiData,
      meta: {
        totalMetrics: kpiData.length,
        generatedAt: new Date().toISOString(),
        cacheStatus: forceRefresh ? 'bypassed' : 'cached'
      }
    });
  } catch (error) {
    console.error('Error fetching executive KPIs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch executive KPIs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

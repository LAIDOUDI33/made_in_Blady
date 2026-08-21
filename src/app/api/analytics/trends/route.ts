import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine } from '@/lib/analytics/engine';

/**
 * GET /api/analytics/trends
 * Historical trends and time series data
 * 
 * Query params:
 * - months: number of months to retrieve (default: 12)
 * - metrics: comma-separated list of metrics (optional)
 * - forceRefresh: boolean
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');
    const metricsParam = searchParams.get('metrics');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    // Validate months parameter
    if (months < 1 || months > 60) {
      return NextResponse.json(
        { success: false, error: 'Months must be between 1 and 60' },
        { status: 400 }
      );
    }
    
    const trends = await analyticsEngine.getHistoricalTrends(months);
    
    // Filter by specific metrics if provided
    let filteredTrends = trends;
    if (metricsParam) {
      const requestedMetrics = metricsParam.split(',');
      filteredTrends = Object.fromEntries(
        Object.entries(trends).filter(([key]) => requestedMetrics.includes(key))
      );
    }
    
    // Calculate growth rates for each metric
    const growthRates: Record<string, number> = {};
    Object.entries(filteredTrends).forEach(([metric, data]) => {
      if (data.length >= 2) {
        const firstValue = data[0].value;
        const lastValue = data[data.length - 1].value;
        if (firstValue !== 0) {
          growthRates[metric] = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
        }
      }
    });
    
    // Generate projections for next quarter
    const projections: Record<string, number[]> = {};
    Object.entries(filteredTrends).forEach(([metric, data]) => {
      if (data.length >= 3) {
        const recentValues = data.slice(-3).map(d => d.value);
        const avgGrowth = recentValues.reduce((acc, val, i) => {
          if (i === 0) return 0;
          return acc + ((val - recentValues[i-1]) / Math.abs(recentValues[i-1])) * 100;
        }, 0) / 2;
        
        projections[metric] = [1, 2, 3].map(month => {
          const lastValue = data[data.length - 1].value;
          return Math.round(lastValue * (1 + (avgGrowth / 100) * month) * 100) / 100;
        });
      }
    });
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: filteredTrends,
      analysis: {
        growthRates,
        projections,
        period: `${months} months`,
        dataPointsPerMetric: Object.values(filteredTrends)[0]?.length || 0
      },
      meta: {
        months,
        availableMetrics: Object.keys(filteredTrends),
        cacheStatus: forceRefresh ? 'bypassed' : 'cached'
      }
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trends data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

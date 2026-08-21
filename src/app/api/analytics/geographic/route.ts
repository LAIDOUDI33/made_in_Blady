import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine } from '@/lib/analytics/engine';

/**
 * GET /api/analytics/geographic
 * Wilaya-level geographic analytics data
 * 
 * Query params:
 * - sortBy: field to sort by (transactions, revenue, companies, users, growth)
 * - sortOrder: asc | desc
 * - region: filter by region
 * - topN: return only top N results
 * - forceRefresh: boolean
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'revenue';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const region = searchParams.get('region');
    const topN = parseInt(searchParams.get('topN') || '58');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    let wilayaData = await analyticsEngine.getWilayaAnalytics(forceRefresh);
    
    // Filter by region if specified
    if (region && region !== 'all') {
      wilayaData = wilayaData.filter(w => 
        w.region.toLowerCase().includes(region.toLowerCase())
      );
    }
    
    // Sort data
    const sortFieldMap: Record<string, (w: typeof wilayaData[0]) => number> = {
      transactions: w => w.totalTransactions,
      revenue: w => w.totalRevenue,
      companies: w => w.activeCompanies,
      users: w => w.activeUsers,
      growth: w => w.growthRate,
      marketShare: w => w.marketShare
    };
    
    const sortFn = sortFieldMap[sortBy];
    if (sortFn) {
      wilayaData.sort((a, b) => {
        const aVal = sortFn(a);
        const bVal = sortFn(b);
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }
    
    // Limit results
    const limitedData = topN > 0 ? wilayaData.slice(0, topN) : wilayaData;
    
    // Calculate regional aggregates
    const regionalAggregates = calculateRegionalAggregates(wilayaData);
    
    // Identify top performers
    const topPerformers = {
      byRevenue: [...wilayaData].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5),
      byGrowth: [...wilayaData].sort((a, b) => b.growthRate - a.growthRate).slice(0, 5),
      byCompanies: [...wilayaData].sort((a, b) => b.activeCompanies - a.activeCompanies).slice(0, 5)
    };
    
    // Market concentration analysis
    const totalRevenue = wilayaData.reduce((sum, w) => sum + w.totalRevenue, 0);
    const top5RevenueShare = wilayaData
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)
      .reduce((sum, w) => sum + w.totalRevenue, 0) / totalRevenue * 100;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: limitedData,
      summary: {
        totalWilayas: limitedData.length,
        totalTransactions: wilayaData.reduce((sum, w) => sum + w.totalTransactions, 0),
        totalRevenue: wilayaData.reduce((sum, w) => sum + w.totalRevenue, 0),
        totalActiveCompanies: wilayaData.reduce((sum, w) => sum + w.activeCompanies, 0),
        totalActiveUsers: wilayaData.reduce((sum, w) => sum + w.activeUsers, 0),
        averageOrderValue: Math.round(
          wilayaData.reduce((sum, w) => sum + w.totalRevenue, 0) / 
          wilayaData.reduce((sum, w) => sum + w.totalTransactions, 1)
        ),
        top5MarketConcentration: Math.round(top5RevenueShare * 100) / 100
      },
      regionalBreakdown: regionalAggregates,
      topPerformers,
      meta: {
        sortBy,
        sortOrder,
        regionFilter: region || 'none',
        limit: topN
      }
    });
  } catch (error) {
    console.error('Error fetching geographic data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch geographic analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function calculateRegionalAggregates(wilayaData: Awaited<ReturnType<typeof analyticsEngine.getWilayaAnalytics>>) {
  const regions: Record<string, { count: number; revenue: number; transactions: number; companies: number; users: number }> = {};
  
  wilayaData.forEach(w => {
    if (!regions[w.region]) {
      regions[w.region] = { count: 0, revenue: 0, transactions: 0, companies: 0, users: 0 };
    }
    regions[w.region].count++;
    regions[w.region].revenue += w.totalRevenue;
    regions[w.region].transactions += w.totalTransactions;
    regions[w.region].companies += w.activeCompanies;
    regions[w.region].users += w.activeUsers;
  });
  
  return Object.entries(regions).map(([region, data]) => ({
    region,
    wilayaCount: data.count,
    totalRevenue: data.revenue,
    totalTransactions: data.transactions,
    activeCompanies: data.companies,
    activeUsers: data.users,
    avgOrderValue: Math.round(data.revenue / Math.max(data.transactions, 1))
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

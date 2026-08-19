import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine } from '@/lib/analytics/engine';

/**
 * GET /api/analytics/export
 * Export analytics data in various formats
 * 
 * Query params:
 * - format: csv | excel | pdf
 * - type: kpis | wilaya | sector | cohort | funnel | trends | activity
 * - filters: JSON string with filter criteria
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const type = searchParams.get('type') || 'kpis';
    const filtersStr = searchParams.get('filters');
    
    let data: unknown[] = [];
    let filename = `algeriatrade_${type}_export`;
    
    // Gather data based on type
    switch (type) {
      case 'kpis': {
        const kpis = await analyticsEngine.getExecutiveKPIs(true);
        data = kpis.map(kpi => ({
          metric_id: kpi.metricId,
          current_value: kpi.currentValue,
          previous_value: kpi.previousValue,
          change_percent: kpi.changePercent,
          change_direction: kpi.changeDirection
        }));
        break;
      }
      
      case 'wilaya': {
        const wilayaData = await analyticsEngine.getWilayaAnalytics(true);
        data = wilayaData.map(w => ({
          code: w.code,
          name: w.name,
          name_ar: w.nameAr,
          region: w.region,
          total_transactions: w.totalTransactions,
          total_revenue: w.totalRevenue,
          active_companies: w.activeCompanies,
          active_users: w.activeUsers,
          avg_order_value: w.avgOrderValue,
          growth_rate: w.growthRate,
          market_share: w.marketShare
        }));
        break;
      }
      
      case 'sector': {
        const sectorData = await analyticsEngine.getSectorAnalytics(true);
        data = sectorData.map(s => ({
          id: s.id,
          name: s.name,
          name_ar: s.nameAr,
          total_revenue: s.totalRevenue,
          transaction_count: s.transactionCount,
          company_count: s.companyCount,
          growth_rate: s.growthRate,
          market_share: s.marketShare
        }));
        break;
      }
      
      case 'cohort': {
        const cohortData = await analyticsEngine.getCohortAnalysis();
        data = cohortData.flatMap(c => 
          c.retentionRates.map(r => ({
            cohort: c.cohort,
            cohort_size: c.cohortSize,
            month: r.month,
            retention_rate: r.rate
          }))
        );
        break;
      }
      
      case 'funnel': {
        const funnelData = await analyticsEngine.getFunnelData();
        data = funnelData.map(f => ({
          stage: f.stage,
          label: f.label,
          count: f.count,
          percentage: f.percentage,
          dropoff: f.dropoff
        }));
        break;
      }
      
      case 'trends': {
        const trendData = await analyticsEngine.getHistoricalTrends(12);
        data = Object.entries(trendData).flatMap(([metric, points]) =>
          points.map(p => ({ metric, ...p }))
        );
        break;
      }
      
      case 'activity': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const activityData = await analyticsEngine.getActivityFeed(limit);
        data = activityData.map(a => ({
          id: a.id,
          type: a.type,
          title: a.title,
          company: a.company,
          wilaya_code: a.wilayaCode,
          amount: a.amount,
          timestamp: a.timestamp.toISOString()
        }));
        break;
      }
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown export type: ${type}` },
          { status: 400 }
        );
    }
    
    // Apply filters if provided
    if (filtersStr) {
      try {
        const filters = JSON.parse(filtersStr);
        data = data.filter(item => {
          return Object.entries(filters).every(([key, value]) => {
            const itemVal = (item as Record<string, unknown>)[key];
            if (Array.isArray(value)) return value.includes(itemVal);
            return itemVal === value;
          });
        });
      } catch {
        // Invalid filters, ignore
      }
    }
    
    // Export in requested format
    let exportResult;
    switch (format) {
      case 'csv':
        exportResult = await analyticsEngine.exportToCSV(data, filename);
        break;
      case 'excel':
        exportResult = await analyticsEngine.exportToExcel(data, filename);
        break;
      case 'pdf':
        exportResult = {
          success: true,
          filename: `${filename}.pdf`,
          downloadUrl: `/api/analytics/download/${filename}.pdf`,
          recordCount: data.length,
          generatedAt: new Date(),
          format: 'pdf'
        };
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unsupported format: ${format}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      export: exportResult,
      preview: data.slice(0, 5), // Return first 5 records as preview
      meta: {
        totalRecords: data.length,
        format,
        type,
        exportedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/export
 * Export custom report data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, format = 'csv', filename } = body;
    
    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: 'Data array is required' },
        { status: 400 }
      );
    }
    
    let exportResult;
    switch (format) {
      case 'csv':
        exportResult = await analyticsEngine.exportToCSV(data, filename);
        break;
      case 'excel':
        exportResult = await analyticsEngine.exportToExcel(data, filename);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unsupported format: ${format}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ success: true, export: exportResult });
  } catch (error) {
    console.error('Error exporting custom data:', error);
    return NextResponse.json(
      { success: false, error: 'Export failed' },
      { status: 500 }
    );
  }
}

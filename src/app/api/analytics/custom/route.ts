import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine, ReportConfig } from '@/lib/analytics/engine';

/**
 * GET /api/analytics/custom
 * Get available metrics and report configuration options
 */
export async function GET() {
  try {
    const metrics = analyticsEngine.getAllMetrics();
    const wilayas = analyticsEngine.getWilayas();
    const sectors = analyticsEngine.getSectors();
    
    return NextResponse.json({
      success: true,
      data: {
        metrics,
        wilayas,
        sectors,
        chartTypes: ['bar', 'line', 'pie', 'scatter', 'heatmap', 'area'],
        dimensions: ['wilaya', 'sector', 'companySize', 'time'],
        exportFormats: ['csv', 'excel', 'pdf'],
        scheduleFrequencies: ['daily', 'weekly', 'monthly', 'quarterly']
      }
    });
  } catch (error) {
    console.error('Error fetching custom report config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/custom
 * Build and run a custom report based on configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.metrics || !Array.isArray(body.metrics)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, metrics (array)' },
        { status: 400 }
      );
    }
    
    // Build report configuration
    const config: ReportConfig = {
      id: body.id || `report_${Date.now()}`,
      name: body.name,
      description: body.description || '',
      metrics: body.metrics,
      dimensions: body.dimensions || ['time'],
      dateRange: {
        start: new Date(body.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(body.endDate || Date.now()),
        compareStart: body.compareStartDate ? new Date(body.compareStartDate) : undefined,
        compareEnd: body.compareEndDate ? new Date(body.compareEndDate) : undefined
      },
      chartType: body.chartType || 'bar',
      filters: body.filters || {},
      scheduledExport: body.scheduledExport,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: body.createdBy || 'system'
    };
    
    // Generate the report
    const result = await analyticsEngine.buildCustomReport(config);
    
    return NextResponse.json({
      success: result.success,
      data: result,
      config
    });
  } catch (error) {
    console.error('Error building custom report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to build custom report',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

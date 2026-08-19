import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine, ScheduleConfig, ReportConfig } from '@/lib/analytics/engine';

// In-memory storage for scheduled reports (in production, use database)
const scheduledReportsStore: Map<string, { config: ReportConfig; schedule: ScheduleConfig; createdAt: Date }> = new Map();

/**
 * GET /api/analytics/reports/scheduled
 * List all scheduled reports
 */
export async function GET() {
  try {
    const jobs = analyticsEngine.getScheduledReports();
    
    // Enrich with stored configurations
    const enrichedJobs = jobs.map(job => {
      const stored = scheduledReportsStore.get(job.reportId);
      return {
        ...job,
        config: stored?.config,
        createdAt: stored?.createdAt
      };
    });
    
    return NextResponse.json({
      success: true,
      data: enrichedJobs,
      meta: {
        total: enrichedJobs.length,
        active: enrichedJobs.filter(j => j.config?.scheduledExport?.enabled).length
      }
    });
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduled reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/reports/scheduled
 * Create or update a scheduled report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.metrics || !body.schedule) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, metrics, schedule' },
        { status: 400 }
      );
    }
    
    const reportId = body.id || `scheduled_${Date.now()}`;
    
    const scheduleConfig: ScheduleConfig = {
      enabled: body.schedule.enabled ?? true,
      frequency: body.schedule.frequency || 'weekly',
      time: body.schedule.time || '08:00',
      dayOfWeek: body.schedule.dayOfWeek,
      dayOfMonth: body.schedule.dayOfMonth,
      recipients: body.schedule.recipients || [],
      format: body.schedule.format || 'pdf'
    };
    
    const reportConfig: ReportConfig = {
      id: reportId,
      name: body.name,
      description: body.description || '',
      metrics: body.metrics,
      dimensions: body.dimensions || ['time'],
      dateRange: {
        start: new Date(body.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(body.endDate || Date.now())
      },
      chartType: body.chartType || 'bar',
      scheduledExport: scheduleConfig,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: body.createdBy || 'admin'
    };
    
    // Store the configuration
    scheduledReportsStore.set(reportId, {
      config: reportConfig,
      schedule: scheduleConfig,
      createdAt: new Date()
    });
    
    // Schedule the report
    analyticsEngine.scheduleReport(reportId, scheduleConfig);
    
    return NextResponse.json({
      success: true,
      data: {
        reportId,
        config: reportConfig,
        nextRunAt: analyticsEngine.getScheduledReports().find(r => r.reportId === reportId)?.nextRunAt
      },
      message: 'Scheduled report created successfully'
    });
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create scheduled report',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/analytics/reports/scheduled
 * Update an existing scheduled report
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, ...updates } = body;
    
    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'reportId is required' },
        { status: 400 }
      );
    }
    
    const existing = scheduledReportsStore.get(reportId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Scheduled report not found' },
        { status: 404 }
      );
    }
    
    // Update configuration
    const updatedConfig: ReportConfig = {
      ...existing.config,
      ...updates,
      id: reportId,
      updatedAt: new Date()
    };
    
    const updatedSchedule: ScheduleConfig = {
      ...existing.schedule,
      ...(updates.schedule || {})
    };
    
    scheduledReportsStore.set(reportId, {
      config: updatedConfig,
      schedule: updatedSchedule,
      createdAt: existing.createdAt
    });
    
    // Re-schedule with updated config
    analyticsEngine.scheduleReport(reportId, updatedSchedule);
    
    return NextResponse.json({
      success: true,
      data: {
        reportId,
        config: updatedConfig,
        schedule: updatedSchedule
      },
      message: 'Scheduled report updated successfully'
    });
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update scheduled report' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/reports/scheduled?reportId=xxx
 * Delete/cancel a scheduled report
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    
    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'reportId query parameter is required' },
        { status: 400 }
      );
    }
    
    const existing = scheduledReportsStore.get(reportId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Scheduled report not found' },
        { status: 404 }
      );
    }
    
    // Unschedule and remove
    analyticsEngine.unscheduleReport(reportId);
    scheduledReportsStore.delete(reportId);
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete scheduled report' },
      { status: 500 }
    );
  }
}

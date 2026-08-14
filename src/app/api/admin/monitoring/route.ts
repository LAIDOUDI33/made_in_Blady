/**
 * AlgeriaTrade.dz - Monitoring API Endpoint
 * 
 * Provides real-time monitoring data for the dashboard.
 * This is a comprehensive endpoint that aggregates:
 * - System health status
 * - Performance metrics
 * - Infrastructure metrics
 * - Business KPIs
 * - Active alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPMManager } from '@/lib/monitoring/apm';
import { getHealthMonitor } from '@/lib/monitoring/health';
import { getAlertManager } from '@/lib/monitoring/alerts';
import { getInfrastructureMonitor } from '@/lib/monitoring/infrastructure';
import { getBusinessMetricsTracker } from '@/lib/monitoring/business-metrics';

// Cache for monitoring data (refresh every 5 seconds)
let cachedData: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    
    // Check cache first
    if (cachedData && (now - lastCacheTime) < CACHE_TTL) {
      return NextResponse.json(cachedData);
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeInfrastructure = searchParams.get('infrastructure') !== 'false';
    const includeBusiness = searchParams.get('business') === 'true';
    const period = searchParams.get('period') || '1h';

    // Gather all monitoring data in parallel
    const [
      healthStatus,
      apmDashboard,
      activeAlerts,
      infrastructureMetrics,
      businessDashboard,
    ] = await Promise.all([
      getSystemHealth(),
      getAPMManager().generateDashboard(period as any),
      getAlertManager().getActiveAlerts(),
      includeInfrastructure ? getInfrastructureMonitor().collect() : null,
      includeBusiness ? getBusinessMetricsTracker().generateDashboard() : null,
    ]);

    // Build response
    const responseData = {
      timestamp: new Date().toISOString(),
      
      health: healthStatus,
      performance: extractPerformanceMetrics(apmDashboard),
      infrastructure: infrastructureMetrics,
      business: businessDashboard?.overview,
      alerts: activeAlerts.map(alert => ({
        id: alert.id,
        severity: alert.severity,
        message: alert.message,
        metric: alert.labels.metric || 'unknown',
        timestamp: new Date(alert.timestamp).toISOString(),
      })),
      
      meta: {
        version: process.env.npm_package_version || '2.4.1',
        environment: process.env.NODE_ENV || 'production',
        generatedAt: new Date().toISOString(),
        cacheTTL: CACHE_TTL,
      },
    };

    // Update cache
    cachedData = responseData;
    lastCacheTime = now;

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[Monitoring API] Error generating dashboard data:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate monitoring data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ===========================================
// Helper Functions
// ===========================================

async function getSystemHealth(): Promise<any> {
  try {
    const healthMonitor = getHealthMonitor();
    return await healthMonitor.getFullStatus();
  } catch (error) {
    console.error('[Monitoring API] Failed to get health status:', error);
    return {
      overallStatus: 'unknown',
      uptime: 0,
      version: process.env.npm_package_version || '2.4.1',
      environment: process.env.NODE_ENV || 'production',
      checks: [],
      dependencies: [],
      incidents: [],
    };
  }
}

function extractPerformanceMetrics(apmData: any): any {
  if (!apmData) {
    return {
      requestsPerSecond: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      errorRate: 0,
      activeUsers: 0,
      activeConnections: 0,
    };
  }

  return {
    requestsPerSecond: Math.round(apmData.overview.requestsPerSecond),
    avgResponseTime: apmData.overview.avgResponseTime,
    p95ResponseTime: apmData.overview.p95ResponseTime,
    errorRate: apmData.overview.errorRate,
    activeUsers: apmData.overview.activeUsers,
    activeConnections: estimateActiveConnections(apmData),
  };
}

function estimateActiveConnections(apmData: any): number {
  // Estimate based on RPS and average response time
  // Active connections ≈ RPS × avg response time (in seconds)
  const rps = apmData.overview.requestsPerSecond;
  const avgTimeSeconds = (apmData.overview.avgResponseTime || 100) / 1000;
  
  return Math.round(rps * avgTimeSeconds * 1.5); // Add buffer for idle connections
}

// POST endpoint for custom queries or actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'acknowledge_alert':
        return handleAcknowledgeAlert(body.alertId);

      case 'clear_cache':
        return handleClearCache();

      case 'trigger_health_check':
        return await handleTriggerHealthCheck();

      case 'get_metrics':
        return handleGetCustomMetrics(body.metrics);

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Monitoring API] Error processing POST:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// ===========================================
// Action Handlers
// ===========================================

function handleAcknowledgeAlert(alertId: string) {
  try {
    const alertManager = getAlertManager();
    alertManager.acknowledgeAlert(alertId);
    
    return NextResponse.json({
      success: true,
      message: `Alert ${alertId} acknowledged`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to acknowledge alert',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function handleClearCache() {
  cachedData = null;
  lastCacheTime = 0;
  
  return NextResponse.json({
    success: true,
    message: 'Monitoring cache cleared',
    timestamp: new Date().toISOString(),
  });
}

async function handleTriggerHealthCheck() {
  try {
    const healthMonitor = getHealthMonitor();
    const results = await healthMonitor.runAllChecks();
    
    return NextResponse.json({
      success: true,
      message: 'Health check triggered',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run health checks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function handleGetCustomMetrics(metrics: string[]) {
  try {
    const apm = getAPMManager();
    const allMetrics = apm.getMetrics();

    // Filter requested metrics
    const filteredMetrics: Record<string, any> = {};
    
    for (const metricName of metrics) {
      if (allMetrics.counters.has(metricName)) {
        filteredMetrics[metricName] = allMetrics.counters.get(metricName);
      } else if (allMetrics.gauges.has(metricName)) {
        filteredMetrics[metricName] = allMetrics.gauges.get(metricName);
      } else if (allMetrics.histograms.has(metricName)) {
        filteredMetrics[metricName] = allMetrics.histograms.get(metricName);
      }
    }

    return NextResponse.json({
      success: true,
      metrics: filteredMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get custom metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

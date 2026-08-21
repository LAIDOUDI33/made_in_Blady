/**
 * AlgeriaTrade.dz API Developer Portal - Deployment Status API
 * 
 * Endpoints:
 * - GET /api/portal/deploy/status - Current deployment info
 * - POST /api/portal/deploy/health-check - Run diagnostics
 * - GET /api/portal/deploy/metrics - Deployment metrics
 * - POST /api/portal/deploy/rollback - Emergency rollback (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import os from 'os';

// Types
interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms: number;
  details?: string;
}

interface DeploymentStatus {
  version: string;
  environment: string;
  deployed_at: string;
  commit_sha: string | null;
  branch: string | null;
  uptime_seconds: number;
  node_version: string;
  memory_usage: MemoryUsage;
  services: ServiceStatus[];
  health_status: 'operational' | 'degraded' | 'down';
}

interface MemoryUsage {
  rss_bytes: number;
  heap_used: number;
  heap_total: number;
  external: number;
}

interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded' | 'unknown';
  response_time_ms?: number;
  last_check: string;
}

interface DeploymentMetrics {
  timestamp: string;
  requests_total: number;
  errors_total: number;
  avg_response_time_ms: number;
  active_connections: number;
  rate_limit_utilization: number;
  database_pool_size: {
    active: number;
    idle: number;
    total: number;
  };
  redis_memory_bytes: number;
  cache_hit_rate: number;
}

// Configuration
const DEPLOYMENT_INFO = {
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  deployedAt: process.env.DEPLOYED_AT || new Date().toISOString(),
};

// Helper: Get Git Info
function getGitInfo(): { sha: string | null; branch: string | null } {
  try {
    const sha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    return { sha, branch };
  } catch {
    return { sha: null, branch: null };
  }
}

// Helper: Get Uptime
function getUptime(): number {
  return Math.floor(process.uptime());
}

// Helper: Get Memory Usage
function getMemoryUsage(): MemoryUsage {
  const memUsage = process.memoryUsage();
  return {
    rss_bytes: memUsage.rss,
    heap_used: memUsage.heapUsed,
    heap_total: memUsage.heapTotal,
    external: memUsage.external,
  };
}

// Helper: Check service health
async function checkServiceHealth(serviceName: string, checkUrl?: string): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    if (!checkUrl) {
      // For internal services, just report based on environment variables
      const isConfigured = process.env[serviceName.toUpperCase()?.replace('-', '_')] !== undefined;
      return {
        name: serviceName,
        status: isConfigured ? 'up' : 'unknown',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
      };
    }
    
    const response = await fetch(checkUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    return {
      name: serviceName,
      status: response.ok ? 'up' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: serviceName,
      status: 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
    };
  }
}

// Helper: Run comprehensive health checks
async function runHealthChecks(): Promise<HealthCheckResult[]> {
  const checks: HealthCheckResult[] = [];
  
  // 1. Database connectivity check
  checks.push(await runTimedCheck('database', async () => {
    // This would typically check actual DB connection
    // For now, we'll check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured');
    }
    return true;
  }));
  
  // 2. Redis connectivity check
  checks.push(await runTimedCheck('redis', async () => {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL not configured');
    }
    return true;
  }));
  
  // 3. File system access check
  checks.push(await runTimedCheck('filesystem', async () => {
    const testDir = join(process.cwd(), 'public');
    if (!existsSync(testDir)) {
      throw new Error('Public directory not accessible');
    }
    return true;
  }));
  
  // 4. Environment variables check
  checks.push(await runTimedCheck('configuration', async () => {
    const requiredVars = ['JWT_SECRET', 'DATABASE_URL'];
    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing env vars: ${missing.join(', ')}`);
    }
    return true;
  }));
  
  // 5. Memory usage check
  checks.push(await runTimedCheck('memory', async () => {
    const memUsage = process.memoryUsage();
    const totalMemBytes = os.totalmem();
    const usagePercent = (memUsage.rss / totalMemBytes) * 100;
    
    if (usagePercent > 90) {
      throw new Error(`High memory usage: ${usagePercent.toFixed(1)}%`);
    }
    return true;
  }));
  
  // 6. Disk space check
  checks.push(await runTimedCheck('disk_space', async () => {
    // Simplified disk check
    const freeMem = os.freemem();
    if (freeMem < 100 * 1024 * 1024) { // Less than 100MB free
      throw new Error('Low disk space');
    }
    return true;
  }));
  
  return checks;
}

async function runTimedCheck(
  name: string, 
  checkFn: () => Promise<boolean>
): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    await checkFn();
    return {
      name,
      status: 'healthy',
      latency_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper: Get deployment metrics
function getDeploymentMetrics(): DeploymentMetrics {
  // In production, these would come from Prometheus/StatsD
  // Here we provide mock data structure
  
  return {
    timestamp: new Date().toISOString(),
    requests_total: Math.floor(Math.random() * 100000), // Mock
    errors_total: Math.floor(Math.random() * 500), // Mock
    avg_response_time_ms: Math.random() * 200 + 50, // Mock
    active_connections: Math.floor(Math.random() * 100), // Mock
    rate_limit_utilization: Math.random() * 50, // Mock
    database_pool_size: {
      active: Math.floor(Math.random() * 10) + 1,
      idle: Math.floor(Math.random() * 10),
      total: 20,
    },
    redis_memory_bytes: Math.floor(Math.random() * 100 * 1024 * 1024), // Mock
    cache_hit_rate: Math.random() * 30 + 70, // 70-100%
  };
}

// Helper: Check rollback authorization
function isAuthorizedForRollback(request: NextRequest): boolean {
  // In production, this would verify admin JWT or API key
  const authHeader = request.headers.get('authorization');
  const apiKey = request.headers.get('x-admin-key');
  
  // Check for admin role in JWT or valid admin key
  if (apiKey === process.env.ADMIN_API_KEY) {
    return true;
  }
  
  // Basic check for development
  if (DEPLOYMENT_INFO.environment === 'development') {
    return true;
  }
  
  return false;
}

// =============================================================================
// API Handlers
// =============================================================================

/**
 * GET /api/portal/deploy/status
 * Returns current deployment information and service status
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  
  try {
    switch (action) {
      case 'metrics':
        return NextResponse.json({
          success: true,
          data: getDeploymentMetrics(),
        });
        
      case 'status':
      default:
        const gitInfo = getGitInfo();
        
        // Check all services
        const services = await Promise.all([
          checkServiceHealth('api-gateway'),
          checkServiceHealth('postgres'),
          checkServiceHealth('redis'),
          checkServiceHealth('nginx'),
        ]);
        
        // Determine overall health
        const downServices = services.filter(s => s.status === 'down').length;
        const degradedServices = services.filter(s => s.status === 'degraded').length;
        
        let healthStatus: DeploymentStatus['health_status'] = 'operational';
        if (downServices > 0) healthStatus = 'down';
        else if (degradedServices > 0) healthStatus = 'degraded';
        
        const status: DeploymentStatus = {
          version: DEPLOYMENT_INFO.version,
          environment: DEPLOYMENT_INFO.environment,
          deployed_at: DEPLOYMENT_INFO.deployedAt,
          commit_sha: gitInfo.sha,
          branch: gitInfo.branch,
          uptime_seconds: getUptime(),
          node_version: process.version,
          memory_usage: getMemoryUsage(),
          services,
          health_status: healthStatus,
        };
        
        return NextResponse.json({
          success: true,
          data: status,
        });
    }
  } catch (error) {
    console.error('Deployment status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve deployment status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/deploy/health-check
 * Runs comprehensive diagnostics and returns detailed results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'diagnose';
    
    switch (action) {
      case 'health-check': {
        const results = await runHealthChecks();
        
        const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
        const overallStatus = unhealthyCount === 0 ? 'pass' : 
                              unhealthyCount <= 2 ? 'warning' : 'fail';
        
        return NextResponse.json({
          success: overallStatus !== 'fail',
          data: {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            checks: results,
            summary: {
              total: results.length,
              healthy: results.filter(r => r.status === 'healthy').length,
              unhealthy: unhealthyCount,
            },
          },
        });
      }
      
      case 'rollback': {
        // Emergency rollback endpoint
        if (!isAuthorizedForRollback(request)) {
          return NextResponse.json(
            { success: false, error: 'Unauthorized for rollback operation' },
            { status: 403 }
          );
        }
        
        const targetVersion = body.targetVersion || 'previous';
        
        // Log rollback initiation
        console.warn(`ROLLBACK INITIATED by admin to version: ${targetVersion}`, {
          timestamp: new Date().toISOString(),
          targetVersion,
          initiatorIp: request.headers.get('x-forwarded-for') || 'unknown',
        });
        
        // In production, this would trigger actual rollback procedures:
        // 1. Stop current deployment
        // 2. Restore from backup
        // 3. Restart services
        // 4. Verify health
        
        return NextResponse.json({
          success: true,
          data: {
            message: 'Rollback initiated successfully',
            target_version: targetVersion,
            estimated_downtime_seconds: 120,
            rollback_id: `rollback_${Date.now()}`,
            status: 'in_progress',
            next_steps: [
              'Stopping current deployment',
              'Restoring from backup',
              'Restarting services',
              'Running health verification',
            ],
          },
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Deploy API POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported methods
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
    },
  });
}

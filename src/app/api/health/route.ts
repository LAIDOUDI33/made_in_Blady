/**
 * Health Check Endpoint - AlgeriaTrade.dz
 * Endpoint de santé pour le monitoring et les load balancers
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRedisHealth } from '@/lib/cache/redis-config';
import { PrismaClient } from '@prisma/client';

// Global to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down' | 'degraded';
      latency?: number;
      error?: string;
    };
    redis: {
      status: 'up' | 'down' | 'degraded';
      latency?: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'warning' | 'critical';
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      status: 'healthy' | 'warning' | 'critical';
      used?: number;
      total?: number;
      percentage?: number;
      error?: string;
    };
  };
}

function getMemoryUsage(): { used: number; total: number; percentage: number; status: 'healthy' | 'warning' | 'critical' } {
  const memUsage = process.memoryUsage();
  const used = Math.round(memUsage.heapUsed / 1024 / 1024);
  const total = Math.round(memUsage.heapTotal / 1024 / 1024);
  const percentage = Math.round((used / total) * 100);
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (percentage > 90) status = 'critical';
  else if (percentage > 75) status = 'warning';
  
  return { used, total, percentage, status };
}

async function checkDatabaseHealth(): Promise<{
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    if (latency > 1000) {
      return { status: 'degraded', latency, error: 'High database latency' };
    }
    
    return { status: 'up', latency };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Run health checks in parallel
  const [dbHealth, redisHealth, memoryUsage] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth().catch(() => ({ 
      status: 'down' as const, 
      error: 'Redis not available' 
    })),
    Promise.resolve(getMemoryUsage()),
  ]);

  // Determine overall status
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  
  if (dbHealth.status === 'down') {
    overallStatus = 'unhealthy';
  } else if (
    dbHealth.status === 'degraded' ||
    redisHealth.status === 'degraded' ||
    redisHealth.status === 'unhealthy' ||
    memoryUsage.status === 'warning' ||
    memoryUsage.status === 'critical'
  ) {
    overallStatus = 'degraded';
  }

  const healthResponse: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      database: dbHealth,
      redis: {
        status: redisHealth.status === 'healthy' ? 'up' : 
                redisHealth.status === 'degraded' ? 'degraded' : 'down',
        latency: redisHealth.latency,
        error: redisHealth.error,
      },
      memory: memoryUsage,
      disk: {
        status: 'healthy', // Would need fs access for real disk check
        error: 'Disk check not implemented',
      },
    },
  };

  // Calculate response time
  const responseTime = Date.now() - startTime;

  // Return appropriate HTTP status code
  let httpStatus = 200;
  if (overallStatus === 'unhealthy') httpStatus = 503;
  else if (overallStatus === 'degraded') httpStatus = 200; // Still serving

  const response = NextResponse.json(healthResponse, { status: httpStatus });
  
  // Add headers for load balancers and monitors
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('X-Response-Time', `${responseTime}ms`);
  response.headers.set('X-Health-Status', overallStatus);

  // For detailed mode (when ?detailed=true)
  const detailed = request.nextUrl.searchParams.get('detailed') === 'true';
  
  if (detailed) {
    // Add more detailed information
    (healthResponse as any).process = {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };

    (healthResponse as any).environment = {
      ...((healthResponse as any).environment || {}),
      region: process.env.REGION || 'unknown',
      zone: process.env.ZONE || 'unknown',
    };
  }

  // Liveness probe (always returns 200 if the process is running)
  const isLivenessProbe = request.nextUrl.searchParams.get('probe') === 'liveness';
  if (isLivenessProbe) {
    return NextResponse.json(
      { status: 'alive', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  }

  // Readiness probe (checks if app can serve traffic)
  const isReadinessProbe = request.nextUrl.searchParams.get('probe') === 'readiness';
  if (isReadinessProbe && overallStatus !== 'healthy') {
    return NextResponse.json(
      { status: 'not_ready', checks: healthResponse.checks },
      { status: 503 }
    );
  }

  return response;
}

// HEAD request for quick health checks (load balancers often use this)
export async function HEAD() {
  const dbHealth = await checkDatabaseHealth();
  
  if (dbHealth.status === 'down') {
    return new Response(null, { status: 503 });
  }
  
  return new Response(null, { status: 200 });
}

/**
 * Health Check API Endpoint
 * 
 * Endpoint: GET /api/health
 * 
 * Utilisé par :
 * - Docker health checks
 * - Load balancers
 * - Monitoring services (UptimeRobot, Pingdom)
 * - Kubernetes liveness/readiness probes
 * 
 * Retourne l'état de santé de l'application et ses dépendances.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Interface pour la réponse de santé
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  responseTime: number;
  services: {
    database: ServiceHealth;
    redis?: ServiceHealth;
  };
  system: SystemInfo;
}

interface ServiceHealth {
  status: 'connected' | 'disconnected' | 'degraded' | 'unknown';
  latency?: number;
  error?: string;
}

interface SystemInfo {
  memory: MemoryUsage;
  cpu: CpuUsage;
  disk?: DiskUsage;
}

interface MemoryUsage {
  used: number;
  total: number;
  percent: number;
}

interface CpuUsage {
  load: number[];
  percent: number;
}

interface DiskUsage {
  used: number;
  total: number;
  percent: number;
}

/**
 * GET /api/health
 * 
 * Vérifie la santé de tous les services.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Récupérer le mode (simple ou complet)
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'full'; // 'simple' ou 'full'
  
  try {
    // Initialiser la réponse
    const healthResponse: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      responseTime: 0,
      services: {
        database: { status: 'unknown' },
      },
      system: {
        memory: getMemoryUsage(),
        cpu: getCpuUsage(),
      },
    };

    // Vérifier la base de données
    try {
      const dbStart = Date.now();
      
      // Requête simple pour tester la connexion
      await db.$queryRaw`SELECT 1`;
      
      const dbLatency = Date.now() - dbStart;
      
      healthResponse.services.database = {
        status: dbLatency < 1000 ? 'connected' : 'degraded',
        latency: dbLatency,
      };
      
      // Si la latence est trop élevée, marquer comme dégradé
      if (dbLatency > 2000) {
        healthResponse.status = 'degraded';
      }
    } catch (error) {
      healthResponse.services.database = {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Database connection failed',
      };
      healthResponse.status = 'unhealthy';
    }

    // Vérifier Redis (si configuré) - uniquement en mode full
    if (mode === 'full' && process.env.REDIS_URL) {
      try {
        const redisStart = Date.now();
        
        // Import dynamique de Redis (optionnel)
        let Redis: any;
        try {
          Redis = (await import('ioredio')).default;
        } catch {
          // ioredis non installé, skip
          healthResponse.services.redis = { status: 'unknown' };
        }
        
        if (Redis) {
          const redis = new Redis(process.env.REDIS_URL);
          await redis.ping();
          const redisLatency = Date.now() - redisStart;
          
          healthResponse.services.redis = {
            status: redisLatency < 500 ? 'connected' : 'degraded',
            latency: redisLatency,
          };
          
          await redis.quit();
        }
      } catch (error) {
        healthResponse.services.redis = {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Redis connection failed',
        };
        
        // Redis non critique, ne pas marquer unhealthy
        if (healthResponse.status === 'healthy') {
          healthResponse.status = 'degraded';
        }
      }
    }

    // Calculer le temps de réponse total
    healthResponse.responseTime = Date.now() - startTime;

    // Déterminer le code HTTP basé sur le statut
    let statusCode = 200;
    if (healthResponse.status === 'degraded') {
      statusCode = 200; // Toujours OK mais avec avertissement
    } else if (healthResponse.status === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    }

    return NextResponse.json(healthResponse, { status: statusCode });

  } catch (error) {
    // Erreur critique dans le endpoint lui-même
    console.error('[Health Check] Critical error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        uptime: process.uptime(),
      },
      { status: 503 }
    );
  }
}

/**
 * Obtenir l'utilisation mémoire du processus
 */
function getMemoryUsage(): MemoryUsage {
  const memUsage = process.memoryUsage();
  const used = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
  const total = Math.round(memUsage.heapTotal / 1024 / 1024); // MB
  
  return {
    used,
    total,
    percent: total > 0 ? Math.round((used / total) * 100) : 0,
  };
}

/**
 * Obtenir la charge CPU (Linux seulement)
 */
function getCpuUsage(): CpuUsage {
  try {
    // Lire la charge système depuis /proc/loadavg (Linux)
    const fs = require('fs');
    const loadavg = fs.readFileSync('/proc/loadavg', 'utf8');
    const loads = loadavg.split(' ').slice(0, 3).map(Number);
    
    return {
      load: loads,
      percent: Math.min(100, Math.round(loads[0] * 100)), // Approximation
    };
  } catch {
    // Fallback pour non-Linux
    return {
      load: [0, 0, 0],
      percent: 0,
    };
  }
}

/**
 * Obtenir l'utilisation disque (si disponible)
 */
function getDiskUsage(): DiskUsage | undefined {
  try {
    const fs = require('fs');
    const stats = fs.statSync('.');
    
    // Information limitée sans accès au système de fichiers
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Options pour le endpoint
 */
export async function HEAD() {
  // Pour les health checks qui n'ont besoin que du status code
  return new Response(null, { status: 200 });
}

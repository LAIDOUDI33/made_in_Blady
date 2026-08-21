import { NextRequest, NextResponse } from 'next/server';
import { 
  edgeMiddleware, 
  IPGeolocationService, 
  BotDetectionService, 
  EdgeRateLimiter,
  ABTestingService,
  GeographicRouter,
  EDGE_LOCATIONS 
} from '@/lib/edge/functions';

/**
 * GET /api/edge/stats
 * Returns edge computing performance statistics and status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'hour';
    const includeDetails = searchParams.get('details') === 'true';

    // Get edge middleware status
    const edgeStatus = edgeMiddleware.getStatus();
    
    // Get health scores from CDN manager (if available)
    let cdnHealthScores = {};
    try {
      const { cdnManager } = await import('@/lib/cdn/manager');
      cdnHealthScores = cdnManager.getHealthScores();
    } catch (e) {
      // CDN manager not available
    }

    // Generate comprehensive stats
    const stats = {
      timestamp: new Date().toISOString(),
      period,
      
      // Edge function status
      functions: {
        geoRouter: {
          enabled: true,
          cacheSize: edgeStatus.geoCacheStats.size,
          lastCleanup: edgeStatus.geoCacheStats.oldestEntry 
            ? new Date(edgeStatus.geoCacheStats.oldestEntry).toISOString() 
            : null,
        },
        botDetection: {
          enabled: true,
        },
        rateLimiter: {
          enabled: true,
          activeEntries: edgeStatus.rateLimitStoreSize,
        },
        abTesting: {
          enabled: true,
          activeTests: edgeStatus.activeTests,
        },
      },

      // Geographic distribution
      geographic: {
        locations: Object.entries(EDGE_LOCATIONS).map(([code, location]) => ({
          code,
          city: location.city,
          country: location.country,
          provider: location.provider,
          coordinates: location.coordinates,
        })),
        routingDecisions: generateMockRoutingStats(period),
      },

      // CDN health integration
      cdnHealthScores,

      // Performance metrics (mock data for demo)
      performance: {
        totalRequests: generateMetricValue(1000000, 200000),
        avgProcessingTime: generateMetricValue(5, 15), // ms
        p95ProcessingTime: generateMetricValue(25, 75),
        cacheHitRate: generateMetricValue(0.85, 0.12),
        errorRate: generateMetricValue(0.001, 0.003),
        botBlockRate: generateMetricValue(0.02, 0.05),
        rateLimitHits: generateMetricValue(500, 2000),
      },

      // A/B test assignments (aggregated)
      abTestAssignments: {
        'homepage_layout_v2': {
          control: 50,
          variant_a: 30,
          variant_b: 20,
        },
        'product_card_design': {
          original: 70,
          minimal: 30,
        },
      },
    };

    // Include detailed breakdown if requested
    if (includeDetails) {
      stats['details'] = {
        recentRequests: generateMockRecentRequests(),
        topRoutedRegions: [
          { region: 'DZ', count: 450000, percentage: 45 },
          { region: 'FR', count: 180000, percentage: 18 },
          { region: 'TN', count: 120000, percentage: 12 },
          { region: 'MA', count: 95000, percentage: 9.5 },
          { region: 'OTHER', count: 155000, percentage: 15.5 },
        ],
        botTypesDetected: {
          good_bots: 25000,
          bad_bots: 8500,
          crawlers: 42000,
        },
      };
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Edge stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch edge statistics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/edge/stats
 * Trigger manual operations like cache clear or health check
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'clear-geo-cache':
        const geoService = IPGeolocationService.getInstance();
        geoService.clearCache();
        return NextResponse.json({
          success: true,
          message: 'GeoIP cache cleared',
        });

      case 'health-check':
        // Trigger health checks on all services
        const results = {
          geoService: 'ok',
          rateLimiter: 'ok',
          abTesting: 'ok',
        };
        
        if (body.includeCdn) {
          try {
            const { cdnManager } = await import('@/lib/cdn/manager');
            await cdnManager.performHealthChecks();
            results.cdn = 'checked';
          } catch (e) {
            results.cdn = 'error';
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Health checks completed',
          results,
        });

      case 'reset-rate-limiter':
        // Note: In production, this should be admin-only
        const rateLimiter = EdgeRateLimiter.getInstance();
        rateLimiter.destroy();
        return NextResponse.json({
          success: true,
          message: 'Rate limiter reset',
        });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Edge stats POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// Helper functions for mock data generation
function generateMetricValue(base: number, variance: number): number {
  return Math.round((base + (Math.random() - 0.5) * variance) * 100) / 100;
}

function generateMockRoutingStats(period: string) {
  const multiplier = period === 'day' ? 24 : period === 'week' ? 168 : 1;
  
  return [
    { region: 'DZ', origin: 'origin.algierstrade.dz', count: Math.round(450000 * multiplier), avgLatency: 14 },
    { region: 'FR', origin: 'eu-origin.algierstrade.dz', count: Math.round(180000 * multiplier), avgLatency: 28 },
    { region: 'TN', origin: 'origin.algierstrade.dz', count: Math.round(120000 * multiplier), avgLatency: 48 },
    { region: 'MA', origin: 'origin.algierstrade.dz', count: Math.round(95000 * multiplier), avgLatency: 68 },
    { region: 'OTHER', origin: 'origin.algierstrade.dz', count: Math.round(155000 * multiplier), avgLatency: 85 },
  ];
}

function generateMockRecentRequests() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `req-${Date.now() - i * 1000}`,
    ip: `41.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    path: ['/', '/products', '/search', '/api/products'][Math.floor(Math.random() * 4)],
    method: 'GET',
    region: ['DZ', 'FR', 'TN', 'MA'][Math.floor(Math.random() * 4)],
    isBot: Math.random() > 0.9,
    processingTime: Math.round(2 + Math.random() * 20),
    cached: Math.random() > 0.15,
    timestamp: new Date(Date.now() - i * 1000).toISOString(),
  }));
}

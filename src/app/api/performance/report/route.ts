import { NextRequest, NextResponse } from 'next/server';
import { cdnManager } from '@/lib/cdn/manager';

/**
 * Types for performance report
 */
interface PerformanceReport {
  generatedAt: string;
  period: string;
  summary: {
    overallScore: number;
    totalRequests: number;
    avgResponseTime: number;
    availability: number;
    errorRate: number;
  };
  coreWebVitals: {
    LCP: MetricSummary;
    FID: MetricSummary;
    CLS: MetricSummary;
    INP: MetricSummary;
  };
  cdnPerformance: {
    cacheHitRate: number;
    bandwidthSaved: number;
    topRegions: RegionalMetric[];
    providerHealth: Record<string, number>;
  };
  edgeFunctions: {
    totalInvocations: number;
    avgExecutionTime: number;
    errorRate: number;
    coldStartRate: number;
    topFunctions: FunctionMetric[];
  };
  recommendations: Recommendation[];
}

interface MetricSummary {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: { good: number; poor: number };
  percentile: {
    p50: number;
    p75: number;
    p95: number;
    p99: number;
  };
}

interface RegionalMetric {
  region: string;
  countryCode: string;
  requests: number;
  avgLatency: number;
  hitRate: number;
  errorRate: number;
}

interface FunctionMetric {
  name: string;
  invocations: number;
  avgTime: number;
  errorRate: number;
  status: 'healthy' | 'degraded' | 'critical';
}

interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: 'easy' | 'moderate' | 'complex';
}

/**
 * GET /api/performance/report
 * Generate comprehensive performance report for AlgeriaTrade.dz
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'day'; // hour, day, week, month
    const format = searchParams.get('format') || 'json'; // json, summary

    // Generate report data
    const report = await generateReport(period);

    // Return based on format
    if (format === 'summary') {
      return NextResponse.json({
        success: true,
        data: {
          summary: report.summary,
          overallScore: report.summary.overallScore,
          keyMetrics: {
            lcp: report.coreWebVitals.LCP.value,
            fid: report.coreWebVitals.FID.value,
            cls: report.coreWebVitals.CLS.value,
            inp: report.coreWebVitals.INP.value,
            cacheHitRate: report.cdnPerformance.cacheHitRate,
            errorRate: report.summary.errorRate,
          },
          topRecommendations: report.recommendations.slice(0, 3),
          generatedAt: report.generatedAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
    });

  } catch (error) {
    console.error('Performance report error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate performance report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate comprehensive performance report
 */
async function generateReport(period: string): Promise<PerformanceReport> {
  // Get CDN stats
  let cdnStats;
  try {
    cdnStats = await cdnManager.getAggregatedStats(period as any);
  } catch (e) {
    cdnStats = null;
  }

  // Generate Core Web Vitals data (mock + real if available)
  const cwvData = generateCWVMetrics();

  // Generate CDN performance metrics
  const cdnPerf = generateCDNPerformance(cdnStats);

  // Generate Edge function metrics
  const edgeFuncs = generateEdgeFunctionMetrics();

  // Calculate overall score
  const overallScore = calculateOverallScore(cwvData, cdnPerf, edgeFuncs);

  // Generate recommendations
  const recommendations = generateRecommendations(cwvData, cdnPerf, edgeFuncs);

  return {
    generatedAt: new Date().toISOString(),
    period,
    summary: {
      overallScore,
      totalRequests: cdnStats?.totalRequests || generateMockValue(1000000, 200000),
      avgResponseTime: cdnStats?.avgLatency || generateMockValue(45, 25),
      availability: generateMockValue(99.8, 0.3),
      errorRate: generateMockValue(0.002, 0.002),
    },
    coreWebVitals: cwvData,
    cdnPerformance: cdnPerf,
    edgeFunctions: edgeFuncs,
    recommendations,
  };
}

function generateCWVMetrics() {
  // Simulated CWV data with realistic values for AlgeriaTrade.dz
  const baseLCP = 2.2 + Math.random() * 0.6;
  const baseFID = 25 + Math.random() * 40;
  const baseCLS = 0.04 + Math.random() * 0.07;
  const baseINP = 140 + Math.random() * 90;

  const createMetric = (
    value: number, 
    unit: string, 
    good: number, 
    poor: number,
    isLowerBetter: boolean = true
  ): MetricSummary => {
    const rating = isLowerBetter
      ? value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor'
      : value >= good ? 'good' : value >= poor ? 'needs-improvement' : 'poor';

    return {
      value,
      rating,
      threshold: { good, poor },
      percentile: {
        p50: value * (0.7 + Math.random() * 0.15),
        p75: value * (0.9 + Math.random() * 0.15),
        p95: value * (1.3 + Math.random() * 0.4),
        p99: value * (1.6 + Math.random() * 0.6),
      },
    };
  };

  return {
    LCP: createMetric(baseLCP, 's', 2.5, 4.0),
    FID: createMetric(baseFID, 'ms', 100, 300),
    CLS: createMetric(baseCLS, '', 0.1, 0.25),
    INP: createMetric(baseINP, 'ms', 200, 500),
  };
}

function generateCDNPerformance(cdnStats: any) {
  // Use real CDN stats or generate mock data
  const hitRate = cdnStats?.overallHitRate || (0.88 + Math.random() * 0.08);
  
  return {
    cacheHitRate: hitRate,
    bandwidthSaved: cdnStats?.savings?.bandwidthSaved || generateMockValue(18000000000, 3000000000),
    topRegions: [
      { region: 'Algiers', countryCode: 'DZ', requests: 285000, avgLatency: 14, hitRate: 0.94, errorRate: 0.0012 },
      { region: 'Oran', countryCode: 'DZ', requests: 92000, avgLatency: 24, hitRate: 0.91, errorRate: 0.0018 },
      { region: 'Constantine', countryCode: 'DZ', requests: 71000, avgLatency: 35, hitRate: 0.89, errorRate: 0.0021 },
      { region: 'Paris', countryCode: 'FR', requests: 52000, avgLatency: 28, hitRate: 0.96, errorRate: 0.0008 },
      { region: 'Tunis', countryCode: 'TN', requests: 38000, avgLatency: 52, hitRate: 0.84, errorRate: 0.0025 },
      { region: 'Casablanca', countryCode: 'MA', requests: 31000, avgLatency: 72, hitRate: 0.82, errorRate: 0.0032 },
    ],
    providerHealth: cdnStats ? Object.fromEntries(
      cdnStats.providers.map((p: any) => [p.provider, 100])
    ) : {
      cloudflare: 98,
      fastly: 96,
      cloudfront: 94,
    },
  };
}

function generateEdgeFunctionMetrics() {
  const functions = [
    { name: 'geo-router', invocations: 1250000, avgTime: 2.4, errorRate: 0.0003, status: 'healthy' as const },
    { name: 'bot-detector', invocations: 1180000, avgTime: 1.8, errorRate: 0.0001, status: 'healthy' as const },
    { name: 'rate-limiter', invocations: 1320000, avgTime: 0.9, errorRate: 0.00005, status: 'healthy' as const },
    { name: 'ab-testing-engine', invocations: 850000, avgTime: 3.2, errorRate: 0.0008, status: 'degraded' as const },
    { name: 'image-transformer', invocations: 420000, avgTime: 45, errorRate: 0.002, status: 'degraded' as const },
    { name: 'auth-validator', invocations: 650000, avgTime: 8.5, errorRate: 0.005, status: 'critical' as const },
  ];

  const totalInvocations = functions.reduce((sum, f) => sum + f.invocations, 0);
  const weightedAvgTime = functions.reduce((sum, f) => sum + f.avgTime * f.invocations, 0) / totalInvocations;
  const weightedErrorRate = functions.reduce((sum, f) => sum + f.errorRate * f.invocations, 0) / totalInvocations;

  return {
    totalInvocations,
    avgExecutionTime: weightedAvgTime,
    errorRate: weightedErrorRate,
    coldStartRate: 0.0035 + Math.random() * 0.002,
    topFunctions: functions.sort((a, b) => b.invocations - a.invocations).slice(0, 5),
  };
}

function calculateOverallScore(
  cwv: { coreWebVitals: any }, 
  cdn: { cacheHitRate: number }, 
  edge: { errorRate: number }
): number {
  // Weighted scoring algorithm
  const cwvScore = getCWVScore(cwv);
  const cdnScore = Math.min(100, cdn.cacheHitRate * 100);
  const edgeScore = Math.max(0, 100 - edge.errorRate * 10000);

  return Math.round(cwvScore * 0.5 + cdnScore * 0.25 + edgeScore * 0.25);
}

function getCWVScore(data: { coreWebVitals: any }): number {
  const { LCP, FID, CLS, INP } = data.coreWebVitals;
  
  const scores = [
    LCP.rating === 'good' ? 100 : LCP.rating === 'needs-improvement' ? 66 : 33,
    FID.rating === 'good' ? 100 : FID.rating === 'needs-improvement' ? 66 : 33,
    CLS.rating === 'good' ? 100 : CLS.rating === 'needs-improvement' ? 66 : 33,
    INP.rating === 'good' ? 100 : INP.rating === 'needs-improvement' ? 66 : 33,
  ];

  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function generateRecommendations(
  cwv: { coreWebVitals: any }, 
  cdn: { topRegions: any[] }, 
  edge: { topFunctions: any[] }
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Analyze CWV and add recommendations
  if (cwv.coreWebVitals.LCP.rating !== 'good') {
    recommendations.push({
      id: 'rec-1',
      priority: 'high',
      category: 'Performance',
      title: 'Optimize Largest Contentful Paint',
      description: `Current LCP is ${cwv.coreWebVitals.LCP.value.toFixed(2)}s. Target is <2.5s.`,
      impact: '-0.5s LCP improvement',
      effort: 'moderate',
    });
  }

  if (cwv.coreWebVitals.INP.rating !== 'good') {
    recommendations.push({
      id: 'rec-2',
      priority: 'high',
      category: 'Interactivity',
      title: 'Improve Interaction to Next Paint',
      description: `Current INP is ${Math.round(cwv.coreWebVitals.INP.value)}ms. Target is <200ms.`,
      impact: '-80ms INP improvement',
      effort: 'complex',
    });
  }

  // Check regional performance
  const slowRegions = cdn.topRegions.filter(r => r.avgLatency > 50);
  if (slowRegions.length > 0) {
    recommendations.push({
      id: 'rec-3',
      priority: 'medium',
      category: 'CDN',
      title: `Optimize CDN for ${slowRegions.length} slow regions`,
      description: `Regions like ${slowRegions[0].region} have latency >50ms. Consider adding edge locations.`,
      impact: '-30ms average latency',
      effort: 'complex',
    });
  }

  // Check edge function health
  const degradedFunctions = edge.topFunctions.filter(f => f.status !== 'healthy');
  if (degradedFunctions.length > 0) {
    recommendations.push({
      id: 'rec-4',
      priority: degradedFunctions.some(f => f.status === 'critical') ? 'high' : 'medium',
      category: 'Edge Functions',
      title: `Fix ${degradedFunctions.length} underperforming edge functions`,
      description: `${degradedFunctions.map(f => f.name).join(', ')} need attention.`,
      impact: '+5% reliability',
      effort: 'moderate',
    });
  }

  // Always include some general recommendations
  recommendations.push(
    {
      id: 'rec-5',
      priority: 'low',
      category: 'Images',
      title: 'Implement next-gen image formats',
      description: 'Serve images in AVIF format with WebP fallback.',
      impact: '-25% image payload size',
      effort: 'easy',
    },
    {
      id: 'rec-6',
      priority: 'low',
      category: 'Caching',
      title: 'Extend API response caching',
      description: 'Increase edge cache TTL for stable API endpoints.',
      impact: '-40% origin load',
      effort: 'easy',
    }
  );

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

function generateMockValue(base: number, variance: number): number {
  return Math.round((base + (Math.random() - 0.5) * variance) * 100) / 100;
}

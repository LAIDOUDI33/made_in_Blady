import { NextRequest, NextResponse } from 'next/server';

// Types
interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'operational' | 'business';
  unit: string;
  targetValue: number;
  weight: number; // For overall score calculation
}

interface KPIMeasurement {
  kpiId: string;
  currentValue: number;
  previousValue?: number;
  timestamp: string;
  pilotId: string;
}

interface PilotMetrics {
  pilotId: string;
  kpis: KPIMeasurement[];
  calculatedAt: string;
  summary: {
    technicalScore: number;
    operationalScore: number;
    businessScore: number;
    overallScore: number;
    successProbability: number;
    recommendation: 'go' | 'conditional' | 'no_go';
  };
}

// KPI Definitions for Blockchain Pilot Program
const KPI_DEFINITIONS: KPIDefinition[] = [
  // Technical KPIs (40% weight total)
  { id: 'tracking_coverage', name: 'Tracking Coverage', description: '% of products with complete traceability', category: 'technical', unit: '%', targetValue: 80, weight: 15 },
  { id: 'event_accuracy', name: 'Event Accuracy', description: '% of events logged correctly without errors', category: 'technical', unit: '%', targetValue: 99, weight: 10 },
  { id: 'certificate_rate', name: 'Certificate Rate', description: '% of eligible batches with certificates issued', category: 'technical', unit: '%', targetValue: 90, weight: 10 },
  { id: 'verification_success', name: 'Verification Success Rate', description: '% of QR code scans that successfully verify', category: 'technical', unit: '%', targetValue: 99.9, weight: 5 },
  
  // Operational KPIs (35% weight total)
  { id: 'user_adoption', name: 'User Adoption', description: '% of trained staff actively using platform daily', category: 'operational', unit: '%', targetValue: 85, weight: 12 },
  { id: 'daily_active_users', name: 'Daily Active Users', description: 'Number of unique users per day', category: 'operational', unit: '', targetValue: 14, weight: 8 },
  { id: 'events_per_user', name: 'Events Per User/Day', description: 'Average events logged per active user daily', category: 'operational', unit: '', targetValue: 5, weight: 8 },
  { id: 'processing_time', name: 'Avg Processing Time', description: 'Average time from scan to event confirmation', category: 'operational', unit: 'min', targetValue: 2, weight: 7 },
  
  // Business KPIs (25% weight total)
  { id: 'customer_satisfaction', name: 'Customer Satisfaction', description: 'Average satisfaction score from feedback surveys (1-5)', category: 'business', unit: '/5', targetValue: 4.5, weight: 10 },
  { id: 'support_tickets', name: 'Support Tickets Volume', description: 'Average support tickets per week (lower is better)', category: 'business', unit: '', targetValue: 5, weight: 8 },
  { id: 'time_savings', name: 'Time Savings vs Baseline', description: '% reduction in manual tracking time', category: 'business', unit: '%', targetValue: 60, weight: 7 }
];

// In-memory storage for demo (in production, use database with time-series)
const metricsStore = new Map<string, PilotMetrics>();

// Generate mock metrics for a pilot (for demo purposes)
function generateMockMetrics(pilotId: string): PilotMetrics {
  const kpis: KPIMeasurement[] = KPI_DEFINITIONS.map(kpi => ({
    kpiId: kpi.id,
    currentValue: Math.round((Math.random() * 30 + 70) * 100) / 100, // 70-100 range mostly
    previousValue: Math.round((Math.random() * 25 + 65) * 100) / 100,
    timestamp: new Date().toISOString(),
    pilotId
  }));

  // Ensure some realistic variation
  kpis.find(k => k.kpiId === 'event_accuracy')!.currentValue = 98.5;
  kpis.find(k => k.kpiId === 'verification_success')!.currentValue = 99.2;
  kpis.find(k => k.kpiId === 'processing_time')!.currentValue = 1.8;

  // Calculate scores
  const calculateCategoryScore = (category: string) => {
    const categoryKPIs = KPI_DEFINITIONS.filter(k => k.category === category);
    let weightedSum = 0;
    let totalWeight = 0;

    categoryKPIs.forEach(kpiDef => {
      const measurement = kpis.find(k => k.kpiId === kpiDef.id)!;
      const achievement = Math.min(measurement.currentValue / kpiDef.targetValue, 1.2); // Cap at 120%
      weightedSum += achievement * kpiDef.weight;
      totalWeight += kpiDef.weight;
    });

    return Math.round((weightedSum / totalWeight) * 100);
  };

  const technicalScore = calculateCategoryScore('technical');
  const operationalScore = calculateCategoryScore('operational');
  const businessScore = calculateCategoryScore('business');

  // Overall score (weighted by category importance)
  const overallScore = Math.round(
    (technicalScore * 0.4) + 
    (operationalScore * 0.35) + 
    (businessScore * 0.25)
  );

  // Success probability based on overall score and specific thresholds
  let successProbability = overallScore;
  
  // Adjustments based on critical factors
  const trackingCoverage = kpis.find(k => k.kpiId === 'tracking_coverage')!.currentValue;
  if (trackingCoverage < 50) successProbability -= 15;
  
  const userAdoption = kpis.find(k => k.kpiId === 'user_adoption')!.currentValue;
  if (userAdoption < 60) successProbability -= 10;

  successProbability = Math.max(0, Math.min(100, successProbability));

  // Determine recommendation
  let recommendation: 'go' | 'conditional' | 'no_go';
  if (successProbability >= 70 && trackingCoverage >= 60 && userAdoption >= 70) {
    recommendation = 'go';
  } else if (successProbability >= 50) {
    recommendation = 'conditional';
  } else {
    recommendation = 'no_go';
  }

  return {
    pilotId,
    kpis,
    calculatedAt: new Date().toISOString(),
    summary: {
      technicalScore,
      operationalScore,
      businessScore,
      overallScore,
      successProbability,
      recommendation
    }
  };
}

// Calculate baseline comparison data
function generateBaselineComparison(pilotId: string) {
  return [
    { metric: 'Product Traceability Time', beforePilot: 45, currentPilot: 12, improvement: 73.3, unit: 'minutes' },
    { metric: 'Certificate Generation Time', beforePilot: 120, currentPilot: 8, improvement: 93.3, unit: 'minutes' },
    { metric: 'Customer Complaints (Monthly)', beforePilot: 24, currentPilot: 7, improvement: 70.8, unit: '' },
    { metric: 'Audit Preparation Days', beforePilot: 10, currentPilot: 3, improvement: 70, unit: 'days' },
    { metric: 'Data Entry Errors (%)', beforePilot: 15, currentPilot: 0.5, improvement: 96.7, unit: '%' },
    { metric: 'Shipment Discrepancies', beforePilot: 8, currentPilot: 1, improvement: 87.5, unit: '/month' },
    { metric: 'Customer Verification Requests', beforePilot: 0, currentPilot: 156, improvement: null, unit: '/month (new capability)' }
  ];
}

// GET /api/blockchain/pilot/metrics - Get pilot metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pilotId = searchParams.get('pilotId');
    const action = searchParams.get('action');
    
    if (!pilotId) {
      return NextResponse.json(
        { success: false, error: { code: 'validation_error', message: 'Pilot ID is required' } },
        { status: 400 }
      );
    }

    switch (action) {
      case 'kpi_details':
        return getKPIDetails(pilotId);
      
      case 'baseline_comparison':
        return getBaselineComparison(pilotId);
      
      case 'benchmark':
        return getBenchmarkData(pilotId);
      
      case 'export':
        return exportMetricsReport(pilotId);
      
      default:
        return getPilotMetrics(pilotId);
    }

  } catch (error) {
    console.error('Metrics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'internal_error', message: 'Failed to fetch metrics' } },
      { status: 500 }
    );
  }
}

async function getPilotMetrics(pilotId: string) {
  // Get or generate metrics
  let metrics = metricsStore.get(pilotId);
  
  if (!metrics) {
    metrics = generateMockMetrics(pilotId);
    metricsStore.set(pilotId, metrics);
  }

  // Enrich with KPI definitions
  const enrichedKPIs = metrics.kpis.map(measurement => {
    const definition = KPI_DEFINITIONS.find(d => d.id === measurement.kpiId)!;
    return {
      ...definition,
      ...measurement,
      achievement: Math.round((measurement.currentValue / definition.targetValue) * 100),
      status: measurement.currentValue >= definition.targetValue ? 'exceeding' :
              measurement.currentValue >= definition.targetValue * 0.8 ? 'on_track' :
              measurement.currentValue >= definition.targetValue * 0.6 ? 'at_risk' : 'critical',
      trend: !measurement.previousValue ? 'stable' :
              measurement.currentValue > measurement.previousValue ? 'up' :
              measurement.currentValue < measurement.previousValue ? 'down' : 'stable'
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      ...metrics,
      kpis: enrichedKPIs,
      kpiDefinitions: KPI_DEFINITIONS
    }
  });
}

async function getKPIDetails(pilotId: string) {
  const metrics = metricsStore.get(pilotId) || generateMockMetrics(pilotId);

  const detailedKPIs = metrics.kpis.map(measurement => {
    const definition = KPI_DEFINITIONS.find(d => d.id === measurement.kpiId)!;
    const achievement = (measurement.currentValue / definition.targetValue) * 100;
    
    return {
      ...definition,
      currentValue: measurement.currentValue,
      achievement: Math.round(achievement),
      gap: Math.max(0, definition.targetValue - measurement.currentValue),
      status: achievement >= 100 ? 'exceeding' : achievement >= 80 ? 'on_track' : achievement >= 60 ? 'at_risk' : 'critical',
      recommendations: getRecommendations(definition.id, achievement)
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      pilotId,
      kpis: detailedKPIs,
      generatedAt: new Date().toISOString()
    }
  });
}

function getRecommendations(kpiId: string, achievement: number): string[] {
  const recommendations: Record<string, string[]> = {
    'tracking_coverage': [
      'Increase product registration to meet targets',
      'Ensure all products have complete event chains',
      'Review products missing checkpoint data'
    ],
    'event_accuracy': [
      'Review error logs for common failure patterns',
      'Retrain staff on proper scanning procedures',
      'Check network connectivity at warehouse locations'
    ],
    'certificate_rate': [
      'Automate certificate generation triggers',
      'Train QC staff on approval workflows',
      'Review certificate template configurations'
    ],
    'user_adoption': [
      'Conduct refresher training sessions',
      'Identify and address adoption barriers',
      'Share success stories from power users'
    ],
    'processing_time': [
      'Check API response times',
      'Optimize mobile app performance',
      'Review server load during peak hours'
    ]
  };

  if (achievement >= 100) {
    return ['Maintain current performance levels'];
  }

  return recommendations[kpiId] || ['Review this metric and identify improvement opportunities'];
}

async function getBaselineComparison(pilotId: string) {
  const comparisonData = generateBaselineComparison(pilotId);

  return NextResponse.json({
    success: true,
    data: {
      pilotId,
      comparisons: comparisonData,
      summary: {
        averageImprovement: comparisonData
          .filter(c => c.improvement !== null)
          .reduce((sum, c) => sum + c.improvement!, 0) / comparisonData.filter(c => c.improvement !== null).length,
        metricsImproved: comparisonData.filter(c => c.improvement && c.improvement > 50).length,
        totalMetrics: comparisonData.length
      },
      generatedAt: new Date().toISOString()
    }
  });
}

async function getBenchmarkData(pilotId: string) {
  const currentMetrics = metricsStore.get(pilotId) || generateMockMetrics(pilotId);

  // Industry benchmarks (these would come from database in production)
  const industryBenchmarks = {
    pharmaceuticals: {
      tracking_coverage: 85,
      event_accuracy: 99.5,
      certificate_rate: 95,
      user_adoption: 90,
      customer_satisfaction: 4.6
    },
    agricultural: {
      tracking_coverage: 75,
      event_accuracy: 98,
      certificate_rate: 85,
      user_adoption: 80,
      customer_satisfaction: 4.3
    },
    industrial: {
      tracking_coverage: 80,
      event_accuracy: 99,
      certificate_rate: 90,
      user_adoption: 85,
      customer_satisfaction: 4.4
    }
  };

  // Use general benchmark as default
  const benchmark = industryBenchmarks.pharmaceuticals; // Would be dynamic based on pilot industry

  const benchmarkComparison = Object.entries(benchmark).map(([key, value]) => {
    const kpi = currentMetrics.kpis.find(k => k.kpiId === key);
    return {
      kpiId: key,
      kpiName: KPI_DEFINITIONS.find(d => d.id === key)?.name || key,
      yourValue: kpi?.currentValue || 0,
      industryBenchmark: value,
      versusBenchmark: kpi ? ((kpi.currentValue - value) / value * 100).toFixed(1) : 'N/A',
      ranking: kpi?.currentValue >= value * 1.1 ? 'above_average' :
               kpi?.currentValue >= value * 0.9 ? 'at_average' : 'below_average'
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      pilotId,
      benchmarkComparison,
      industryAverages: benchmark,
      yourPosition: {
        aboveAverage: benchmarkComparison.filter(b => b.ranking === 'above_average').length,
        atAverage: benchmarkComparison.filter(b => b.ranking === 'at_average').length,
        belowAverage: benchmarkComparison.filter(b => b.ranking === 'below_average').length
      },
      generatedAt: new Date().toISOString()
    }
  });
}

async function exportMetricsReport(pilotId: string) {
  const metrics = metricsStore.get(pilotId) || generateMockMetrics(pilotId);
  const baseline = generateBaselineComparison(pilotId);

  const report = {
    reportId: `RPT-${pilotId}-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    pilotId,
    executiveSummary: {
      overallScore: metrics.summary.overallScore,
      successProbability: metrics.summary.successProbability,
      recommendation: metrics.summary.recommendation.toUpperCase(),
      recommendationText: metrics.summary.recommendation === 'go' 
        ? 'Pilot is performing well. Recommended for full rollout.'
        : metrics.summary.recommendation === 'conditional'
        ? 'Pilot shows promise but needs attention in some areas before rollout.'
        : 'Pilot requires significant improvements before considering full rollout.'
    },
    scores: {
      technical: metrics.summary.technicalScore,
      operational: metrics.summary.operationalScore,
      business: metrics.summary.businessScore,
      overall: metrics.summary.overallScore
    },
    kpiDetails: metrics.kpis.map(m => {
      const def = KPI_DEFINITIONS.find(d => d.id === m.kpiId)!;
      return {
        name: def.name,
        category: def.category,
        current: m.currentValue,
        target: def.targetValue,
        achievement: `${Math.round((m.currentValue / def.targetValue) * 100)}%`,
        status: m.currentValue >= def.targetValue ? 'On Target' : 'Below Target'
      };
    }),
    baselineImprovements: baseline.map(b => ({
      metric: b.metric,
      before: b.beforePilot,
      after: b.currentPilot,
      improvement: b.improvement ? `${b.improvement}%` : 'N/A',
      unit: b.unit
    })),
    nextSteps: metrics.summary.recommendation === 'go' 
      ? [
          'Schedule full rollout planning meeting',
          'Prepare contract for annual subscription',
          'Plan phased migration of remaining products',
          'Schedule advanced training sessions'
        ]
      : metrics.summary.recommendation === 'conditional'
      ? [
          'Address underperforming KPIs identified in this report',
          'Extend pilot period by 7 days if needed',
          'Conduct additional staff training',
          'Review integration configuration'
        ]
      : [
          'Schedule review meeting with account manager',
          'Identify root causes of poor performance',
          'Consider alternative implementation approach',
          'Re-evaluate fit for blockchain solution'
        ]
  };

  return NextResponse.json({
    success: true,
    data: report,
    message: 'Metrics report generated successfully'
  });
}

// POST /api/blockchain/pilot/metrics - Record custom metrics or trigger recalculation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pilotId, action, kpiMeasurements } = body;

    if (!pilotId) {
      return NextResponse.json(
        { success: false, error: { code: 'validation_error', message: 'Pilot ID is required' } },
        { status: 400 }
      );
    }

    switch (action) {
      case 'record':
        return recordKPI Measurements(pilotId, kpiMeasurements);
      
      case 'recalculate':
        return recalculateMetrics(pilotId);
      
      default:
        return NextResponse.json(
          { success: false, error: { code: 'invalid_action', message: `Unknown action: ${action}` } },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error recording metrics:', error);
    return NextResponse.json(
      { success: false, error: { code: 'internal_error', message: 'Failed to process metrics request' } },
      { status: 500 }
    );
  }
}

async function recordKPI_Measurements(pilotId: string, measurements: any[]) {
  // In production, validate and store measurements in time-series database
  
  return NextResponse.json({
    success: true,
    message: `${measurements.length} KPI measurements recorded successfully`,
    data: {
      recordedCount: measurements.length,
      pilotId,
      recordedAt: new Date().toISOString()
    }
  }, { status: 201 });
}

async function recalculateMetrics(pilotId: string) {
  // Regenerate metrics with fresh calculations
  const newMetrics = generateMockMetrics(pilotId);
  metricsStore.set(pilotId, newMetrics);

  return NextResponse.json({
    success: true,
    data: newMetrics,
    message: 'Metrics recalculated successfully'
  });
}

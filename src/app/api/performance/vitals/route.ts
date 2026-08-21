import { NextRequest, NextResponse } from 'next/server';

/**
 * Types for Web Vitals data
 */
interface WebVitalEntry {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries?: Array<{
    startTime: number;
    duration: number;
  }>;
  navigationType: string;
  id: string;
  page: string;
  timestamp: string;
}

interface VitalsBatch {
  sessionId?: string;
  page: string;
  userAgent: string;
  connection?: {
    effectiveType: string;
    rtt: number;
    downlink: number;
  };
  device?: {
    type: 'desktop' | 'mobile' | 'tablet';
    memory?: number;
    hardwareConcurrency?: number;
  };
  location?: {
    country?: string;
    city?: string;
  };
  vitals: WebVitalEntry[];
}

// In-memory storage for demo (use database in production)
const vitalsStore: Map<string, VitalsBatch[]> = new Map();
const MAX_STORE_SIZE = 10000;

/**
 * POST /api/performance/vitals
 * Record Core Web Vitals data from client-side
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VitalsBatch | VitalsBatch[];

    // Support both single entry and batch
    const entries = Array.isArray(body) ? body : [body];

    // Validate entries
    if (entries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No vitals data provided' },
        { status: 400 }
      );
    }

    if (entries.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 entries per batch' },
        { status: 400 }
      );
    }

    // Process and store each entry
    let storedCount = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        // Validate required fields
        if (!entry.vitals || !Array.isArray(entry.vitals)) {
          errors.push('Invalid vitals array');
          continue;
        }

        if (!entry.page) {
          errors.push('Missing page field');
          continue;
        }

        // Add timestamp if not present
        const processedEntry = {
          ...entry,
          timestamp: entry.timestamp || new Date().toISOString(),
          userAgent: entry.userAgent || request.headers.get('user-agent') || '',
        };

        // Store by date key for efficient querying
        const dateKey = new Date().toISOString().split('T')[0];
        
        if (!vitalsStore.has(dateKey)) {
          vitalsStore.set(dateKey, []);
        }
        
        const dayEntries = vitalsStore.get(dateKey)!;
        dayEntries.push(processedEntry);
        storedCount++;

        // Enforce store size limit
        if (dayEntries.length > MAX_STORE_SIZE) {
          dayEntries.shift();
        }

      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Processing error');
      }
    }

    // Calculate aggregate stats for response
    const allVitals = entries.flatMap(e => e.vitals);
    const aggregates = calculateAggregates(allVitals);

    return NextResponse.json({
      success: true,
      message: `Stored ${storedCount} vital entries`,
      data: {
        storedCount,
        errors: errors.length > 0 ? errors : undefined,
        aggregates,
      },
    });

  } catch (error) {
    console.error('Vitals API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process vitals data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/performance/vitals
 * Retrieve aggregated performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'day'; // hour, day, week
    const page = searchParams.get('page'); // Filter by page
    const metric = searchParams.get('metric'); // Filter by specific metric

    // Get all stored data
    const allData: VitalsBatch[] = [];
    
    if (period === 'hour') {
      const todayKey = new Date().toISOString().split('T')[0];
      const dayData = vitalsStore.get(todayKey) || [];
      // Only last hour
      const oneHourAgo = Date.now() - 3600000;
      allData.push(...dayData.filter(d => 
        new Date(d.timestamp).getTime() > oneHourAgo
      ));
    } else if (period === 'day') {
      const todayKey = new Date().toISOString().split('T')[0];
      allData.push(...(vitalsStore.get(todayKey) || []));
    } else {
      // Week - get last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        allData.push(...(vitalsStore.get(key) || []));
      }
    }

    // Apply filters
    let filteredData = allData;
    if (page) {
      filteredData = filteredData.filter(d => d.page.includes(page));
    }

    // Calculate metrics
    const allVitals = filteredData.flatMap(d => d.vitals);
    
    let metricData = allVitals;
    if (metric) {
      metricData = allVitals.filter(v => v.name.toLowerCase() === metric.toLowerCase());
    }

    const aggregates = calculateAggregates(metricData);

    // Page-level breakdown
    const pageBreakdown = getPageBreakdown(filteredData);

    // Connection type breakdown
    const connectionBreakdown = getConnectionBreakdown(filteredData);

    return NextResponse.json({
      success: true,
      data: {
        period,
        totalSessions: filteredData.length,
        totalVitalsRecorded: allVitals.length,
        aggregates,
        pageBreakdown,
        connectionBreakdown,
        samplePages: [...new Set(filteredData.map(d => d.page))].slice(0, 10),
      },
    });

  } catch (error) {
    console.error('Vitals GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vitals data' },
      { status: 500 }
    );
  }
}

// Helper functions

function calculateAggregates(vitals: WebVitalEntry[]) {
  if (vitals.length === 0) {
    return {
      LCP: null,
      FID: null,
      CLS: null,
      INP: null,
      overallScore: null,
    };
  }

  // Group by metric name
  const grouped = vitals.reduce((acc, v) => {
    if (!acc[v.name]) acc[v.name] = [];
    acc[v.name].push(v.value);
    return acc;
  }, {} as Record<string, number[]>);

  const calcStats = (values: number[]) => {
    if (values.length === 0) return null;
    values.sort((a, b) => a - b);
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: values[Math.floor(values.length * 0.5)],
      p75: values[Math.floor(values.length * 0.75)],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)],
      min: values[0],
      max: values[values.length - 1],
      count: values.length,
    };
  };

  const lcpStats = calcStats(grouped['LCP'] || []);
  const fidStats = calcStats(grouped['FID'] || []);
  const clsStats = calcStats(grouped['CLS'] || []);
  const inpStats = calcStats(grouped['INP'] || []);

  // Calculate overall score (simplified)
  const scores = [];
  if (lcpStats) scores.push(lcpStats.avg <= 2.5 ? 100 : lcpStats.avg <= 4 ? 66 : 33);
  if (fidStats) scores.push(fidStats.avg <= 100 ? 100 : fidStats.avg <= 300 ? 66 : 33);
  if (clsStats) scores.push(clsStats.avg <= 0.1 ? 100 : clsStats.avg <= 0.25 ? 66 : 33);
  if (inpStats) scores.push(inpStats.avg <= 200 ? 100 : inpStats.avg <= 500 ? 66 : 33);

  return {
    LCP: lcpStats,
    FID: fidStats,
    CLS: clsStats,
    INP: inpStats,
    overallScore: scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null,
  };
}

function getPageBreakdown(data: VitalsBatch[]) {
  const pages = new Map<string, { vitals: WebVitalEntry[]; sessions: number }>();

  data.forEach(entry => {
    if (!pages.has(entry.page)) {
      pages.set(entry.page, { vitals: [], sessions: 0 });
    }
    const page = pages.get(entry.page)!;
    page.vitals.push(...entry.vitals);
    page.sessions++;
  });

  return Array.from(pages.entries()).map(([page, data]) => ({
    page,
    sessions: data.sessions,
    ...calculateAggregates(data.vitals),
  }));
}

function getConnectionBreakdown(data: VitalsBatch[]) {
  const connections = new Map<string, { vitals: WebVitalEntry[]; sessions: number }>();

  data.forEach(entry => {
    const type = entry.connection?.effectiveType || 'unknown';
    if (!connections.has(type)) {
      connections.set(type, { vitals: [], sessions: 0 });
    }
    const conn = connections.get(type)!;
    conn.vitals.push(...entry.vitals);
    conn.sessions++;
  });

  return Array.from(connections.entries()).map(([type, data]) => ({
    connectionType: type,
    sessions: data.sessions,
    percentage: ((data.sessions / Math.max(data.length, 1)) * 100).toFixed(1),
    ...calculateAggregates(data.vitals),
  }));
}

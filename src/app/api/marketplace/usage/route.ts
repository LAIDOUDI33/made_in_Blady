// API Usage Tracking Endpoint
// Suivi de l'utilisation de l'API pour le tableau de bord développeur

import { NextRequest, NextResponse } from 'next/server';

// Mock usage data - in production, this would come from a database
const mockUsageData = {
  today: {
    requests: 147,
    errors: 3,
    avgLatency: 245,
    topEndpoints: [
      { path: '/api/v1/products', count: 89 },
      { path: '/api/v1/search', count: 42 },
      { path: '/api/v1/categories', count: 16 },
    ],
  },
  month: {
    requests: 4289,
    errors: 47,
    avgLatency: 238,
    bandwidthUsed: '2.4 GB',
  },
  quota: {
    limit: 10000,
    used: 4289,
    remaining: 5711,
    percentUsed: 42.89,
    resetsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

/**
 * GET /api/marketplace/usage - Get API usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const period = request.nextUrl.searchParams.get('period') || 'today';

    // In production, fetch real usage data from database
    let data;
    if (period === 'today' || period === 'day') {
      data = mockUsageData.today;
    } else if (period === 'month' || period === '30d') {
      data = { ...mockUsageData.month, quota: mockUsageData.quota };
    } else {
      data = { ...mockUsageData.today, quota: mockUsageData.quota };
    }

    return NextResponse.json({
      success: true,
      userId,
      period,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/usage - Record an API call (called internally)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, endpoint, method, statusCode, latency, userId } = body;

    // Validate required fields
    if (!apiKey || !endpoint) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: apiKey, endpoint' },
        { status: 400 }
      );
    }

    // In production:
    // 1. Validate API key
    // 2. Check rate limits
    // 3. Record usage in database
    // 4. Update user's quota

    console.log(`[API Usage] ${method} ${endpoint} - ${statusCode} (${latency}ms)`);

    return NextResponse.json({
      success: true,
      recorded: true,
      message: 'Usage recorded successfully',
    });
  } catch (error) {
    console.error('Error recording usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

// GET /api/developer/usage - Get usage statistics for API keys
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKeyId = searchParams.get('apiKeyId');
    const days = parseInt(searchParams.get('days') || '30');
    
    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { success: false, error: 'Days must be between 1 and 365', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Generate mock usage data
    const now = new Date();
    const requestsByDay = Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (Math.min(days, 30) - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        requests: Math.floor(Math.random() * 500) + 50,
        errors: Math.floor(Math.random() * 20),
        avgResponseTime: Math.floor(Math.random() * 200) + 50,
      };
    });

    const totalRequests = requestsByDay.reduce((sum, d) => sum + d.requests, 0);
    const totalErrors = requestsByDay.reduce((sum, d) => sum + d.errors, 0);
    const avgResponseTime = Math.round(
      requestsByDay.reduce((sum, d) => sum + d.avgResponseTime * d.requests, 0) / totalRequests
    );

    const popularEndpoints = [
      { endpoint: '/v2/products', count: Math.floor(totalRequests * 0.29), percentage: 29.3 },
      { endpoint: '/v2/search', count: Math.floor(totalRequests * 0.21), percentage: 20.7 },
      { endpoint: '/v2/companies', count: Math.floor(totalRequests * 0.14), percentage: 13.6 },
      { endpoint: '/v2/orders', count: Math.floor(totalRequests * 0.12), percentage: 12.0 },
      { endpoint: '/v2/rfqs', count: Math.floor(totalRequests * 0.08), percentage: 7.8 },
      { endpoint: '/v2/analytics', count: Math.floor(totalRequests * 0.06), percentage: 6.4 },
      { endpoint: '/other', count: Math.floor(totalRequests * 0.05), percentage: 4.7 },
    ];

    // Quota information
    const quotaInfo = {
      plan: 'pro',
      dailyLimit: 10000,
      dailyUsed: totalRequests / 30,
      dailyRemaining: Math.max(0, 10000 - Math.round(totalRequests / 30)),
      monthlyLimit: 300000,
      monthlyUsed: totalRequests,
      monthlyRemaining: Math.max(0, 300000 - totalRequests),
      resetAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRequests,
          avgResponseTime,
          errorRate: ((totalErrors / totalRequests) * 100).toFixed(2),
          period: `${days} days`,
        },
        requestsByDay,
        popularEndpoints,
        quota: quotaInfo,
        rateLimitStatus: {
          limit: 1000,
          remaining: 987,
          resetAt: new Date(now.getTime() + 60000).toISOString(),
        },
      },
      meta: {
        queriedAt: now.toISOString(),
        apiVersion: 'v2',
        ...(apiKeyId && { apiKeyId }),
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage statistics', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

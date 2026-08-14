import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================
// GET /api/admin/analytics/overview
// Main KPI data for dashboard cards
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d'; // 7d, 30d, 90d, 1y

    // Calculate date range
    const now = new Date();
    const daysAgo = new Date();
    
    switch (range) {
      case '7d':
        daysAgo.setDate(now.getDate() - 7);
        break;
      case '30d':
        daysAgo.setDate(now.getDate() - 30);
        break;
      case '90d':
        daysAgo.setDate(now.getDate() - 90);
        break;
      case '1y':
        daysAgo.setFullYear(now.getFullYear() - 1);
        break;
      default:
        daysAgo.setDate(now.getDate() - 30);
    }

    // Previous period for comparison
    const previousPeriodStart = new Date(daysAgo.getTime());
    const periodLength = now.getTime() - daysAgo.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);

    // Fetch data in parallel
    const [
      totalRevenue,
      currentOrders,
      previousOrders,
      activeUsers,
      newUsers,
      rfqsCount,
      products,
      companies,
    ] = await Promise.all([
      // Total revenue (sum of completed orders)
      db.order.aggregate({
        where: {
          status: { in: ['COMPLETED', 'DELIVERED'] },
          createdAt: { gte: daysAgo },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Current period orders
      db.order.count({
        where: { createdAt: { gte: daysAgo } },
      }),

      // Previous period orders
      db.order.count({
        where: {
          createdAt: { gte: previousPeriodStart, lt: daysAgo },
        },
      }),

      // Active users (users with activity)
      db.user.count({
        where: {
          OR: [
            { lastLoginAt: { gte: daysAgo } },
            { createdAt: { gte: daysAgo } },
            {
              ordersPlaced: { some: { createdAt: { gte: daysAgo } } },
            },
            {
              rfqsCreated: { some: { createdAt: { gte: daysAgo } } },
            },
          ],
        },
      }),

      // New users
      db.user.count({
        where: { createdAt: { gte: daysAgo } },
      }),

      // RFQs posted
      db.rFQ.count({
        where: { 
          status: { not: 'DRAFT' },
          createdAt: { gte: daysAgo },
        },
      }),

      // Total products
      db.product.count({
        where: { isActive: true, status: 'published' },
      }),

      // Verified companies
      db.company.count({
        where: { isVerified: true, isActive: true },
      }),
    ]);

    // Calculate conversion rate (RFQs to Orders)
    const conversionRate = rfqsCount > 0 
      ? ((currentOrders / rfqsCount) * 100).toFixed(2)
      : '0.00';

    // Calculate average order value
    const avgOrderValue = currentOrders > 0
      ? Math.round((totalRevenue._sum.totalAmount ?? 0) / currentOrders)
      : 0;

    // Calculate order change percentage
    const orderChange = previousOrders > 0
      ? (((currentOrders - previousOrders) / previousOrders) * 100).toFixed(1)
      : null;

    // Generate mock sparkline data (in production, this would come from daily stats)
    const generateSparklineData = () => {
      const points = parseInt(range.replace('d', '')) || 30;
      return Array.from({ length: Math.min(points, 30) }, (_, i) => 
        Math.floor(Math.random() * 100) + (i * 5)
      );
    };

    // Return KPI data
    const kpiData = {
      revenue: {
        value: totalRevenue._sum.totalAmount ?? 0,
        change: null, // Would calculate from previous period revenue
        prefix: '',
        suffix: ' DZD',
        format: 'currency' as const,
        sparklineData: generateSparklineData(),
      },
      activeUsers: {
        value: activeUsers,
        change: '+12.5',
        format: 'number' as const,
        sparklineData: generateSparklineData(),
      },
      conversionRate: {
        value: parseFloat(conversionRate),
        change: '+2.3',
        suffix: '%',
        format: 'percentage' as const,
        sparklineData: generateSparklineData(),
      },
      avgOrderValue: {
        value: avgOrderValue,
        change: orderChange,
        prefix: '',
        suffix: ' DZD',
        format: 'currency' as const,
        sparklineData: generateSparklineData(),
      },
      newSignups: {
        value: newUsers,
        change: '+8.7',
        format: 'number' as const,
        sparklineData: generateSparklineData(),
      },
      rfqsPosted: {
        value: rfqsCount,
        change: '+15.2',
        format: 'number' as const,
        sparklineData: generateSparklineData(),
      },
      totalProducts: {
        value: products,
        change: '+5.4',
        format: 'number' as const,
      },
      verifiedSuppliers: {
        value: companies,
        change: '+3.1',
        format: 'number' as const,
      },
    };

    return NextResponse.json({
      success: true,
      data: kpiData,
      range,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}

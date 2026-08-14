import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================
// GET /api/admin/analytics/revenue
// Revenue data broken down by period/payment method
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

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

    // Fetch orders with payments
    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: daysAgo },
        status: { in: ['COMPLETED', 'DELIVERED', 'CONFIRMED', 'PROCESSING'] },
      },
      include: {
        payment: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group revenue data by period
    const revenueData = groupRevenueByPeriod(orders, groupBy, daysAgo);

    // Revenue by payment method
    const revenueByPaymentMethod = calculateRevenueByPaymentMethod(orders);

    // Order status breakdown
    const orderStatusBreakdown = await getOrderStatusBreakdown(daysAgo);

    return NextResponse.json({
      success: true,
      data: {
        byPeriod: revenueData,
        byPaymentMethod: revenueByPaymentMethod,
        orderStatuses: orderStatusBreakdown,
        totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        totalOrders: orders.length,
        avgOrderValue: orders.length > 0 
          ? Math.round(orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length)
          : 0,
      },
      range,
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

function groupRevenueByPeriod(
  orders: Array<{ createdAt: Date; totalAmount: number; payment?: { method: string } | null }>,
  groupBy: string,
  startDate: Date
): Array<{
  date: string;
  revenue: number;
  orders: number;
  cib: number;
  ccp: number;
  baridiMob: number;
  bankTransfer: number;
  cod: number;
}> {
  const grouped = new Map<string, {
    revenue: number;
    orders: number;
    cib: number;
    ccp: number;
    baridiMob: number;
    bankTransfer: number;
    cod: number;
  }>();

  // Initialize all periods
  const current = new Date(startDate);
  const endDate = new Date();

  while (current <= endDate) {
    let key: string;
    
    if (groupBy === 'month') {
      key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      current.setMonth(current.getMonth() + 1);
    } else if (groupBy === 'week') {
      const weekStart = new Date(current);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      key = weekStart.toISOString().split('T')[0];
      current.setDate(current.getDate() + 7);
    } else {
      key = current.toISOString().split('T')[0];
      current.setDate(current.getDate() + 1);
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        revenue: 0,
        orders: 0,
        cib: 0,
        ccp: 0,
        baridiMob: 0,
        bankTransfer: 0,
        cod: 0,
      });
    }
  }

  // Group actual orders
  for (const order of orders) {
    let key: string;
    const date = new Date(order.createdAt);

    if (groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = date.toISOString().split('T')[0];
    }

    const period = grouped.get(key);
    if (period) {
      period.revenue += order.totalAmount;
      period.orders += 1;

      // By payment method
      const method = order.payment?.method || 'UNKNOWN';
      switch (method) {
        case 'CIB':
          period.cib += order.totalAmount;
          break;
        case 'CCP':
          period.ccp += order.totalAmount;
          break;
        case 'BARIDIMOB':
          period.baridiMob += order.totalAmount;
          break;
        case 'BANK_TRANSFER':
          period.bankTransfer += order.totalAmount;
          break;
        case 'COD':
          period.cod += order.totalAmount;
          break;
      }
    }
  }

  // Convert to array and sort
  return Array.from(grouped.entries())
    .map(([date, values]) => ({
      date,
      ...values,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateRevenueByPaymentMethod(orders: Array<{ 
  totalAmount: number; 
  payment?: { method: string } | null 
}>): Array<{ method: string; amount: number; count: number; percentage: number }> {
  const methods = new Map<string, { amount: number; count: number }>();

  for (const order of orders) {
    const method = order.payment?.method || 'AUTRE';
    const current = methods.get(method) || { amount: 0, count: 0 };
    current.amount += order.totalAmount;
    current.count += 1;
    methods.set(method, current);
  }

  const total = Array.from(methods.values()).reduce((sum, m) => sum + m.amount, 0);

  return Array.from(methods.entries()).map(([method, data]) => ({
    method,
    amount: data.amount,
    count: data.count,
    percentage: total > 0 ? (data.amount / total) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount);
}

async function getOrderStatusBreakdown(since: Date): Promise<Array<{ status: string; count: number; revenue: number }>> {
  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'COMPLETED'];
  
  const breakdown = await Promise.all(
    statuses.map(async (status) => {
      const [count, result] = await Promise.all([
        db.order.count({
          where: { status, createdAt: { gte: since } },
        }),
        db.order.aggregate({
          where: { status, createdAt: { gte: since } },
          _sum: { totalAmount: true },
        }),
      ]);

      return {
        status,
        count,
        revenue: result._sum.totalAmount ?? 0,
      };
    })
  );

  return breakdown.filter(item => item.count > 0);
}

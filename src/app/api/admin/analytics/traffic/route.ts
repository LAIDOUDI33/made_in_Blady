import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================
// GET /api/admin/analytics/traffic
// Traffic data for charts (date range params)
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

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

    // Fetch daily stats if available, otherwise generate from events
    const dailyStats = await db.dailyStats.findMany({
      where: {
        date: { gte: daysAgo },
      },
      orderBy: { date: 'asc' },
    });

    // If we have daily stats data, use it
    if (dailyStats.length > 0) {
      const trafficData = dailyStats.map(stat => ({
        date: stat.date.toISOString().split('T')[0],
        pageViews: stat.pageViews,
        uniquePageViews: stat.uniquePageViews,
        newUsers: stat.newUsers,
        returningUsers: stat.returningUsers,
        organicTraffic: stat.organicTraffic,
        directTraffic: stat.directTraffic,
        referralTraffic: stat.referralTraffic,
      }));

      return NextResponse.json({
        success: true,
        data: trafficData,
        range,
      });
    }

    // Generate mock traffic data for development
    const trafficData = generateMockTrafficData(daysAgo, now);

    return NextResponse.json({
      success: true,
      data: trafficData,
      range,
      isMockData: true,
    });
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch traffic data' },
      { status: 500 }
    );
  }
}

// ============================================
// Mock Data Generator
// ============================================

function generateMockTrafficData(startDate: Date, endDate: Date): Array<{
  date: string;
  pageViews: number;
  uniquePageViews: number;
  newUsers: number;
  returningUsers: number;
  organicTraffic: number;
  directTraffic: number;
  referralTraffic: number;
}> {
  const data = [];
  const current = new Date(startDate);
  
  // Base values with some randomness
  let basePageViews = 800 + Math.random() * 400;
  let baseNewUsers = 20 + Math.random() * 15;

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Adjust for weekends (less traffic)
    const weekendFactor = isWeekend ? 0.7 : 1;
    
    // Add some trend and seasonality
    const trendFactor = 1 + ((current.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 0.3;
    
    // Random variation
    const randomVariation = 0.8 + Math.random() * 0.4;

    const pageViews = Math.floor(basePageViews * weekendFactor * trendFactor * randomVariation);
    const uniqueViews = Math.floor(pageViews * (0.65 + Math.random() * 0.15));
    const newUsers = Math.floor(baseNewUsers * weekendFactor * randomVariation);
    const returningUsers = Math.floor(uniqueViews * 0.4);

    // Traffic sources
    const organic = Math.floor(uniqueViews * (0.45 + Math.random() * 0.1));
    const direct = Math.floor(uniqueViews * (0.3 + Math.random() * 0.08));
    const referral = uniqueViews - organic - direct;

    data.push({
      date: current.toISOString().split('T')[0],
      pageViews,
      uniquePageViews: uniqueViews,
      newUsers,
      returningUsers,
      organicTraffic: organic,
      directTraffic: direct,
      referralTraffic: Math.max(0, referral),
    });

    // Slightly increase base for next day
    basePageViews += Math.random() * 20 - 5;
    baseNewUsers += Math.random() * 2 - 0.5;

    current.setDate(current.getDate() + 1);
  }

  return data;
}

/**
 * GET /api/admin/security/audit-logs/statistics
 * Get audit log statistics for dashboard (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Date range parameters (default: last 7 days)
    const endDate = new Date();
    const startDateParam = searchParams.get('startDate');
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60_1000); // Last 7 days

    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Execute all statistics queries in parallel
    const [
      totalEvents,
      failedEvents,
      todayEvents,
      todayFailedEvents,
      actionBreakdown,
      mostActiveUsers,
      recentFailedAttempts,
      eventsByDayRaw,
      failedByHourRaw,
    ] = await Promise.all([
      // Total events in range
      db.auditLog.count({ where }),
      
      // Failed events in range
      db.auditLog.count({ where: { ...where, success: false } }),
      
      // Today's events
      db.auditLog.count({
        where: {
          ...where,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      
      // Today's failed events
      db.auditLog.count({
        where: {
          ...where,
          success: false,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),

      // Action breakdown (top 10)
      db.auditLog.groupBy({
        by: ['action'],
        _count: { id: true },
        where,
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Most active users (top 10)
      db.auditLog.groupBy({
        by: ['userId', 'userRole'],
        _count: { id: true },
        where: { ...where, userId: { not: null } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Recent failed attempts (last 50)
      db.auditLog.findMany({
        where: { ...where, success: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          userId: true,
          userRole: true,
          action: true,
          ipAddress: true,
          errorMessage: true,
          createdAt: true,
        },
      }),

      // Events per day (for chart)
      db.$queryRaw`
        SELECT DATE(createdAt) as date, COUNT(*) as count 
        FROM audit_logs 
        WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
        GROUP BY DATE(createdAt) 
        ORDER BY date ASC
      ` as Array<{ date: string; count: bigint }>,

      // Failed attempts by hour of day (for security heatmap)
      db.$queryRaw`
        SELECT CAST(strftime('%H', createdAt) AS INTEGER) as hour, COUNT(*) as count 
        FROM audit_logs 
        WHERE success = 0 AND createdAt >= ${startDate} AND createdAt <= ${endDate}
        GROUP BY hour 
        ORDER BY hour ASC
      ` as Array<{ hour: number; count: bigint }>,
    ]);

    // Calculate success rate
    const successRate = totalEvents > 0 
      ? Math.round(((totalEvents - failedEvents) / totalEvents) * 100) 
      : 100;

    // Get user details for most active users
    const mostActiveUsersWithDetails = await Promise.all(
      mostActiveUsers.map(async (item) => {
        let userName = 'Inconnu';
        let userEmail = '';
        
        if (item.userId) {
          try {
            const user = await db.user.findUnique({
              where: { id: item.userId },
              select: { firstName: true, lastName: true, email: true },
            });
            if (user) {
              userName = `${user.firstName} ${user.lastName}`;
              userEmail = user.email;
            }
          } catch {
            // User might not exist
          }
        }

        return {
          userId: item.userId!,
          userRole: item.userRole,
          userName,
          userEmail,
          eventCount: Number(item._count.id),
        };
      })
    );

    return NextResponse.json({
      success: true,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      overview: {
        totalEvents,
        failedEvents,
        successRate,
        todayEvents,
        todayFailedEvents,
      },
      actionBreakdown: actionBreakdown.map(item => ({
        action: item.action,
        count: Number(item._count.id),
      })),
      mostActiveUsers: mostActiveUsersWithDetails,
      recentFailedAttempts: recentFailedAttempts.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      charts: {
        eventsPerDay: (eventsByDayRaw).map(row => ({
          date: row.date,
          count: Number(row.count),
        })),
        failedByHour: Array.from({ length: 24 }, (_, i) => {
          const found = (failedByHourRaw).find(r => r.hour === i);
          return {
            hour: i,
            label: `${i.toString().padStart(2, '0')}:00`,
            count: found ? Number(found.count) : 0,
          };
        }),
      },
    });

  } catch (error) {
    console.error('Error fetching audit log statistics:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

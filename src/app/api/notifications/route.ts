/**
 * Notifications API Route
 * 
 * GET /api/notifications - Get user's notifications
 * PUT /api/notifications/read-all - Mark all as read
 * DELETE /api/notifications - Delete notifications (bulk)
 * 
 * @module api/notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { NotificationType, NotificationCategory } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as NotificationType | null;
    const category = searchParams.get('category') as NotificationCategory | null;
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = { userId: session.user.id };
    
    if (type) where.type = type;
    if (category) where.category = category;
    if (isRead !== null && isRead !== '') {
      where.isRead = isRead === 'true';
    }

    // Fetch notifications and counts in parallel
    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    // Parse JSON data for each notification
    const parsedNotifications = notifications.map(n => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null,
    }));

    return NextResponse.json({
      success: true,
      notifications: parsedNotifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      unreadCount,
    });

  } catch (error: any) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle "mark all as read" action
    if (action === 'read-all') {
      const result = await db.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: `${result.count} notification(s) marquée(s) comme lue(s)`,
        markedCount: result.count,
      });
    }

    return NextResponse.json(
      { error: 'Action non reconnue. Utilisez ?action=read-all' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Update notifications error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des notifications' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const ids = searchParams.get('ids');

    let deletedCount = 0;

    if (action === 'read' && ids) {
      // Delete specific read notifications by IDs
      const idArray = ids.split(',');
      deletedCount = await db.notification.deleteMany({
        where: {
          id: { in: idArray },
          userId: session.user.id,
          isRead: true,
        },
      }).then(r => r.count);
    } else if (action === 'all-read') {
      // Delete all read notifications
      deletedCount = await db.notification.deleteMany({
        where: {
          userId: session.user.id,
          isRead: true,
        },
      }).then(r => r.count);
    } else if (action === 'all') {
      // Delete all notifications (use with caution)
      deletedCount = await db.notification.deleteMany({
        where: { userId: session.user.id },
      }).then(r => r.count);
    } else {
      return NextResponse.json(
        { error: 'Action non reconnue. Utilisez ?action=all-read ou ?action=read&ids=id1,id2' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${deletedCount} notification(s) supprimée(s)`,
      deletedCount,
    });

  } catch (error: any) {
    console.error('Delete notifications error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des notifications' },
      { status: 500 }
    );
  }
}

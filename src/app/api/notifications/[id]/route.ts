/**
 * Single Notification API Route
 * 
 * GET /api/notifications/[id] - Get single notification
 * PUT /api/notifications/[id]/read - Mark as read
 * DELETE /api/notifications/[id] - Delete notification
 * 
 * @module api/notifications/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const notification = await db.notification.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: {
        ...notification,
        data: notification.data ? JSON.parse(notification.data) : null,
      },
    });

  } catch (error: any) {
    console.error('Get notification error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la notification' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Verify ownership
    const existingNotification = await db.notification.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification non trouvée' },
        { status: 404 }
      );
    }

    // Handle mark as read action
    if (action === 'read') {
      if (existingNotification.isRead) {
        return NextResponse.json({
          success: true,
          message: 'Notification déjà lue',
          alreadyRead: true,
        });
      }

      await db.notification.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: 'Notification marquée comme lue',
      });
    }

    // Handle mark as unread action
    if (action === 'unread') {
      await db.notification.update({
        where: { id },
        data: { isRead: false, readAt: null },
      });

      return NextResponse.json({
        success: true,
        message: 'Notification marquée comme non lue',
      });
    }

    return NextResponse.json(
      { error: 'Action non reconnue. Utilisez ?action=read ou ?action=unread' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership and delete
    const deletedNotification = await db.notification.deleteMany({
      where: { id, userId: session.user.id },
    });

    if (deletedNotification.count === 0) {
      return NextResponse.json(
        { error: 'Notification non trouvée ou accès refusé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification supprimée avec succès',
    });

  } catch (error: any) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la notification' },
      { status: 500 }
    );
  }
}

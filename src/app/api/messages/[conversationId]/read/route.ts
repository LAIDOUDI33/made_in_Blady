import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST: Mark all messages in a conversation as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { conversationId } = await params;
    const userId = session.user.id;

    // Verify user is a participant
    const participant = await db.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas participant de cette conversation' },
        { status: 403 }
      );
    }

    // Mark messages as read
    const result = await db.message.updateMany({
      where: {
        conversationId,
        toUserId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      markedAsRead: result.count,
    });
  } catch (error) {
    console.error('[Messages API] Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Erreur lors du marquage des messages comme lus' },
      { status: 500 }
    );
  }
}

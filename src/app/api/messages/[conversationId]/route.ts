import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { MessagesResponse, Message } from '@/types/message';

// GET: Get conversation messages (paginated)
export async function GET(
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
    const skip = (page - 1) * pageSize;

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

    // Get total count
    const total = await db.message.count({
      where: { conversationId },
    });

    // Get messages (newest first for pagination)
    const messages = await db.message.findMany({
      where: { conversationId },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    // Reverse to get chronological order
    const reversedMessages = messages.reverse();

    // Format messages
    const formattedMessages: Message[] = reversedMessages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      fromUserId: msg.fromUserId,
      toUserId: msg.toUserId,
      content: msg.content,
      fileType: msg.fileType,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      isRead: msg.isRead,
      fromUser: msg.fromUser,
      toUser: msg.toUser,
      createdAt: msg.createdAt,
    }));

    const hasMore = skip + messages.length < total;

    const response: MessagesResponse = {
      messages: formattedMessages,
      total,
      hasMore,
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Messages API] Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    );
  }
}

// POST: Send a message to conversation (API fallback)
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
    const body = await request.json();
    const { content, fileType, fileUrl, fileName } = body as {
      content?: string;
      fileType?: string;
      fileUrl?: string;
      fileName?: string;
    };

    // Validate message - must have content OR file
    if (!content && !fileUrl) {
      return NextResponse.json(
        { error: 'Le message ne peut pas être vide' },
        { status: 400 }
      );
    }

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

    // Get other participant's ID
    const otherParticipants = await db.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: userId },
      },
    });

    if (otherParticipants.length === 0) {
      return NextResponse.json(
        { error: 'Aucun destinataire trouvé' },
        { status: 400 }
      );
    }

    const toUserId = otherParticipants[0].userId;

    // Create message in database
    const message = await db.message.create({
      data: {
        conversationId,
        fromUserId: userId,
        toUserId,
        content: content || null,
        fileType: fileType || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    // Create notification for recipient (if not already created by socket)
    try {
      await db.notification.create({
        data: {
          userId: toUserId,
          type: 'NEW_MESSAGE',
          title: 'Nouveau message',
          message: `${session.user.name || "Quelqu'un"} vous a envoyé un message`,
          data: JSON.stringify({
            conversationId,
            messageId: message.id,
            fromUserId: userId,
          }),
        },
      });
    } catch (notifError) {
      console.error('[Messages API] Error creating notification:', notifError);
    }

    return NextResponse.json({
      id: message.id,
      conversationId: message.conversationId,
      success: true,
    });
  } catch (error) {
    console.error('[Messages API] Error sending message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    );
  }
}

// DELETE: Delete/hide conversation for user
export async function DELETE(
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
        { error: 'Conversation non trouvée' },
        { status: 404 }
      );
    }

    // For direct conversations, we could either:
    // 1. Remove the participant (soft delete for them)
    // 2. Delete the entire conversation
    
    // For now, let's just delete all messages sent TO this user and remove participation
    await db.$transaction([
      db.message.deleteMany({
        where: {
          conversationId,
          OR: [
            { fromUserId: userId },
            { toUserId: userId },
          ],
        },
      }),
      db.conversationParticipant.delete({
        where: { id: participant.id },
      }),
    ]);

    // Check if there are any participants left
    const remainingParticipants = await db.conversationParticipant.count({
      where: { conversationId },
    });

    // If no participants left, delete the conversation
    if (remainingParticipants === 0) {
      await db.conversation.delete({
        where: { id: conversationId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Messages API] Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la conversation' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { ConversationWithDetails, ConversationsResponse } from '@/types/message';

// GET: Get user's conversations with last message and unread count
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Get all conversations where user is a participant
    const participants = await db.conversationParticipant.findMany({
      where: {
        userId,
      },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    email: true,
                    role: true,
                    company: {
                      select: {
                        id: true,
                        name: true,
                        logo: true,
                      },
                    },
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                fromUser: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          lastMessageAt: 'desc',
        },
      },
    });

    // PERFORMANCE FIX: Batch all unread counts in ONE query instead of N+1 queries
    // This reduces database queries from (N+1) to just 2 total
    const conversationIds = participants.map(p => p.conversation.id);
    
    // Single batch query for all unread counts
    const unreadCountsBatch = await db.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversationIds },
        toUserId: userId,
        isRead: false,
      },
      _count: { id: true },
    });
    
    // Convert to Map for O(1) lookup
    const unreadCountMap = new Map(
      unreadCountsBatch.map(u => [u.conversationId, u._count.id])
    );

    // Format conversations (now with O(1) unread count lookup)
    let conversations: ConversationWithDetails[] = participants.map((participant) => {
      const conversation = participant.conversation;
      
      // Get other participant
      const otherParticipant = conversation.participants.find(p => p.userId !== userId);
      
      // Get unread count from pre-fetched map (no additional query!)
      const unreadCount = unreadCountMap.get(conversation.id) || 0;

      // Get last message
      const lastMessage = conversation.messages[0];

      return {
        id: conversation.id,
        type: conversation.type,
        participants: conversation.participants.map(p => ({
          id: p.id,
          userId: p.user.id,
          user: p.user,
          joinedAt: p.joinedAt,
        })),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          fileType: lastMessage.fileType,
          fileUrl: lastMessage.fileUrl,
          fileName: lastMessage.fileName,
          createdAt: lastMessage.createdAt,
          fromUser: lastMessage.fromUser,
        } : undefined,
        unreadCount,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        otherParticipant: otherParticipant ? {
          id: otherParticipant.id,
          userId: otherParticipant.user.id,
          user: otherParticipant.user,
          joinedAt: otherParticipant.joinedAt,
        } : undefined,
      };
    });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      conversations = conversations.filter(conv => 
        conv.otherParticipant?.user.name?.toLowerCase().includes(searchLower) ||
        conv.otherParticipant?.user.company?.name?.toLowerCase().includes(searchLower) ||
        conv.lastMessage?.content?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate total unread
    const unreadTotal = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

    const response: ConversationsResponse = {
      conversations,
      total: conversations.length,
      unreadTotal,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Messages API] Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des conversations' },
      { status: 500 }
    );
  }
}

// POST: Start a new conversation or get existing one
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { participantIds } = body as { participantIds?: string[] };

    if (!participantIds || participantIds.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un participant est requis' },
        { status: 400 }
      );
    }

    const currentUserId = session.user.id;
    const otherUserId = participantIds[0]; // For direct messages, we only support one other participant

    if (otherUserId === currentUserId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas créer une conversation avec vous-même' },
        { status: 400 }
      );
    }

    // Check if conversation already exists between these two users
    const existingConversation = await db.conversation.findFirst({
      where: {
        type: 'direct',
        participants: {
          every: {
            userId: { in: [currentUserId, otherUserId] },
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
                role: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (existingConversation) {
      // Verify both users are participants
      const participantIds = existingConversation.participants.map(p => p.userId);
      if (participantIds.includes(currentUserId) && participantIds.includes(otherUserId)) {
        return NextResponse.json({
          id: existingConversation.id,
          type: existingConversation.type,
          participants: existingConversation.participants,
          createdAt: existingConversation.createdAt,
          isNew: false,
        });
      }
    }

    // Create new conversation
    const conversation = await db.conversation.create({
      data: {
        type: 'direct',
        participants: {
          create: [
            { userId: currentUserId },
            { userId: otherUserId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
                role: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ...conversation,
      isNew: true,
    });
  } catch (error) {
    console.error('[Messages API] Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la conversation' },
      { status: 500 }
    );
  }
}

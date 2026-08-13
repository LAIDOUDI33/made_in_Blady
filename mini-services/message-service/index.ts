/**
 * AlgeriaTrade Real-time Messaging Service
 * WebSocket server using Socket.io for B2B messaging
 * Port: 3003
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const httpServer = createServer();
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || 'file:/home/z/my-project/db/custom.db',
});

// JWT Secret (same as NextAuth)
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'algeriatrade-secret-key-2024-production-b2b-platform-secure';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 messages per minute

// Online users tracking
const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
const socketUserMap = new Map<string, string>(); // socketId -> userId

// Typing users tracking
const typingUsers = new Map<string, Map<string, number>>(); // conversationId -> Map<userId, timeoutId>

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// Verify JWT token
async function verifyToken(token: string): Promise<{ id: string; email: string; name: string; role: string } | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.id) {
      return {
        id: decoded.id,
        email: decoded.email || '',
        name: decoded.name || '',
        role: decoded.role || '',
      };
    }
    return null;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Check rate limit
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Get or create direct conversation between two users
async function getOrCreateDirectConversation(user1Id: string, user2Id: string): Promise<string> {
  // Check if conversation already exists
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      type: 'direct',
      participants: {
        every: {
          userId: { in: [user1Id, user2Id] },
        },
      },
    },
    include: {
      participants: true,
    },
  });

  if (existingConversation) {
    // Verify both users are participants
    const participantIds = existingConversation.participants.map(p => p.userId);
    if (participantIds.includes(user1Id) && participantIds.includes(user2Id)) {
      return existingConversation.id;
    }
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      type: 'direct',
      participants: {
        create: [
          { userId: user1Id },
          { userId: user2Id },
        ],
      },
    },
  });

  return conversation.id;
}

// Format message for socket emission
function formatMessage(message: any) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    fromUserId: message.fromUserId,
    toUserId: message.toUserId,
    content: message.content,
    fileType: message.fileType,
    fileUrl: message.fileUrl,
    fileName: message.fileName,
    isRead: message.isRead,
    fromUser: {
      id: message.fromUser.id,
      name: message.fromUser.name || `${message.fromUser.firstName} ${message.fromUser.lastName}`,
      avatar: message.fromUser.avatar,
    },
    createdAt: message.createdAt.toISOString(),
  };
}

io.on('connection', async (socket) => {
  console.log(`[Messages] Socket connected: ${socket.id}`);

  // Authenticate with token
  socket.on('authenticate', async (data: { token: string }) => {
    try {
      const user = await verifyToken(data.token);
      if (!user) {
        socket.emit('error', { message: 'Authentification échouée', code: 'AUTH_FAILED' });
        socket.disconnect(true);
        return;
      }

      (socket as any).userId = user.id;
      (socket as any).user = user;

      // Track online user
      if (!onlineUsers.has(user.id)) {
        onlineUsers.set(user.id, new Set());
      }
      onlineUsers.get(user.id)!.add(socket.id);
      socketUserMap.set(socket.id, user.id);

      // Join all user's conversations rooms
      const conversations = await prisma.conversationParticipant.findMany({
        where: { userId: user.id },
        select: { conversationId: true },
      });

      conversations.forEach(({ conversationId }) => {
        socket.join(`conversation:${conversationId}`);
      });

      // Join personal room for direct messages
      socket.join(`user:${user.id}`);

      socket.emit('connected', { userId: user.id, socketId: socket.id });
      console.log(`[Messages] User authenticated: ${user.name} (${user.id})`);
      
      // Notify others that user is online
      socket.broadcast.emit('user:online', { userId: user.id });
      
    } catch (error) {
      console.error('[Messages] Authentication error:', error);
      socket.emit('error', { message: 'Erreur d\'authentification', code: 'AUTH_ERROR' });
    }
  });

  // Join a specific conversation room
  socket.on('join:conversation', async (data: { conversationId: string }) => {
    const userId = (socket as any).userId;
    if (!userId) {
      socket.emit('error', { message: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const { conversationId } = data;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      socket.emit('error', { message: 'Vous n\'êtes pas participant de cette conversation', code: 'FORBIDDEN' });
      return;
    }

    socket.join(`conversation:${conversationId}`);
    console.log(`[Messages] User ${userId} joined conversation ${conversationId}`);
    
    // Mark unread messages as read
    await markMessagesAsRead(conversationId, userId);
    
    // Notify others that user has read messages
    socket.to(`conversation:${conversationId}`).emit('message:read', {
      conversationId,
      userId,
    });
  });

  // Leave a conversation room
  socket.on('leave:conversation', (data: { conversationId: string }) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`[Messages] Socket ${socket.id} left conversation ${data.conversationId}`);
  });

  // Send a message
  socket.on('send:message', async (data: {
    conversationId?: string;
    toUserId?: string;
    content?: string;
    fileType?: string;
    fileUrl?: string;
    fileName?: string;
  }) => {
    const userId = (socket as any).userId;
    const user = (socket as any).user;
    
    if (!userId) {
      socket.emit('error', { message: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    // Rate limiting
    if (!checkRateLimit(userId)) {
      socket.emit('error', { message: 'Trop de messages. Veuillez réessayer plus tard.', code: 'RATE_LIMITED' });
      return;
    }

    // Validate message - must have content OR file
    if (!data.content && !data.fileUrl) {
      socket.emit('error', { message: 'Le message ne peut pas être vide', code: 'EMPTY_MESSAGE' });
      return;
    }

    try {
      let conversationId = data.conversationId;

      // If no conversationId but toUserId provided, get or create conversation
      if (!conversationId && data.toUserId) {
        conversationId = await getOrCreateDirectConversation(userId, data.toUserId);
        
        // Join the conversation room
        socket.join(`conversation:${conversationId}`);
        
        // Add recipient to room too (they'll join when they connect)
        const recipientSockets = onlineUsers.get(data.toUserId);
        if (recipientSockets) {
          recipientSockets.forEach(socketId => {
            io.sockets.sockets.get(socketId)?.join(`conversation:${conversationId}`);
          });
        }
      }

      if (!conversationId) {
        socket.emit('error', { message: 'Conversation requise', code: 'NO_CONVERSATION' });
        return;
      }

      // Verify participation
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

      if (!participant) {
        socket.emit('error', { message: 'Vous n\'êtes pas participant de cette conversation', code: 'FORBIDDEN' });
        return;
      }

      // Get other participant's ID
      const otherParticipants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: userId },
        },
      });

      if (otherParticipants.length === 0) {
        socket.emit('error', { message: 'Aucun destinataire trouvé', code: 'NO_RECIPIENT' });
        return;
      }

      const toUserId = otherParticipants[0].userId;

      // Create message in database
      const message = await prisma.message.create({
        data: {
          conversationId,
          fromUserId: userId,
          toUserId,
          content: data.content || null,
          fileType: data.fileType || null,
          fileUrl: data.fileUrl || null,
          fileName: data.fileName || null,
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
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
      });

      // Format and emit message
      const formattedMessage = formatMessage(message);

      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit('message:new', formattedMessage);

      // Emit to recipient's personal room (for notifications)
      io.to(`user:${toUserId}`).emit('message:new', formattedMessage);

      // Create notification for recipient
      try {
        await prisma.notification.create({
          data: {
            userId: toUserId,
            type: 'NEW_MESSAGE',
            title: 'Nouveau message',
            message: `${user?.name || "Quelqu'un"} vous a envoyé un message`,
            data: JSON.stringify({
              conversationId,
              messageId: message.id,
              fromUserId: userId,
            }),
          },
        });
      } catch (notifError) {
        console.error('[Messages] Error creating notification:', notifError);
      }

      console.log(`[Messages] Message sent from ${userId} in conversation ${conversationId}`);

    } catch (error) {
      console.error('[Messages] Error sending message:', error);
      socket.emit('error', { message: 'Erreur lors de l\'envoi du message', code: 'SEND_ERROR' });
    }
  });

  // Typing start indicator
  socket.on('typing:start', (data: { conversationId: string }) => {
    const userId = (socket as any).userId;
    const user = (socket as any).user;
    
    if (!userId || !data.conversationId) return;

    // Clear existing timeout if any
    const conversationTyping = typingUsers.get(data.conversationId);
    if (conversationTyping?.has(userId)) {
      clearTimeout(conversationTyping.get(userId)!);
    }

    // Set new timeout (stop typing after 3 seconds of inactivity)
    const timeoutId = setTimeout(() => {
      socket.to(`conversation:${data.conversationId}`).emit('user:stop-typing', {
        conversationId: data.conversationId,
        userId,
        userName: user?.name || 'Utilisateur',
        isTyping: false,
      });
      
      // Clean up
      typingUsers.get(data.conversationId)?.delete(userId);
    }, 3000);

    if (!typingUsers.has(data.conversationId)) {
      typingUsers.set(data.conversationId, new Map());
    }
    typingUsers.get(data.conversationId)!.set(userId, timeoutId);

    // Emit typing indicator to others in conversation
    socket.to(`conversation:${data.conversationId}`).emit('user:typing', {
      conversationId: data.conversationId,
      userId,
      userName: user?.name || 'Utilisateur',
      isTyping: true,
    });
  });

  // Typing stop indicator
  socket.on('typing:stop', (data: { conversationId: string }) => {
    const userId = (socket as any).userId;
    const user = (socket as any).user;
    
    if (!userId || !data.conversationId) return;

    // Clear timeout
    const conversationTyping = typingUsers.get(data.conversationId);
    if (conversationTyping?.has(userId)) {
      clearTimeout(conversationTyping.get(userId)!);
      conversationTyping.delete(userId);
    }

    socket.to(`conversation:${data.conversationId}`).emit('user:stop-typing', {
      conversationId: data.conversationId,
      userId,
      userName: user?.name || 'Utilisateur',
      isTyping: false,
    });
  });

  // Mark messages as read
  socket.on('mark:read', async (data: { conversationId: string; messageId?: string }) => {
    const userId = (socket as any).userId;
    
    if (!userId) return;

    await markMessagesAsRead(data.conversationId, userId);

    // Notify others
    socket.to(`conversation:${data.conversationId}`).emit('message:read', {
      conversationId: data.conversationId,
      userId,
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userId = socketUserMap.get(socket.id);
    
    if (userId) {
      // Remove socket from online users
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // User fully offline
          socket.broadcast.emit('user:offline', { userId });
        }
      }
      socketUserMap.delete(socket.id);
    }

    // Clean up typing indicators
    typingUsers.forEach((users, conversationId) => {
      if (users.has(socket.id)) {
        clearTimeout(users.get(socket.id)!);
        users.delete(socket.id);
      }
    });

    console.log(`[Messages] Socket disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`[Messages] Socket error (${socket.id}):`, error);
  });
});

// Helper function to mark messages as read
async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  try {
    await prisma.message.updateMany({
      where: {
        conversationId,
        toUserId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  } catch (error) {
    console.error('[Messages] Error marking messages as read:', error);
  }
}

// Get online status for users
export function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`[Messages] WebSocket service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Messages] Received SIGTERM signal, shutting down...');
  httpServer.close(() => {
    console.log('[Messages] Server closed');
    prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Messages] Received SIGINT signal, shutting down...');
  httpServer.close(() => {
    console.log('[Messages] Server closed');
    prisma.$disconnect();
    process.exit(0);
  });
});

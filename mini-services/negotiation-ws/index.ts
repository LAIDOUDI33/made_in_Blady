// Negotiation WebSocket Service
// خدمة WebSocket للمفاوضات - تحديثات فورية

import { Server } from 'socket.io';

interface NegotiationUpdatePayload {
  negotiationId: string;
  type: 'offer_created' | 'offer_countered' | 'offer_accepted' | 'offer_rejected' | 'offer_withdrawn' | 'negotiation_expired';
  data: any;
  userId?: string;
  timestamp: string;
}

interface NegotiationRoom {
  [negotiationId: string]: Set<string>; // userIds
}

const activeRooms: NegotiationRoom = {};

export function setupNegotiationSocket(io: Server) {
  console.log('🤝 Setting up negotiation WebSocket service...');

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to negotiations: ${socket.id}`);

    // Join a negotiation room for real-time updates
    socket.on('negotiation:join', (data: { negotiationId: string; userId: string }) => {
      const { negotiationId, userId } = data;
      
      socket.join(`negotiation:${negotiationId}`);
      
      // Track users in room
      if (!activeRooms[negotiationId]) {
        activeRooms[negotiationId] = new Set();
      }
      activeRooms[negotiationId].add(userId);
      
      socket.data.userId = userId;
      socket.data.negotiationId = negotiationId;

      console.log(`👥 User ${userId} joined negotiation ${negotiationId}`);
      
      // Notify others in the room
      socket.to(`negotiation:${negotiationId}`).emit('negotiation:user_joined', {
        negotiationId,
        userId,
        onlineUsers: Array.from(activeRooms[negotiationId] || []),
        timestamp: new Date().toISOString(),
      });

      // Confirm join to the user
      socket.emit('negotiation:joined', {
        negotiationId,
        onlineUsers: Array.from(activeRooms[negotiationId] || []),
        timestamp: new Date().toISOString(),
      });
    });

    // Leave a negotiation room
    socket.on('negotiation:leave', (data: { negotiationId: string }) => {
      const { negotiationId } = data;
      const userId = socket.data.userId;

      socket.leave(`negotiation:${negotiationId}`);
      
      if (activeRooms[negotiationId]) {
        activeRooms[negotiationId].delete(userId);
        
        if (activeRooms[negotiationId].size === 0) {
          delete activeRooms[negotiationId];
        }
      }

      console.log(`🚪 User ${userId} left negotiation ${negotiationId}`);

      socket.to(`negotiation:${negotiationId}`).emit('negotiation:user_left', {
        negotiationId,
        userId,
        onlineUsers: Array.from(activeRooms[negotiationId] || []),
        timestamp: new Date().toISOString(),
      });
    });

    // Typing indicator
    socket.on('negotiation:typing', (data: { negotiationId: string; isTyping: boolean }) => {
      const { negotiationId, isTyping } = data;
      const userId = socket.data.userId;

      socket.to(`negotiation:${negotiationId}`).emit('negotiation:user_typing', {
        negotiationId,
        userId,
        isTyping,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const negotiationId = socket.data.negotiationId;
      const userId = socket.data.userId;

      if (negotiationId && userId) {
        socket.to(`negotiation:${negotiationId}`).emit('negotiation:user_left', {
          negotiationId,
          userId,
          onlineUsers: Array.from(activeRooms[negotiationId] || []),
          timestamp: new Date().toISOString(),
        });

        if (activeRooms[negotiationId]) {
          activeRooms[negotiationId].delete(userId);
          
          if (activeRooms[negotiationId].size === 0) {
            delete activeRooms[negotiationId];
          }
        }
      }

      console.log(`🔌 Client disconnected from negotiations: ${socket.id}`);
    });
  });

  // Helper function to broadcast negotiation updates
  return {
    /**
     * Broadcast an update to all participants of a negotiation
     */
    broadcastUpdate(payload: NegotiationUpdatePayload) {
      const { negotiationId, type, data, userId } = payload;
      
      io.to(`negotiation:${negotiationId}`).emit('negotiation:update', payload);
      
      console.log(`📢 Broadcast ${type} for negotiation ${negotiationId}`);
    },

    /**
     * Send a notification to a specific user about a negotiation
     */
    notifyUser(userId: string, payload: Omit<NegotiationUpdatePayload, 'userId'>) {
      io.emit(`user:${userId}:notification`, {
        ...payload,
        userId,
      });
    },

    /**
     * Get online users count for a negotiation
     */
    getOnlineCount(negotiationId: string): number {
      return activeRooms[negotiationId]?.size || 0;
    },

    /**
     * Get all active rooms (for monitoring)
     */
    getActiveRooms(): NegotiationRoom {
      return { ...activeRooms };
    },
  };
}

// Export types for use in API routes
export type { NegotiationUpdatePayload };

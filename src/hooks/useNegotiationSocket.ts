'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface NegotiationUpdate {
  negotiationId: string;
  type: 'offer_created' | 'offer_countered' | 'offer_accepted' | 'offer_rejected' | 'offer_withdrawn' | 'negotiation_expired';
  data: any;
  userId?: string;
  timestamp: string;
}

interface OnlineUser {
  userId: string;
  isTyping: boolean;
}

interface UseNegotiationSocketOptions {
  negotiationId: string;
  userId: string;
  onNegotiationUpdate?: (update: NegotiationUpdate) => void;
  onUserJoined?: (userId: string, onlineUsers: string[]) => void;
  onUserLeft?: (userId: string, onlineUsers: string[]) => void;
  onUserTyping?: (userId: string, isTyping: boolean) => void;
  autoConnect?: boolean;
}

export function useNegotiationSocket({
  negotiationId,
  userId,
  onNegotiationUpdate,
  onUserJoined,
  onUserLeft,
  onUserTyping,
  autoConnect = true,
}: UseNegotiationSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Connect to the negotiation room
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io('/', {
      query: { XTransformPort: process.env.NEXT_PUBLIC_NEGOTIATION_WS_PORT || '3004' },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to negotiation WebSocket');
      setIsConnected(true);

      // Join the negotiation room
      socket.emit('negotiation:join', { negotiationId, userId });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from negotiation WebSocket');
      setIsConnected(false);
    });

    // Listen for negotiation updates
    socket.on('negotiation:update', (update: NegotiationUpdate) => {
      onNegotiationUpdate?.(update);
    });

    // Listen for user join/leave events
    socket.on('negotiation:user_joined', (data: { negotiationId: string; userId: string; onlineUsers: string[] }) => {
      setOnlineUsers(data.onlineUsers);
      onUserJoined?.(data.userId, data.onlineUsers);
    });

    socket.on('negotiation:user_left', (data: { negotiationId: string; userId: string; onlineUsers: string[] }) => {
      setOnlineUsers(data.onlineUsers);
      onUserLeft?.(data.userId, data.onlineUsers);
    });

    // Listen for typing indicators
    socket.on('negotiation:user_typing', (data: { negotiationId: string; userId: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
      onUserTyping?.(data.userId, data.isTyping);
    });

    // Confirm joined
    socket.on('negotiation:joined', (data: { onlineUsers: string[] }) => {
      setOnlineUsers(data.onlineUsers);
    });

    socketRef.current = socket;
  }, [negotiationId, userId, onNegotiationUpdate, onUserJoined, onUserLeft, onUserTyping]);

  // Disconnect from the negotiation room
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('negotiation:leave', { negotiationId });
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers([]);
      setTypingUsers(new Set());
    }
  }, [negotiationId]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('negotiation:typing', { negotiationId, isTyping });
    }
  }, [negotiationId]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && negotiationId && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, negotiationId, userId, connect, disconnect]);

  return {
    isConnected,
    onlineUsers,
    typingUsers: Array.from(typingUsers),
    isUserTyping: (checkUserId: string) => typingUsers.has(checkUserId),
    sendTypingIndicator,
    reconnect: connect,
    disconnect,
  };
}

export type { NegotiationUpdate, UseNegotiationSocketOptions };
export default useNegotiationSocket;

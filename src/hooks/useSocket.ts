'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import type { SocketMessage, TypingIndicator } from '@/types/message';

interface UseSocketOptions {
  autoConnect?: boolean;
  onNewMessage?: (message: SocketMessage) => void;
  onMessageDelivered?: (data: { messageId: string; conversationId: string }) => void;
  onMessageRead?: (data: { conversationId: string; userId: string }) => void;
  onUserTyping?: (data: TypingIndicator) => void;
  onUserStopTyping?: (data: TypingIndicator) => void;
  onUserOnline?: (data: { userId: string }) => void;
  onUserOffline?: (data: { userId: string }) => void;
  onError?: (error: { message: string; code?: string }) => void;
  onConnected?: (data: { userId: string; socketId: string }) => void;
}

interface QueuedMessage {
  event: string;
  data: any;
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    autoConnect = true,
    onNewMessage,
    onMessageDelivered,
    onMessageRead,
    onUserTyping,
    onUserStopTyping,
    onUserOnline,
    onUserOffline,
    onError,
    onConnected,
  } = options;

  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const isAuthenticatedRef = useRef(false);

  // Get auth token for socket
  const getAuthToken = useCallback(() => {
    // The session token from NextAuth
    return session?.user?.id ? 'authenticated' : null;
  }, [session]);

  // Process queued messages when connected
  const processQueue = useCallback((socket: Socket) => {
    while (messageQueueRef.current.length > 0) {
      const item = messageQueueRef.current.shift();
      if (item) {
        socket.emit(item.event, item.data);
      }
    }
  }, []);

  // Queue a message to send later if not connected
  const queueMessage = useCallback((event: string, data: any) => {
    messageQueueRef.current.push({ event, data });
    
    // Limit queue size
    if (messageQueueRef.current.length > 50) {
      messageQueueRef.current.shift();
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id || !autoConnect) {
      return;
    }

    // Create socket connection
    // Using XTransformPort query parameter for gateway routing
    const socket = io('/', {
      query: {
        XTransformPort: '3003',
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Connection established
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
      setIsReconnecting(false);

      // Authenticate with NextAuth token
      // We use a simple token based on user ID for this implementation
      // In production, you'd want proper JWT handling
      socket.emit('authenticate', {
        token: session.user.id, // Simplified - in production use actual JWT
        userId: session.user.id,
      });
    });

    // Authentication successful
    socket.on('connected', (data: { userId: string; socketId: string }) => {
      isAuthenticatedRef.current = true;
      onConnected?.(data);
      
      // Process any queued messages
      processQueue(socket);
    });

    // New message received
    socket.on('message:new', (message: SocketMessage) => {
      onNewMessage?.(message);
    });

    // Message delivered
    socket.on('message:delivered', (data: { messageId: string; conversationId: string }) => {
      onMessageDelivered?.(data);
    });

    // Messages read by other user
    socket.on('message:read', (data: { conversationId: string; userId: string }) => {
      onMessageRead?.(data);
    });

    // User typing indicator
    socket.on('user:typing', (data: TypingIndicator) => {
      onUserTyping?.(data);
    });

    // User stopped typing
    socket.on('user:stop-typing', (data: TypingIndicator) => {
      onUserStopTyping?.(data);
    });

    // User came online
    socket.on('user:online', (data: { userId: string }) => {
      onUserOnline?.(data);
    });

    // User went offline
    socket.on('user:offline', (data: { userId: string }) => {
      onUserOffline?.(data);
    });

    // Error handling
    socket.on('error', (error: { message: string; code?: string }) => {
      console.error('[Socket] Error:', error);
      onError?.(error);
    });

    // Reconnection attempt
    socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket] Reconnection attempt ${attempt}`);
      setIsReconnecting(true);
    });

    // Reconnected successfully
    socket.io.on('reconnect', () => {
      console.log('[Socket] Reconnected');
      setIsReconnecting(false);
      
      // Re-authenticate
      socket.emit('authenticate', {
        token: session.user.id,
        userId: session.user.id,
      });
    });

    // Reconnection failed
    socket.io.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed');
      setIsReconnecting(false);
      onError?.({ message: 'Impossible de se reconnecter au serveur de messagerie' });
    });

    // Disconnected
    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      isAuthenticatedRef.current = false;

      if (reason === 'io server disconnect') {
        // Server disconnected us, need to manually reconnect
        socket.connect();
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      isAuthenticatedRef.current = false;
    };
  }, [
    session?.user?.id,
    autoConnect,
    onNewMessage,
    onMessageDelivered,
    onMessageRead,
    onUserTyping,
    onUserStopTyping,
    onUserOnline,
    onUserOffline,
    onError,
    onConnected,
    processQueue,
  ]);

  // Join a conversation room
  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current && isConnected && isAuthenticatedRef.current) {
      socketRef.current.emit('join:conversation', { conversationId });
    } else {
      queueMessage('join:conversation', { conversationId });
    }
  }, [isConnected, queueMessage]);

  // Leave a conversation room
  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current && isAuthenticatedRef.current) {
      socketRef.current.emit('leave:conversation', { conversationId });
    }
  }, []);

  // Send a message
  const sendMessage = useCallback((data: {
    conversationId?: string;
    toUserId?: string;
    content?: string;
    fileType?: string;
    fileUrl?: string;
    fileName?: string;
  }) => {
    if (socketRef.current && isConnected && isAuthenticatedRef.current) {
      socketRef.current.emit('send:message', data);
      return true;
    } else {
      queueMessage('send:message', data);
      return false;
    }
  }, [isConnected, queueMessage]);

  // Start typing indicator
  const startTyping = useCallback((conversationId: string) => {
    if (socketRef.current && isConnected && isAuthenticatedRef.current) {
      socketRef.current.emit('typing:start', { conversationId });
    }
  }, [isConnected]);

  // Stop typing indicator
  const stopTyping = useCallback((conversationId: string) => {
    if (socketRef.current && isConnected && isAuthenticatedRef.current) {
      socketRef.current.emit('typing:stop', { conversationId });
    }
  }, [isConnected]);

  // Mark messages as read
  const markAsRead = useCallback((conversationId: string, messageId?: string) => {
    if (socketRef.current && isConnected && isAuthenticatedRef.current) {
      socketRef.current.emit('mark:read', { conversationId, messageId });
    }
  }, [isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    isReconnecting,
    isAuthenticated: isAuthenticatedRef.current,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  };
}

export default useSocket;

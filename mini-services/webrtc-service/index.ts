// WebRTC Signaling Server
// Socket.io-based signaling for AlgeriaTrade.dz B2B Platform Voice/Video Calls
// Port: 3002

import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { ICE_SERVERS, type IceServerConfig } from './stun-turn-config';
import { CallRecorder, RecordingOptions, type RecordingInfo } from './recorder';

// ============================================
// Type Definitions
// ============================================

interface SocketUser {
  id: string;
  name: string;
  avatar?: string;
  socketId: string;
  onlineAt: Date;
  lastSeen: Date;
}

interface CallRoom {
  id: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  calleeName: string;
  callType: 'AUDIO' | 'VIDEO' | 'SCREEN_SHARE';
  status: 'INITIATING' | 'RINGING' | 'CONNECTED' | 'ON_HOLD' | 'ENDED' | 'DECLINED' | 'FAILED';
  createdAt: Date;
  connectedAt?: Date;
  endedAt?: Date;
  iceServers: IceServerConfig[];
  metadata?: Record<string, unknown>;
}

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
}

// ============================================
// In-Memory Stores (Production would use Redis)
// ============================================

const connectedUsers = new Map<string, SocketUser>(); // userId -> SocketUser
const activeRooms = new Map<string, CallRoom>(); // roomId -> CallRoom
const userRooms = new Map<string, Set<string>>(); // userId -> Set of roomIds
const roomMessages = new Map<string, ChatMessage[]>(); // roomId -> messages
const callRecorders = new Map<string, CallRecorder>(); // roomId -> recorder

// Configuration
const PORT = parseInt(process.env.PORT || '3002', 10);
const CALL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CALL_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours max

// ============================================
// Initialize Socket.IO Server
// ============================================

const io = new Server({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/',
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ============================================
// Helper Functions
// ============================================

function generateRoomId(): string {
  return `room_${Date.now()}_${uuidv4().substring(0, 8)}`;
}

function getUserSocket(userId: string): string | null {
  const user = connectedUsers.get(userId);
  return user?.socketId || null;
}

function trackUserRoom(userId: string, roomId: string): void {
  if (!userRooms.has(userId)) {
    userRooms.set(userId, new Set());
  }
  userRooms.get(userId)!.add(roomId);
}

function untrackUserRoom(userId: string, roomId: string): void {
  const rooms = userRooms.get(userId);
  if (rooms) {
    rooms.delete(roomId);
    if (rooms.size === 0) {
      userRooms.delete(userId);
    }
  }
}

function cleanupRoom(roomId: string): void {
  const room = activeRooms.get(roomId);
  if (room) {
    untrackUserRoom(room.callerId, roomId);
    untrackUserRoom(room.calleeId, roomId);
    activeRooms.delete(roomId);
    
    // Stop recording if active
    const recorder = callRecorders.get(roomId);
    if (recorder) {
      recorder.stop();
      callRecorders.delete(roomId);
    }
  }
  
  // Clean up messages after delay
  setTimeout(() => {
    roomMessages.delete(roomId);
  }, 3600000); // Keep messages for 1 hour
}

function emitToUser(userId: string, event: string, data: unknown): boolean {
  const socketId = getUserSocket(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
}

function broadcastToRoom(roomId: string, event: string, data: unknown, excludeUserId?: string): void {
  const room = activeRooms.get(roomId);
  if (!room) return;

  if (excludeUserId !== room.callerId) {
    emitToUser(room.callerId, event, data);
  }
  if (excludeUserId !== room.calleeId) {
    emitToUser(room.calleeId, event, data);
  }
}

// Cleanup interval for stale calls
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startCleanup(): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    
    for (const [roomId, room] of activeRooms.entries()) {
      const isActive = ['INITIATING', 'RINGING', 'CONNECTED', 'ON_HOLD'].includes(room.status);
      const age = now - new Date(room.createdAt).getTime();
      
      // Auto-end stale calls
      if (isActive && age > CALL_TIMEOUT_MS && room.status === 'RINGING') {
        endCallInternal(roomId, 'SYSTEM_TIMEOUT', 'Call timed out - no answer');
      }
      
      // Auto-end calls that exceed max duration
      if (room.status === 'CONNECTED' && room.connectedAt) {
        const connectedAge = now - new Date(room.connectedAt).getTime();
        if (connectedAge > MAX_CALL_DURATION_MS) {
          endCallInternal(roomId, 'SYSTEM_TIMEOUT', 'Maximum call duration exceeded');
        }
      }
    }
  }, 30000); // Check every 30 seconds
}

function endCallInternal(
  roomId: string,
  endedBy: string,
  reason?: string
): void {
  const room = activeRooms.get(roomId);
  if (!room || room.status === 'ENDED' || room.status === 'DECLINED') return;

  const previousStatus = room.status;
  room.status = 'ENDED';
  room.endedAt = new Date();

  // Notify both parties
  broadcastToRoom(roomId, 'call:ended', {
    roomId,
    endedBy,
    reason: reason || `Call ended by ${endedBy}`,
    previousStatus,
    endedAt: room.endedAt,
  });

  console.log(`[WebRTC] Call ${roomId} ended by ${endedBy}: ${reason || 'No reason'}`);

  // Schedule cleanup
  setTimeout(() => cleanupRoom(roomId), 5000);
}

// ============================================
// Socket Event Handlers
// ============================================

io.on('connection', (socket) => {
  console.log(`[WebRTC] Client connected: ${socket.id}`);

  // ==========================================
  // User Registration
  // ==========================================

  /**
   * Register user with their identity
   */
  socket.on('user:register', (data: { userId: string; name: string; avatar?: string }) => {
    const { userId, name, avatar } = data;

    const user: SocketUser = {
      id: userId,
      name,
      avatar,
      socketId: socket.id,
      onlineAt: new Date(),
      lastSeen: new Date(),
    };

    connectedUsers.set(userId, user);
    socket.userId = userId;

    console.log(`[WebRTC] User registered: ${name} (${userId})`);

    // Notify user of successful registration
    socket.emit('user:registered', {
      success: true,
      userId,
      message: 'Successfully connected to signaling server',
    });

    // Broadcast user's online status to their contacts (optional)
    socket.broadcast.emit('user:online', {
      userId,
      name,
      avatar,
    });
  });

  // ==========================================
  // Room / Call Management
  // ==========================================

  /**
   * Initiate a new call (caller creates room)
   */
  socket.on('call:initiate', async (data: {
    calleeId: string;
    calleeName: string;
    calleeAvatar?: string;
    callType: 'AUDIO' | 'VIDEO' | 'SCREEN_SHARE';
    metadata?: Record<string, unknown>;
  }) => {
    const callerId = socket.userId;
    if (!callerId) {
      socket.emit('error', { code: 'UNAUTHORIZED', message: 'Please register first' });
      return;
    }

    const caller = connectedUsers.get(callerId);
    if (!caller) {
      socket.emit('error', { code: 'NOT_FOUND', message: 'Caller not found' });
      return;
    }

    // Generate unique room ID
    const roomId = generateRoomId();

    // Create room
    const room: CallRoom = {
      id: roomId,
      callerId,
      calleeId: data.calleeId,
      callerName: caller.name,
      calleeName: data.calleeName,
      callType: data.callType,
      status: 'INITIATING',
      createdAt: new Date(),
      iceServers: ICE_SERVERS,
      metadata: data.metadata,
    };

    activeRooms.set(roomId, room);
    trackUserRoom(callerId, roomId);
    trackUserRoom(data.calleeId, roomId);

    // Join socket to room for broadcasting
    socket.join(roomId);

    // Send room info to caller
    socket.emit('call:initiated', {
      roomId,
      room,
      message: `Initiating ${data.callType.toLowerCase()} call to ${data.calleeName}`,
    });

    // Notify callee about incoming call
    const notified = emitToUser(data.calleeId, 'call:incoming', {
      roomId,
      callerId,
      callerName: caller.name,
      callerAvatar: caller.avatar,
      callType: data.callType,
      metadata: data.metadata,
      initiatedAt: room.createdAt,
    });

    if (notified) {
      room.status = 'RINGING';
      activeRooms.set(roomId, room);

      // Confirm to caller that callee has been notified
      socket.emit('call:ringing', {
        roomId,
        status: 'RINGING',
        message: `${data.calleeName} is being called...`,
      });
    } else {
      // Callee is offline - notify caller
      socket.emit('call:failed', {
        roomId,
        code: 'USER_OFFLINE',
        message: `${data.calleeName} is currently offline`,
      });
      cleanupRoom(roomId);
    }

    console.log(`[WebRTC] Call initiated: ${roomId} from ${caller.name} to ${data.calleeName}`);
  });

  /**
   * Join an existing room (callee accepts)
   */
  socket.on('call:join', (data: { roomId: string }) => {
    const userId = socket.userId;
    if (!userId) {
      socket.emit('error', { code: 'UNAUTHORIZED', message: 'Please register first' });
      return;
    }

    const room = activeRooms.get(data.roomId);
    if (!room) {
      socket.emit('error', { code: 'NOT_FOUND', message: 'Room not found or expired' });
      return;
    }

    // Verify user is part of this call
    if (room.calleeId !== userId) {
      socket.emit('error', { code: 'FORBIDDEN', message: 'You are not authorized to join this call' });
      return;
    }

    // Join socket room
    socket.join(data.roomId);

    // Update room status
    room.status = 'CONNECTED';
    room.connectedAt = new Date();
    activeRooms.set(data.roomId, room);

    // Notify both parties that call is connected
    io.to(data.roomId).emit('call:connected', {
      roomId: data.roomId,
      connectedAt: room.connectedAt,
      iceServers: room.iceServers,
    });

    console.log(`[WebRTC] User ${userId} joined room ${data.roomId}`);
  });

  /**
   * Decline incoming call
   */
  socket.on('call:decline', (data: { roomId: string; reason?: string }) => {
    const userId = socket.userId;
    if (!userId) return;

    const room = activeRooms.get(data.roomId);
    if (!room) return;

    if (room.calleeId !== userId) {
      socket.emit('error', { code: 'FORBIDDEN', message: 'Not authorized' });
      return;
    }

    room.status = 'DECLINED';
    room.endedAt = new Date();
    activeRooms.set(data.roomId, room);

    // Notify caller about decline
    emitToUser(room.callerId, 'call:declined', {
      roomId: data.roomId,
      declinedBy: userId,
      reason: data.reason || 'Call declined',
      declinedAt: room.endedAt,
    });

    // Leave socket room
    socket.leave(data.roomId);

    console.log(`[WebRTC] Call ${data.roomId} declined by ${userId}`);

    // Cleanup
    setTimeout(() => cleanupRoom(data.roomId), 5000);
  });

  /**
   * End/hangup call
   */
  socket.on('call:end', (data: { roomId: string; reason?: string }) => {
    const userId = socket.userId;
    if (!userId) return;

    const room = activeRooms.get(data.roomId);
    if (!room) return;

    // Verify user is in this call
    if (room.callerId !== userId && room.calleeId !== userId) {
      socket.emit('error', { code: 'FORBIDDEN', message: 'Not authorized' });
      return;
    }

    endCallInternal(data.roomId, userId, data.reason);

    // Leave socket room
    socket.leave(data.roomId);
  });

  // ==========================================
  // WebRTC Signaling Events
  // ==========================================

  /**
   * Send SDP offer
   */
  socket.on('signal:offer', (data: {
    roomId: string;
    offer: RTCSessionDescriptionInit;
  }) => {
    const room = activeRooms.get(data.roomId);
    if (!room) return;

    // Forward offer to the other party
    const targetId = socket.userId === room.callerId ? room.calleeId : room.callerId;
    
    emitToUser(targetId, 'signal:offer', {
      roomId: data.roomId,
      from: socket.userId,
      offer: data.offer,
    });

    console.log(`[WebRTC] Offer forwarded in room ${data.roomId}`);
  });

  /**
   * Send SDP answer
   */
  socket.on('signal:answer', (data: {
    roomId: string;
    answer: RTCSessionDescriptionInit;
  }) => {
    const room = activeRooms.get(data.roomId);
    if (!room) return;

    // Forward answer to the other party
    const targetId = socket.userId === room.callerId ? room.calleeId : room.callerId;
    
    emitToUser(targetId, 'signal:answer', {
      roomId: data.roomId,
      from: socket.userId,
      answer: data.answer,
    });

    console.log(`[WebRTC] Answer forwarded in room ${data.roomId}`);
  });

  /**
   * Exchange ICE candidates
   */
  socket.on('signal:ice-candidate', (data: {
    roomId: string;
    candidate: RTCIceCandidateInit;
  }) => {
    const room = activeRooms.get(data.roomId);
    if (!room) return;

    // Forward ICE candidate to the other party
    const targetId = socket.userId === room.callerId ? room.calleeId : room.callerId;
    
    emitToUser(targetId, 'signal:ice-candidate', {
      roomId: data.roomId,
      from: socket.userId,
      candidate: data.candidate,
    });
  });

  // ==========================================
  // Call Control Events
  // ==========================================

  /**
   * Toggle audio mute
   */
  socket.on('call:toggle-audio', (data: { roomId: string; muted: boolean }) => {
    const room = activeRooms.get(data.roomId);
    if (!room) return;

    broadcastToRoom(data.roomId, 'call:audio-toggled', {
      roomId: data.roomId,
      userId: socket.userId,
      muted: data.muted,
    }, socket.userId);
  });

  /**
   * Toggle video on/off
   */
  socket.on('call:toggle-video', (data: { roomId: string; videoOff: boolean }) => {
    const room = activeRooms.get(data.roomId);
    if (!room) return;

    broadcastToRoom(data.roomId, 'call:video-toggled', {
      roomId: data.roomId,
      userId: socket.userId,
      videoOff: data.videoOff,
    }, socket.userId);
  });

  /**
   * Start/stop screen sharing
   */
  socket.on('call:screen-share', (data: { roomId: string; sharing: boolean }) => {
    const room = activeRooms.get(data.roomId);
    if (!room) return;

    if (data.sharing) {
      room.callType = 'SCREEN_SHARE';
    } else {
      room.callType = 'VIDEO';
    }
    activeRooms.set(data.roomId, room);

    broadcastToRoom(data.roomId, 'call:screen-share-changed', {
      roomId: data.roomId,
      userId: socket.userId,
      sharing: data.sharing,
    }, socket.userId);
  });

  /**
   * Hold/resume call
   */
  socket.on('call:hold', (data: { roomId: string; onHold: boolean }) => {
    const room = activeRooms.get(data.roomId);
    if (!room) return;

    room.status = data.onHold ? 'ON_HOLD' : 'CONNECTED';
    activeRooms.set(data.roomId, room);

    broadcastToRoom(data.roomId, 'call:hold-changed', {
      roomId: data.roomId,
      userId: socket.userId,
      onHold: data.onHold,
    });
  });

  // ==========================================
  // Chat During Call
  // ==========================================

  /**
   * Send chat message during call
   */
  socket.on('chat:message', (data: { roomId: string; content: string; type?: 'text' | 'file' }) => {
    const userId = socket.userId;
    if (!userId) return;

    const room = activeRooms.get(data.roomId);
    if (!room) return;

    const user = connectedUsers.get(userId);
    if (!user) return;

    const message: ChatMessage = {
      id: uuidv4(),
      roomId: data.roomId,
      senderId: userId,
      senderName: user.name,
      content: data.content,
      timestamp: new Date(),
      type: data.type || 'text',
    };

    // Store message
    if (!roomMessages.has(data.roomId)) {
      roomMessages.set(data.roomId, []);
    }
    roomMessages.get(data.roomId)!.push(message);

    // Broadcast to room
    broadcastToRoom(data.roomId, 'chat:message', message);

    console.log(`[WebRTC] Chat message in room ${data.roomId}: ${data.content.substring(0, 50)}...`);
  });

  /**
   * Get chat history for room
   */
  socket.on('chat:history', (data: { roomId: string }) => {
    const messages = roomMessages.get(data.roomId) || [];
    socket.emit('chat:history', {
      roomId: data.roomId,
      messages: messages.slice(-100), // Last 100 messages
    });
  });

  // ==========================================
  // Recording
  // ==========================================

  /**
   * Start/stop recording
   */
  socket.on('call:recording', async (data: { roomId: string; recording: boolean; options?: RecordingOptions }) => {
    const userId = socket.userId;
    if (!userId) return;

    const room = activeRooms.get(data.roomId);
    if (!room) return;

    if (data.recording) {
      // Start recording
      try {
        const recorder = new CallRecorder(data.roomId, data.options);
        await recorder.start();
        callRecorders.set(data.roomId, recorder);

        broadcastToRoom(data.roomId, 'call:recording-started', {
          roomId: data.roomId,
          startedBy: userId,
          startedAt: new Date(),
        });

        console.log(`[WebRTC] Recording started for room ${data.roomId}`);
      } catch (error) {
        socket.emit('error', {
          code: 'RECORDING_ERROR',
          message: 'Failed to start recording',
        });
      }
    } else {
      // Stop recording
      const recorder = callRecorders.get(data.roomId);
      if (recorder) {
        const recordingInfo = await recorder.stop();
        callRecorders.delete(data.roomId);

        broadcastToRoom(data.roomId, 'call:recording-stopped', {
          roomId: data.roomId,
          stoppedBy: userId,
          stoppedAt: new Date(),
          recording: recordingInfo,
        });

        console.log(`[WebRTC] Recording stopped for room ${data.roomId}`);
      }
    }
  });

  // ==========================================
  // Connection & Status
  // ==========================================

  /**
   * Get list of online users (for presence)
   */
  socket.on('users:online', () => {
    const users = Array.from(connectedUsers.values()).map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      onlineAt: u.onlineAt,
    }));

    socket.emit('users:list', { users, count: users.length });
  });

  /**
   * Check if specific user is online
   */
  socket.on('user:status', (data: { userIds: string[] }) => {
    const statuses: Record<string, boolean> = {};
    
    for (const userId of data.userIds) {
      statuses[userId] = connectedUsers.has(userId);
    }

    socket.emit('user:status-response', statuses);
  });

  /**
   * Ping/pong for connection health
   */
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // ==========================================
  // Disconnect Handler
  // ==========================================

  socket.on('disconnect', (reason) => {
    const userId = socket.userId;
    console.log(`[WebRTC] Client disconnected: ${socket.id}, reason: ${reason}`);

    if (userId) {
      // Update user's last seen
      const user = connectedUsers.get(userId);
      if (user) {
        user.lastSeen = new Date();
      }

      // Find all active calls for this user and handle disconnection
      const userActiveRoomIds = userRooms.get(userId);
      if (userActiveRoomIds) {
        for (const roomId of userActiveRoomIds) {
          const room = activeRooms.get(roomId);
          if (room && ['INITIATING', 'RINGING', 'CONNECTED', 'ON_HOLD'].includes(room.status)) {
            // Notify other party about disconnection
            const otherPartyId = room.callerId === userId ? room.calleeId : room.callerId;
            
            emitToUser(otherPartyId, 'call:disconnected', {
              roomId,
              disconnectedUserId: userId,
              reason: 'Connection lost',
            });

            // End the call due to disconnection
            if (room.status === 'CONNECTED' || room.status === 'ON_HOLD') {
              endCallInternal(roomId, userId, 'User disconnected');
            } else if (room.status === 'RINGING') {
              // If still ringing, mark as missed
              room.status = 'ENDED';
              room.endedAt = new Date();
              activeRooms.set(roomId, room);
              
              emitToUser(otherPartyId, 'call:missed', {
                roomId,
                message: 'Call was not answered',
              });
              
              setTimeout(() => cleanupRoom(roomId), 5000);
            }
          }
        }
      }

      // Remove from connected users (after a delay to allow reconnection)
      setTimeout(() => {
        const currentUser = connectedUsers.get(userId);
        if (currentUser && currentUser.socketId === socket.id) {
          connectedUsers.delete(userId);
          
          // Broadcast offline status
          io.emit('user:offline', { userId });
          
          console.log(`[WebRTC] User removed: ${userId}`);
        }
      }, 30000); // 30 second grace period for reconnection
    }
  });
});

// ============================================
// Start Server
// ============================================

startCleanup();

io.listen(PORT);
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎙️  WebRTC Signaling Server Started                     ║
║   📍  AlgeriaTrade.dz B2B Platform                        ║
║   🔌  Port: ${PORT.toString().padEnd(44)}║
║   📅  ${new Date().toISOString().padEnd(48)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[WebRTC] SIGTERM received, shutting down gracefully...');
  io.close(() => {
    console.log('[WebRTC] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[WebRTC] SIGINT received, shutting down gracefully...');
  io.close(() => {
    console.log('[WebRTC] Server closed');
    process.exit(0);
  });
});

export { io, connectedUsers, activeRooms };

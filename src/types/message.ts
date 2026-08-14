// Message Types for AlgeriaTrade Messaging System

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    company?: {
      id: string;
      name: string;
      logo?: string | null;
    } | null;
  };
  joinedAt: Date;
}

export interface Conversation {
  id: string;
  type: string;
  participants: ConversationParticipant[];
  lastMessage?: {
    id: string;
    content: string | null;
    fileType: string | null;
    fileUrl: string | null;
    fileName: string | null;
    createdAt: Date;
    fromUser: {
      id: string;
      name: string;
      avatar?: string | null;
    };
  };
  unreadCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  content: string | null;
  fileType: string | null;
  fileUrl: string | null;
  fileName: string | null;
  isRead: boolean;
  fromUser: {
    id: string;
    name: string;
    avatar?: string | null;
    firstName: string;
    lastName: string;
  };
  toUser: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  createdAt: Date;
}

export interface SendMessagePayload {
  conversationId: string;
  content?: string;
  fileType?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface SocketMessage {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  content: string | null;
  fileType?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  isRead: boolean;
  fromUser: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  createdAt: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ConversationWithDetails extends Conversation {
  // Additional computed fields
  otherParticipant?: ConversationParticipant;
  isOnline?: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

export interface ConversationsResponse {
  conversations: ConversationWithDetails[];
  total: number;
  unreadTotal: number;
}

// Socket event types
export interface SocketEvents {
  // Client -> Server
  'join:conversation': (data: { conversationId: string }) => void;
  'leave:conversation': (data: { conversationId: string }) => void;
  'send:message': (data: SendMessagePayload) => void;
  'typing:start': (data: { conversationId: string }) => void;
  'typing:stop': (data: { conversationId: string }) => void;
  'mark:read': (data: { conversationId: string; messageId?: string }) => void;

  // Server -> Client
  'message:new': (message: SocketMessage) => void;
  'message:delivered': (data: { messageId: string; conversationId: string }) => void;
  'message:read': (data: { conversationId: string; userId: string }) => void;
  'user:typing': (data: TypingIndicator) => void;
  'user:stop-typing': (data: TypingIndicator) => void;
  'error': (error: { message: string; code?: string }) => void;
  'connected': (data: { userId: string; socketId: string }) => void;
}
